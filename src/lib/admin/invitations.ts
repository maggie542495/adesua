import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { roleAtLeast, type AdminRole } from "@/lib/auth/roles";
import type { AdminSession } from "@/lib/auth/session";

/**
 * Invitations, read through the service role.
 *
 * A token is only ever stored as a hash, so an invitation cannot be re-sent
 * from its row — the link in the original email is the only copy. That is the
 * right trade for a credential, and it is why "resend" below issues a new
 * invitation rather than replaying the old one.
 */

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

/** How long a fresh invitation stays usable. */
export const INVITE_TTL_DAYS = 7;

export interface InvitationRecord {
  id: string;
  email: string;
  role: AdminRole;
  invitedBy: string | null;
  invitedById: string | null;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  status: InvitationStatus;
  daysLeft: number;
}

export interface InvitationStats {
  pending: number;
  accepted: number;
  expired: number;
  revoked: number;
  team: number;
}

interface InvitationRow {
  id: string;
  email: string;
  role: AdminRole;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

/**
 * Accepted and still-open are facts in the row. Expiry is a fact of the clock,
 * and revoked is the absence of an unspent token — but this schema has no
 * `revoked_at`, so a revoked row is one whose `token_hash` was blanked. Both are
 * derived here, once, so the list, the filters and the counts cannot disagree.
 */
function deriveStatus(row: InvitationRow & { token_hash?: string | null }): InvitationStatus {
  if (row.accepted_at) return "accepted";
  if (!row.token_hash) return "revoked";
  if (new Date(row.expires_at).getTime() < Date.now()) return "expired";
  return "pending";
}

function daysLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000));
}

async function inviterNames(ids: string[]): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return names;

  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_profiles")
    .select("id, full_name, email")
    .in("id", unique);

  for (const profile of data ?? []) {
    names.set(profile.id, profile.full_name || profile.email);
  }
  return names;
}

export async function listInvitations(): Promise<InvitationRecord[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_invitations")
    .select("id, email, role, invited_by, expires_at, accepted_at, created_at, token_hash")
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (data ?? []) as (InvitationRow & { token_hash: string | null })[];
  const names = await inviterNames(rows.map((row) => row.invited_by ?? ""));

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    invitedBy: row.invited_by ? names.get(row.invited_by) ?? null : null,
    invitedById: row.invited_by,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
    status: deriveStatus(row),
    daysLeft: daysLeft(row.expires_at),
  }));
}

/** Counts for the header strip, derived from the same rows the list shows. */
export function summariseInvitations(invitations: readonly InvitationRecord[]): InvitationStats {
  return {
    pending: invitations.filter((row) => row.status === "pending").length,
    accepted: invitations.filter((row) => row.status === "accepted").length,
    expired: invitations.filter((row) => row.status === "expired").length,
    revoked: invitations.filter((row) => row.status === "revoked").length,
    team: 0,
  };
}

export interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  role: AdminRole;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  isSelf: boolean;
}

/** Everyone with an admin profile — the people invitations have produced. */
export async function listTeam(session: AdminSession): Promise<TeamMember[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_profiles")
    .select("id, email, full_name, role, status, last_login_at, created_at")
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    status: row.status,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    isSelf: row.id === session.user.id,
  }));
}

/**
 * Whether an address can be invited at all: not already on the team, not
 * already holding a live invitation. Owners and administrators can both send
 * invitations; only owners may mint one at their own level or above, which is
 * checked separately in the action.
 */
export async function addressBlockedBy(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const normalised = email.trim().toLowerCase();

  const [{ data: team }, { data: live }] = await Promise.all([
    admin.from("admin_profiles").select("email").ilike("email", normalised).maybeSingle(),
    admin
      .from("admin_invitations")
      .select("expires_at, accepted_at, token_hash")
      .ilike("email", normalised)
      .is("accepted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (team) return "That address already belongs to a member of the team.";
  if (live && live.token_hash && new Date(live.expires_at).getTime() > Date.now()) {
    return "That address already has an invitation waiting to be accepted.";
  }
  return null;
}

/** Only an owner may invite another owner. */
export function canInviteAtRole(session: AdminSession, role: AdminRole): boolean {
  if (role === "owner") return session.profile.role === "owner";
  return true;
}

export function roleAllowedFor(session: AdminSession): AdminRole[] {
  const roles: AdminRole[] = ["editor", "administrator"];
  if (roleAtLeast(session.profile.role, "owner")) roles.push("owner");
  return roles;
}
