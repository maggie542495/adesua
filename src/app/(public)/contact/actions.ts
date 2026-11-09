"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sendAutoReply, sendEnquiryEmail, sendOwnerAlert } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { draftEmailReply } from "@/lib/zee/assistant";
import { siteConfig } from "@/config/site";

export interface EnquiryState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Values echoed back so a failed submit never loses what was typed. */
  values?: {
    name?: string;
    email?: string;
    phone?: string;
    category?: string;
    subject?: string;
    message?: string;
  };
  reference?: string;
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
  category: z.enum(["coaching", "consulting", "speaking", "writing", "other"], {
    message: "Please choose what brings you here.",
  }),
  subject: z.string().trim().max(200).optional(),
  message: z
    .string()
    .trim()
    .min(10, "A sentence or two is enough to start.")
    .max(20000, "That message is a little too long — please shorten it."),
  pathway: z.enum(["personal-growth", "professional-impact"]).optional(),
  source: z.string().trim().max(40).optional(),
});

function isOutsideWorkingHours(date = new Date()): boolean {
  const day = date.getDay();
  const hour = date.getHours();
  return day === 0 || day === 6 || hour < 9 || hour >= 17;
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

  const values = {
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? "",
    category: raw.category,
    subject: raw.subject ?? "",
    message: raw.message,
  };

  // Honeypot: bots fill the hidden field, humans never see it.
  if (String(formData.get("company") ?? "").length > 0) {
    return { status: "success", message: "Thank you — your message is on its way." };
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
      values,
    };
  }

  const data = parsed.data;
  let enquiryId: string | null = null;
  let stored = false;

  try {
    const supabase = createAdminClient();
    const { data: inserted, error } = await supabase
      .from("enquiries")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject || null,
        category: data.category,
        message: data.message,
        pathway: data.pathway || null,
        source: data.source || "contact-form",
        status: "new",
      })
      .select("id")
      .single();

    if (error) console.error("[enquiry] store failed", error.message);
    else {
      stored = true;
      enquiryId = inserted?.id ?? null;
    }
  } catch (error) {
    console.error("[enquiry] store unavailable", error);
  }

  const outsideHours = isOutsideWorkingHours();

  // Zee writes the acknowledgement in Adesua's voice, grounded in her own
  // record. It falls back to a hand-written template if every model is down,
  // so an enquiry is never left unanswered.
  const [mail, draft] = await Promise.all([
    sendEnquiryEmail({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      category: data.category,
      subject: data.subject || null,
      message: data.message,
      pathway: data.pathway || null,
      source: data.source || "contact-form",
    }),
    draftEmailReply({
      name: data.name,
      email: data.email,
      subject: data.subject || null,
      message: data.message,
      category: data.category,
      kind: "acknowledgement",
    }),
  ]);

  const autoReply = await sendAutoReply({
    name: data.name,
    email: data.email,
    message: data.message,
    reply: draft.body,
    outsideHours,
  });

  if (stored) {
    revalidatePath("/admin/enquiries");
    await sendOwnerAlert({
      title: `New ${data.category} enquiry`,
      body: `${data.name} (${data.email}) wrote: "${data.message.slice(0, 140)}"`,
      link: enquiryId ? `/admin/enquiries/${enquiryId}` : "/admin/enquiries",
      quiet: mail.sent,
    });
  }

  if (stored || mail.sent) {
    const firstName = data.name.split(" ")[0];
    const acknowledgement = autoReply.sent
      ? `A confirmation is on its way to ${data.email}.`
      : "";
    const timing = outsideHours
      ? "It arrived outside working hours, so I will reply on the next working day."
      : "I reply within one working day.";

    return {
      status: "success",
      message: `Thank you, ${firstName}. Your message is with me — ${timing} ${acknowledgement}`.trim(),
      reference: enquiryId ?? undefined,
    };
  }

  return {
    status: "error",
    message: `I could not deliver that just now. Please write to ${siteConfig.links.email} directly — nothing is lost.`,
    values,
  };
}
