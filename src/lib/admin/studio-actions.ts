"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import {
  isMailConfigured,
  sendInvitationEmail,
  sendPasswordChangedEmail,
  sendTestEmail,
  sendVisitorReply,
} from "@/lib/email/send";
import { draftEmailReply } from "@/lib/zee/assistant";

export interface StudioState {
  status: "idle" | "success" | "error";
  message?: string;
}

/* ── Email Studio ──────────────────────────────────────────────────── */

const ReplySchema = z.object({
  enquiryId: z.string().uuid(),
  to: z.string().email(),
  name: z.string().trim().max(200).optional(),
  subject: z.string().trim().min(1, "Add a subject.").max(200),
  body: z.string().trim().min(2, "Write a reply first.").max(20000),
});

export async function replyToEnquiry(
  _previous: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const session = await requireAdmin("editor");

  const parsed = ReplySchema.safeParse({
    enquiryId: String(formData.get("enquiryId") ?? ""),
    to: String(formData.get("to") ?? ""),
    name: String(formData.get("name") ?? "") || undefined,
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Please check the reply.",
    };
  }

  const data = parsed.data;
  const result = await sendVisitorReply({
    to: data.to,
    name: data.name ?? "there",
    subject: data.subject,
    body: data.body,
  });

  if (!result.sent) {
    return {
      status: "error",
      message: result.reason ?? "The reply could not be sent. Check the mail settings.",
    };
  }

  try {
    const supabase = createAdminClient();
    await supabase
      .from("enquiries")
      .update({ status: "awaiting_response", updated_at: new Date().toISOString() })
      .eq("id", data.enquiryId);

    /**
     * The column is `body`, not `note` — this insert used to fail against a
     * column that does not exist, so no reply Adesua sent was ever recorded
     * against its enquiry. `is_internal: false` marks it as something that
     * actually went to the visitor, which is what the enquiry page reads back.
     */
    await supabase.from("enquiry_notes").insert({
      enquiry_id: data.enquiryId,
      author_id: session.user.id,
      body: `Re: ${data.subject}\n\n${data.body}`,
      is_internal: false,
    });
  } catch (error) {
    console.error("[studio] reply bookkeeping failed", error);
  }

  revalidatePath("/admin/email-studio");
  revalidatePath("/admin/enquiries");
  // The reply is recorded on the enquiry, so its page re-reads the thread.
  revalidatePath(`/admin/enquiries/${data.enquiryId}`);
  return { status: "success", message: `Reply sent to ${data.to}.` };
}

export interface DraftState {
  ok: boolean;
  body?: string;
  message?: string;
}

/**
 * Draft a reply to an enquiry in Adesua's voice. The draft lands in the
 * composer for her to read, edit and send — Zee never sends on its own from
 * the studio, so nothing leaves the studio unreviewed.
 */
export async function draftEnquiryReply(enquiryId: string): Promise<DraftState> {
  await requireAdmin("editor");
  if (!enquiryId) return { ok: false, message: "Choose an enquiry first." };

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("enquiries")
    .select("name, email, subject, message, category")
    .eq("id", enquiryId)
    .maybeSingle();

  if (!data) return { ok: false, message: "That enquiry could not be found." };

  const draft = await draftEmailReply({
    name: String(data.name ?? "there"),
    email: data.email ? String(data.email) : null,
    subject: data.subject ? String(data.subject) : null,
    message: String(data.message ?? ""),
    category: data.category ? String(data.category) : null,
    kind: "reply",
  });

  return { ok: true, body: draft.body };
}

