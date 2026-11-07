"use server";

import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminSession } from "@/lib/auth/session";
import { loginSchema, setupOwnerSchema } from "@/lib/validation/auth";

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
    // Deliberately vague: never reveal whether the address exists.
    return { status: "error", message: "That email and password do not match." };
  }

  // Signed in, but an admin profile is what actually grants access.
  const session = await getAdminSession();
  if (!session) {
    await supabase.auth.signOut();
    redirect("/auth/login?denied=1");
  }

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

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) redirect("/auth/login");

  redirect("/admin");
}
