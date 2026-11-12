"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { sendInvitationEmail } from "@/lib/email/send";
import { recordAudit } from "@/lib/admin/audit";
import {
  addressBlockedBy,
  canInviteAtRole,
  INVITE_TTL_DAYS,
} from "@/lib/admin/invitations";
import type { AdminRole } from "@/lib/auth/roles";

export interface InviteState {
  status: "idle" | "success" | "error";
  message?: string;
  /** The address the last invitation went to, so the form can confirm it. */
  email?: string;
  /** Shown only when mail failed — the one case where the link must be copied. */
  fallbackUrl?: string;
}

const INVITE_PATH = "/admin/admin_invitations";

const InviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  role: z.enum(["editor", "administrator", "owner"]),
});

function siteBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Issues an invitation.
 *
 * The token exists in clear only long enough to be hashed and put in the email;
 * the database keeps the hash. That way a stolen database dump cannot be turned
 * into studio access, and the same mail cannot be replayed after it lapses.
 */
export async function inviteAdmin(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const session = await requireAdmin("administrator");

  const parsed = InviteSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "editor"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const { email, role } = parsed.data;

  if (!canInviteAtRole(session, role as AdminRole)) {
    return { status: "error", message: "Only an owner can invite another owner." };
  }

  const blocked = await addressBlockedBy(email);
  if (blocked) return { status: "error", message: blocked };

  const token = crypto.randomUUID();
  const tokenHash = await hashToken(token);
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  // Written through the service role: the invitation is a credential, and RLS
  // has no insert path for one from the browser.
  const admin = createAdminClient();
  const { data: inserted, error } = await admin
    .from("admin_invitations")
    .insert({
      email,
      role,
      token_hash: tokenHash,
      invited_by: session.user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) return { status: "error", message: error.message };

  const acceptUrl = `${siteBase()}/auth/setup?invite=${token}`;
  const mail = await sendInvitationEmail({
    email,
    role,
    acceptUrl,
    expiresAt: expiresAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    invitedBy: session.profile.full_name || session.user.email,
  });

  await recordAudit(session, {
    action: "invite_sent",
    resourceType: "admin_invitations",
    resourceId: inserted?.id ? String(inserted.id) : null,
    metadata: { email, role, delivered: mail.sent },
  });

  revalidatePath(INVITE_PATH);

  if (!mail.sent) {
    return {
      status: "success",
      email,
      fallbackUrl: acceptUrl,
      message: `Invitation created for ${email}, but the email could not be sent. Copy the link below and pass it on directly — it works once and expires in ${INVITE_TTL_DAYS} days.`,
    };
  }

  return {
    status: "success",
    email,
    message: `Invitation emailed to ${email}. They have ${INVITE_TTL_DAYS} days to set a password.`,
  };
}

/**
 * Revokes an invitation that has not been accepted.
 *
 * The row is kept — the record of who was invited, by whom and when is worth
 * having — but its token is blanked so the emailed link stops working.
 */
export async function revokeInvitation(formData: FormData): Promise<void> {
  const session = await requireAdmin("administrator");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("admin_invitations")
    .select("email, accepted_at")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.accepted_at) return;

  await admin.from("admin_invitations").update({ token_hash: "" }).eq("id", id);

  await recordAudit(session, {
    action: "invite_revoked",
    resourceType: "admin_invitations",
    resourceId: id,
    metadata: { email: row.email },
  });

  revalidatePath(INVITE_PATH);
}

/**
 * Re-invites an address whose link lapsed.
 *
 * The stored hash cannot be reversed into the old link, so this revokes it and
 * issues a fresh invitation — same effect for the person receiving it, and the
 * expired row stays visible as history.
 */
export async function resendInvitation(formData: FormData): Promise<void> {
  const session = await requireAdmin("administrator");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("admin_invitations")
    .select("email, role, accepted_at")
    .eq("id", id)
    .maybeSingle();

  if (!row || row.accepted_at) return;

  if (!canInviteAtRole(session, row.role)) return;

  await admin.from("admin_invitations").update({ token_hash: "" }).eq("id", id);

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000);

  const { data: inserted } = await admin
    .from("admin_invitations")
    .insert({
      email: row.email,
      role: row.role,
      token_hash: await hashToken(token),
      invited_by: session.user.id,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .maybeSingle();

  await sendInvitationEmail({
    email: row.email,
    role: row.role,
    acceptUrl: `${siteBase()}/auth/setup?invite=${token}`,
    expiresAt: expiresAt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    invitedBy: session.profile.full_name || session.user.email,
  });

  await recordAudit(session, {
    action: "invite_sent",
    resourceType: "admin_invitations",
    resourceId: inserted?.id ? String(inserted.id) : null,
    metadata: { email: row.email, role: row.role, resent: true },
  });

  revalidatePath(INVITE_PATH);
}

/**
 * Changes a member's role or suspends them.
 *
 * Guard rails that matter: nobody may change their own role (that is how an
 * owner locks themselves out), only an owner may touch owners, and the studio
 * must keep at least one active owner.
 */
export async function setMemberRole(formData: FormData): Promise<void> {
  const session = await requireAdmin("owner");
  const id = String(formData.get("id") ?? "");
  const role = String(formData.get("role") ?? "") as AdminRole;
  if (!id || !["editor", "administrator", "owner"].includes(role)) return;
  if (id === session.user.id) return;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("admin_profiles")
    .select("role, email, status")
    .eq("id", id)
    .maybeSingle();

  if (!target) return;
  if (target.role === "owner" && session.profile.role !== "owner") return;

  if (target.role === "owner" && role !== "owner") {
    const { count } = await admin
      .from("admin_profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("status", "active");

    if ((count ?? 0) <= 1) return;
  }

  await admin.from("admin_profiles").update({ role }).eq("id", id);

  await recordAudit(session, {
    action: "role_changed",
    resourceType: "admin_profiles",
    resourceId: id,
    metadata: { email: target.email, from: target.role, to: role },
  });

  revalidatePath(INVITE_PATH);
}

export async function setMemberSuspended(formData: FormData): Promise<void> {
  const session = await requireAdmin("owner");
  const id = String(formData.get("id") ?? "");
  const suspend = String(formData.get("suspend") ?? "") === "true";
  if (!id || id === session.user.id) return;

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("admin_profiles")
    .select("role, email, status")
    .eq("id", id)
    .maybeSingle();

  if (!target) return;
  if (target.role === "owner" && session.profile.role !== "owner") return;

  if (suspend && target.role === "owner") {
    const { count } = await admin
      .from("admin_profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("status", "active");

    if ((count ?? 0) <= 1) return;
  }

  await admin
    .from("admin_profiles")
    .update({
      status: suspend ? "suspended" : "active",
      deactivated_at: suspend ? new Date().toISOString() : null,
    })
    .eq("id", id);

  await recordAudit(session, {
    action: suspend ? "member_suspended" : "member_restored",
    resourceType: "admin_profiles",
    resourceId: id,
    metadata: { email: target.email },
  });

  revalidatePath(INVITE_PATH);
}

