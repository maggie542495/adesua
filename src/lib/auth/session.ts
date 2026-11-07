import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { roleAtLeast, type AdminRole } from "@/lib/auth/roles";
import type { Tables } from "@/types/database";

export type AdminProfile = Tables<"admin_profiles">;

export type AdminSession = {
  user: { id: string; email: string };
  profile: AdminProfile;
};

/**
 * Resolve the signed-in admin from the auth session + admin_profiles.
 * Returns null when not signed in, suspended, or missing a profile.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.status !== "active") return null;

  return {
    user: { id: user.id, email: user.email ?? profile.email },
    profile,
  };
}

/** Require an active admin with at least `minRole`; redirect to login otherwise. */
export async function requireAdmin(minRole: AdminRole = "editor"): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!roleAtLeast(session.profile.role, minRole)) {
    redirect("/admin?forbidden=1");
  }

  return session;
}

/** API-route variant: returns an error result instead of redirecting. */
export async function requireAdminApi(
  minRole: AdminRole = "editor",
): Promise<
  | { ok: true; session: AdminSession }
  | { ok: false; status: 401 | 403; error: string }
> {
  const session = await getAdminSession();

  if (!session) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  if (!roleAtLeast(session.profile.role, minRole)) {
    return { ok: false, status: 403, error: "Insufficient permissions" };
  }

  return { ok: true, session };
}
