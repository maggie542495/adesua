"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { sendEnquiryEmail } from "@/lib/email/mailer";
import { createAdminClient } from "@/lib/supabase/admin";

export interface EnquiryState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Always returned so the visitor has a route that cannot fail. */
  mailto?: string;
}

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const EnquirySchema = z.object({
  name: z.string().trim().min(1, "Please add your name.").max(200),
  email: z
    .string()
    .trim()
    .min(3, "Please add your email address.")
    .max(320)
    .regex(EMAIL_PATTERN, "That email address does not look right."),
  phone: z.string().trim().max(40).optional(),
  category: z.enum(["coaching", "consulting", "speaking", "writing", "other"]),
  subject: z.string().trim().max(200).optional(),
  message: z
    .string()
    .trim()
    .min(10, "A sentence or two is enough to start.")
    .max(20000, "That message is a little too long — please shorten it."),
  pathway: z.enum(["personal-growth", "professional-impact"]).optional(),
  source: z.string().trim().max(40).optional(),
});

/** Builds a mailto link so there is always a way through, even if the server fails. */
export function buildMailto(input: {
  name?: string;
  email?: string;
  category?: string;
  message?: string;
}): string {
  const subject = encodeURIComponent(
    `${input.category ? `[${input.category}] ` : ""}Enquiry from ${input.name || "the website"}`,
  );
  const body = encodeURIComponent(
    [
      input.message || "",
      "",
      "—",
      input.name ? `From: ${input.name}` : "",
      input.email ? `Reply to: ${input.email}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return `mailto:${siteConfig.links.email}?subject=${subject}&body=${body}`;
}

export async function submitEnquiry(
  _previous: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? "") || undefined,
    category: String(formData.get("category") ?? "") || "other",
    subject: String(formData.get("subject") ?? "") || undefined,
    message: String(formData.get("message") ?? ""),
    pathway: String(formData.get("pathway") ?? "") || undefined,
    source: String(formData.get("source") ?? "") || "contact-form",
  };

  const mailto = buildMailto(raw);

  // Honeypot: a real person never fills a field they cannot see.
  if (String(formData.get("company") ?? "").length > 0) {
    // Pretend it worked so the bot does not learn anything.
    return { status: "success", message: "Thank you — your message is on its way.", mailto };
  }

  const parsed = EnquirySchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "message");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors,
      mailto,
    };
  }

  const data = parsed.data;

  // ── 1. Store it. Best-effort: email is the delivery route she actually reads.
  let stored = false;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("enquiries").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject || null,
      category: data.category,
      message: data.message,
      pathway: data.pathway || null,
      source: data.source || "contact-form",
    });
    if (error) console.error("[enquiry] store failed", error.message);
    else stored = true;
  } catch (error) {
    console.error("[enquiry] store unavailable", error);
  }

  // ── 2. Deliver it to her inbox, with the visitor as Reply-To.
  const mail = await sendEnquiryEmail({
    name: data.name,
    email: data.email,
    phone: data.phone || null,
    category: data.category,
    subject: data.subject || null,
    message: data.message,
    pathway: data.pathway || null,
    source: data.source || "contact-form",
  });

  if (stored && mail.sent) {
    revalidatePath("/admin/enquiries");
    return {
      status: "success",
      message: `Thank you, ${data.name.split(" ")[0]}. Your message is with Adesua — she replies within one working day.`,
      mailto,
    };
  }

  if (stored) {
    revalidatePath("/admin/enquiries");
    return {
      status: "success",
      message:
        "Thank you — your message has been saved and will be answered within one working day.",
      mailto,
    };
  }

  if (mail.sent) {
    return {
      status: "success",
      message: `Thank you, ${data.name.split(" ")[0]}. Your message is with Adesua — she replies within one working day.`,
      mailto,
    };
  }

  return {
    status: "error",
    message:
      "I could not deliver that just now. Please use the direct email link below — nothing is lost.",
    mailto,
  };
}

/** Fingerprint used for debouncing repeat submissions without storing raw IPs. */
export async function hashRequestOrigin(): Promise<string | null> {
  try {
    const headerList = await headers();
    const ip =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      null;
    const agent = headerList.get("user-agent") || "";
    if (!ip) return null;
    return createHash("sha256").update(`${ip}:${agent}`).digest("hex").slice(0, 32);
  } catch {
    return null;
  }
}
