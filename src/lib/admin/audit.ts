import "server-only";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdminSession } from "@/lib/auth/session";

/**
 * The audit writer.
 *
 * The table, its RLS policy and three readers existed from the first migration,
 * but nothing ever inserted a row — which is why the Audit log screen was
 * always empty. Every privileged write now records one entry here.
 *
 * Writes go through the service role because RLS deliberately allows no
 * client inserts. Auditing must never be able to fail the action it describes:
 * a throw here would turn a saved article into an error page, so failures are
 * logged and swallowed.
 */

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "bulk_delete"
  | "bulk_update"
  | "publish"
  | "unpublish"
  | "sign_in"
  | "sign_out"
  | "sign_in_failed"
  | "invite_sent"
  | "invite_revoked"
  | "invite_accepted"
  | "role_changed"
  | "member_suspended"
  | "member_restored"
  | "password_changed"
  | "mfa_enrolled"
  | "mfa_removed"
  | "settings_changed";

export interface AuditEntry {
  action: AuditAction;
  resourceType: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Salted hash of the caller's address rather than the address itself.
 *
 * It still lets two entries be tied to one origin when investigating, without
 * turning the log into a record of who works from where.
 */
async function hashedAddress(): Promise<string | null> {
  try {
    const store = await headers();
    const forwarded = store.get("x-forwarded-for");
    const raw = forwarded?.split(",")[0]?.trim() || store.get("x-real-ip");
    if (!raw) return null;

    const salt = process.env.AUDIT_IP_SALT ?? "adesua";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${raw}`));
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    return null;
  }
}

/** Records one privileged action against whoever performed it. */
export async function recordAudit(session: AdminSession, entry: AuditEntry): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: session.user.id,
      actor_email: session.user.email,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      metadata: (entry.metadata ?? {}) as never,
      ip_hash: await hashedAddress(),
    });
  } catch (error) {
    console.error("[audit] could not record entry", entry.action, error);
  }
}

/**
 * Records something that happened before a session existed — a failed sign-in,
 * an accepted invitation. There is no actor to attribute it to, so the email
 * is carried in the metadata and `actor_id` stays null.
 */
export async function recordAnonymousAudit(entry: AuditEntry & { email?: string }): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: null,
      actor_email: entry.email ?? null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      metadata: (entry.metadata ?? {}) as never,
      ip_hash: await hashedAddress(),
    });
  } catch (error) {
    console.error("[audit] could not record anonymous entry", entry.action, error);
  }
}

/**
 * The readable difference between a row before and after a write, so the log
 * says what changed rather than only that something did. Long values are
 * elided: a 30,000-character article body in a log row helps nobody.
 */
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};

  for (const [key, next] of Object.entries(after)) {
    if (key === "updated_at") continue;
    const previous = before[key];
    if (JSON.stringify(previous) === JSON.stringify(next)) continue;
    changes[key] = { from: summarise(previous), to: summarise(next) };
  }

  return changes;
}

function summarise(value: unknown): unknown {
  if (typeof value === "string" && value.length > 160) {
    return `${value.slice(0, 157)}…`;
  }
  return value;
}
