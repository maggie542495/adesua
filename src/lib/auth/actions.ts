"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import { loginSchema, setupOwnerSchema } from "@/lib/validation/auth";
import {
  sendInvitationAcceptedEmail,
  sendSignInAlertEmail,
  sendWelcomeEmail,
} from "@/lib/email/send";
import { recordAnonymousAudit, recordAudit } from "@/lib/admin/audit";
import { ROLE_LABELS } from "@/lib/auth/roles";

export interface AuthState {
  status: "idle" | "error";
  message?: string;
  /** Field name → first message for that field. */
  fieldErrors?: Record<string, string>;
}

function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !out[key]) out[key] = issue.message;
  }
  return out;
}

/** Only follow a `next` that points back into this site. */
function safeNext(value: FormDataEntryValue | null): string {
  const raw = typeof value === "string" ? value : "";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/auth")) return "/admin";
  return raw;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // A failed sign-in is worth recording even though nobody is signed in: a
    // run of them against one address is the only signal of an attack here.
    await recordAnonymousAudit({
      action: "sign_in_failed",
      resourceType: "auth",
      email: parsed.data.email,
      metadata: { reason: "invalid_credentials" },
    });

    // Deliberately vague: never reveal whether the address exists.
    return { status: "error", message: "That email and password do not match." };
  }

  // Signed in, but an admin profile is what actually grants access.
  const session = await getAdminSession();
  if (!session) {
    await supabase.auth.signOut();
    redirect("/auth/login?denied=1");
  }

  /**
   * `last_login_at` was declared on the table but never written, so every team
   * screen said "never signed in". Stamp it here, and let the audit row follow.
   */
  await supabase
    .from("admin_profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", session.user.id);

  await recordAudit(session, {
    action: "sign_in",
    resourceType: "auth",
    resourceId: session.user.id,
  });

  // A sign-in notice is a courtesy, never a gate — a mail outage must not
  // block someone who has already authenticated.
  const signedInAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  const userAgent = (await headers()).get("user-agent");

  await sendSignInAlertEmail({
    name: session.profile.full_name ?? "",
    email: session.user.email ?? "",
    signedInAt,
    userAgent,
  }).catch((mailError) => console.error("[auth] sign-in notice failed", mailError));

  redirect(safeNext(formData.get("next")));
}

/**
 * One-time owner bootstrap.
 *
 * There is no public sign-up: the first owner is created here, guarded by
 * `ADMIN_SETUP_SECRET`, and only while no owner exists. Everyone after that
 * arrives through an invitation.
 */
export async function setupOwner(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = setupOwnerSchema.safeParse({
    setupSecret: formData.get("setupSecret"),
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFrom(parsed.error),
    };
  }

  const expected = process.env.ADMIN_SETUP_SECRET;
  if (!expected) {
    return {
      status: "error",
      message: "Owner setup is turned off: ADMIN_SETUP_SECRET is not set on this deployment.",
    };
  }

  if (parsed.data.setupSecret !== expected) {
    return { status: "error", message: "That setup secret is not valid." };
  }

  if (!process.env.SUPABASE_SECRET_KEY) {
    return {
      status: "error",
      message: "Owner setup needs SUPABASE_SECRET_KEY to create the account.",
    };
  }

  const admin = createAdminClient();

  const { count, error: countError } = await admin
    .from("admin_profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");

  if (countError) return { status: "error", message: countError.message };

  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message: "An owner already exists. Ask them to invite you instead.",
    };
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.fullName },
  });

  if (createError || !created.user) {
    return { status: "error", message: createError?.message ?? "Could not create the account." };
  }

  const { error: profileError } = await admin.from("admin_profiles").insert({
    id: created.user.id,
    email: parsed.data.email,
    full_name: parsed.data.fullName,
    role: "owner",
    status: "active",
  });

  if (profileError) {
    // No orphaned auth user if the profile could not be written.
    await admin.auth.admin.deleteUser(created.user.id);
    return { status: "error", message: profileError.message };
  }

  // The account exists from here on, so the welcome email must not be able to
  // fail the signup — a mail outage should never strand a created owner.
  await sendWelcomeEmail({
    name: parsed.data.fullName,
    email: parsed.data.email,
    role: ROLE_LABELS.owner,
    signInUrl: `${siteBaseUrl()}/auth/login`,
    isOwner: true,
  }).catch((error) => console.error("[auth] welcome email failed", error));

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) redirect("/auth/login");

  redirect("/admin");
}

function siteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export interface InvitationLookup {
  email: string;
  role: keyof typeof ROLE_LABELS;
  expiresAt: string;
  invitedBy: string | null;
}

/**
 * Resolves an invitation token for the accept screen. Returns null for a
 * token that is unknown, already used or expired — the page then shows the
 * same "this link is no longer valid" state for all three.
 */
export async function lookupInvitation(token: string): Promise<InvitationLookup | null> {
  if (!token || !process.env.SUPABASE_SECRET_KEY) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_invitations")
    .select("email, role, expires_at, accepted_at, invited_by")
    .eq("token_hash", await hashToken(token))
    .maybeSingle();

  if (!data || data.accepted_at) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;

  let invitedBy: string | null = null;
  if (data.invited_by) {
    const { data: inviter } = await admin
      .from("admin_profiles")
      .select("full_name, email")
      .eq("id", data.invited_by)
      .maybeSingle();
    invitedBy = inviter?.full_name || inviter?.email || null;
  }

  return {
    email: data.email,
    role: data.role as keyof typeof ROLE_LABELS,
    expiresAt: data.expires_at,
    invitedBy,
  };
}

/**
 * Accepts an invitation: creates the auth user, writes the admin profile with
 * the invited role, marks the invitation used, signs in and sends the welcome
 * email. The email address always comes from the invitation, never the form.
 */
export async function acceptInvitation(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const token = String(formData.get("token") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!token) return { status: "error", message: "This invitation link is incomplete." };
  if (fullName.length < 2) {
    return { status: "error", fieldErrors: { fullName: "Enter your full name." } };
  }
  if (password.length < 12) {
    return {
      status: "error",
      fieldErrors: { password: "Use at least 12 characters." },
    };
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    return { status: "error", message: "Invitations need SUPABASE_SECRET_KEY on this deployment." };
  }

  const invitation = await lookupInvitation(token);
  if (!invitation) {
    return {
      status: "error",
      message: "This invitation has expired or has already been used. Ask for a fresh one.",
    };
  }

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return {
      status: "error",
      message:
        createError?.message ??
        "That address may already have an account. Try signing in instead.",
    };
  }

  const { error: profileError } = await admin.from("admin_profiles").insert({
    id: created.user.id,
    email: invitation.email,
    full_name: fullName,
    role: invitation.role,
    status: "active",
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { status: "error", message: profileError.message };
  }

  await admin
    .from("admin_invitations")
    .update({ accepted_at: new Date().toISOString() })
    .eq("token_hash", await hashToken(token));

  await recordAnonymousAudit({
    action: "invite_accepted",
    resourceType: "admin_invitations",
    email: invitation.email,
    metadata: { role: invitation.role, profileId: created.user.id },
  });

  await Promise.allSettled([
    sendWelcomeEmail({
      name: fullName,
      email: invitation.email,
      role: ROLE_LABELS[invitation.role],
      signInUrl: `${siteBaseUrl()}/auth/login`,
    }),
    sendInvitationAcceptedEmail({
      name: fullName,
      email: invitation.email,
      role: ROLE_LABELS[invitation.role],
    }),
  ]);

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password,
  });

  if (signInError) redirect("/auth/login");

  redirect("/admin");
}