export async function setEnquiryStatus(formData: FormData) {
  await requireAdmin("editor");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !status) return;

  const supabase = await createClient();
  await supabase
    .from("enquiries")
    .update({ status: status as never, updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/email-studio");
  revalidatePath("/admin/enquiries");
  revalidatePath(`/admin/enquiries/${id}`);
}

/* ── Notifications ─────────────────────────────────────────────────── */

export async function markNotificationRead(formData: FormData) {
  const session = await requireAdmin("editor");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", session.user.id);

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

export async function markAllNotificationsRead() {
  const session = await requireAdmin("editor");
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", session.user.id)
    .eq("is_read", false);

  revalidatePath("/admin");
  revalidatePath("/admin/notifications");
}

/* ── Site settings ─────────────────────────────────────────────────── */

export async function saveSiteSettings(
  _previous: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const session = await requireAdmin("administrator");
  const supabase = await createClient();

  const entries = Array.from(formData.entries()).filter(([key]) =>
    key.startsWith("setting:"),
  );

  if (!entries.length) {
    return { status: "error", message: "Nothing to save." };
  }

  for (const [key, value] of entries) {
    const settingKey = key.replace("setting:", "");
    const raw = String(value);
    let parsed: unknown = raw;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }

    const { error } = await supabase.from("site_settings").upsert(
      {
        key: settingKey,
        value: parsed as never,
        updated_by: session.user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) {
      return { status: "error", message: `${settingKey}: ${error.message}` };
    }
  }

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { status: "success", message: "Settings saved." };
}

/* ── Invitations ───────────────────────────────────────────────────── */

const InviteSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(["editor", "administrator", "owner"]),
});

export async function inviteAdmin(
  _previous: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const session = await requireAdmin("owner");

  const parsed = InviteSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "editor"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const { email, role } = parsed.data;
  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const supabase = await createClient();
  const { error } = await supabase.from("admin_invitations").insert({
    email,
    role,
    token_hash: tokenHash,
    invited_by: session.user.id,
    expires_at: expiresAt.toISOString(),
  });

  if (error) return { status: "error", message: error.message };

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const mail = await sendInvitationEmail({
    email,
    role,
    acceptUrl: `${base.replace(/\/$/, "")}/auth/setup?invite=${token}`,
    expiresAt: expiresAt.toLocaleDateString("en-GB"),
    invitedBy: session.profile.full_name || session.user.email,
  });

  revalidatePath("/admin/admin_invitations");
  return {
    status: "success",
    message: mail.sent
      ? `Invitation sent to ${email}.`
      : `Invitation created for ${email}, but the email could not be sent. Share the link manually.`,
  };
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* ── Security ──────────────────────────────────────────────────────── */

const PasswordSchema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters."),
    confirm: z.string(),
  })
  .refine((value) => value.password === value.confirm, {
    message: "The two passwords do not match.",
    path: ["confirm"],
  });

export async function changePassword(
  _previous: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const session = await requireAdmin("editor");

  const parsed = PasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) return { status: "error", message: error.message };

  // The password is already changed, so a mail outage must not report failure.
  const changedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  await sendPasswordChangedEmail({
    name: session.profile.full_name ?? "",
    email: session.user.email ?? "",
    changedAt,
  }).catch((mailError) => console.error("[security] password notice failed", mailError));

  revalidatePath("/admin/security");
  return { status: "success", message: "Password updated." };
}

export async function signOutEverywhere() {
  await requireAdmin("editor");
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/auth/login");
}

/* ── Email diagnostics ─────────────────────────────────────────────── */

/**
 * Sends a real message through the configured SMTP transport so the studio
 * can prove delivery end to end, rather than trusting a status badge.
 */
export async function sendTestEmailAction(
  _previous: StudioState,
  formData: FormData,
): Promise<StudioState> {
  const session = await requireAdmin("administrator");

  if (!isMailConfigured()) {
    return {
      status: "error",
      message:
        "SMTP is not configured. Set ZOHO_SMTP_HOST, ZOHO_SMTP_USER and ZOHO_SMTP_PASSWORD, then restart the server.",
    };
  }

  const requested = String(formData.get("to") ?? "").trim();
  const to = requested || session.user.email || "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { status: "error", message: "Enter a valid address to send the test to." };
  }

  const result = await sendTestEmail(to);

  revalidatePath("/admin/email-studio");
  return result.sent
    ? { status: "success", message: `Test email sent to ${to}. Check the inbox.` }
    : { status: "error", message: result.reason ?? "The test email could not be sent." };
}
