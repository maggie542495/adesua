import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The notification log, read for the page rather than the bell.
 *
 * A notification row is written by the studio itself when something happens —
 * an enquiry arrives, a record is published, a mail fails — and belongs to one
 * recipient. Nothing on this screen creates one: it is a delivery record, so
 * the only writes from the page mark entries read.
 */

export const NOTIFICATIONS_PER_PAGE = 20;

export type NotificationKind =
  | "enquiry"
  | "escalation"
  | "email"
  | "failure"
  | "activity"
  | "alert"
  | "system";

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  total: number;
  page: number;
  totalPages: number;
  unread: number;
}

const KINDS: readonly NotificationKind[] = [
  "enquiry",
  "escalation",
  "email",
  "failure",
  "activity",
  "alert",
  "system",
];

/** An unrecognised `?filter=` falls back to `all` rather than erroring. */
function normaliseFilter(raw: string | undefined): "all" | "unread" | NotificationKind {
  if (raw === "unread") return "unread";
  if (raw && (KINDS as readonly string[]).includes(raw)) return raw as NotificationKind;
  return "all";
}

export interface NotificationQuery {
  recipientId: string;
  page?: number;
  /** "all", "unread", or a specific kind. */
  filter?: string;
  query?: string;
}

interface Row {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export async function listNotifications({
  recipientId,
  page = 1,
  filter = "all",
  query,
}: NotificationQuery): Promise<NotificationPage> {
  const admin = createAdminClient();
  const perPage = NOTIFICATIONS_PER_PAGE;
  const kind = normaliseFilter(filter);

  /**
   * Built fresh for each query. A PostgREST builder is a one-shot thenable:
   * awaiting it for the count and then reusing the same object to fetch the
   * page returns the first result again, which would pin every page to page 1.
   */
  const baseQuery = () => {
    let builder = admin
      .from("notifications")
      .select("id, kind, title, body, link, is_read, read_at, created_at", { count: "exact" })
      .eq("recipient_id", recipientId);

    if (kind === "unread") builder = builder.eq("is_read", false);
    else if (kind !== "all") builder = builder.eq("kind", kind);

    if (query?.trim()) {
      const term = query.replace(/[%,()]/g, " ").trim();
      builder = builder.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
    }

    return builder;
  };

  // `head: true` asks Postgres for the count alone — no rows come back.
  const total = await baseQuery()
    .order("created_at", { ascending: false })
    .limit(1)
    .then((result) => result.count ?? 0);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const from = (safePage - 1) * perPage;

  const [{ data }, { count: unread }] = await Promise.all([
    baseQuery().order("created_at", { ascending: false }).range(from, from + perPage - 1),
    admin
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", recipientId)
      .eq("is_read", false),
  ]);

  return {
    items: ((data ?? []) as Row[]).map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      link: row.link,
      isRead: row.is_read,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    total,
    page: safePage,
    totalPages,
    unread: unread ?? 0,
  };
}

/** Per-kind counts, for the filter chips. */
export async function notificationKindCounts(
  recipientId: string,
): Promise<Record<string, number>> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("notifications")
    .select("kind")
    .eq("recipient_id", recipientId)
    .limit(2000);

  const counts: Record<string, number> = { all: data?.length ?? 0 };
  for (const row of data ?? []) {
    counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  }
  return counts;
}

export async function markNotificationRead(session: { id: string }, id: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", session.id);
}

export async function markAllRead(recipientId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", recipientId)
    .eq("is_read", false);
}
