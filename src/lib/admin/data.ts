import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TableDef } from "@/lib/admin/schema";

export const PAGE_SIZE = 25;

export interface ListResult {
  rows: Record<string, unknown>[];
  total: number;
  error: string | null;
}

export interface ListOptions {
  query?: string;
  page?: number;
  /** Column to sort by; falls back to the registry's `orderBy`. */
  sort?: string;
  dir?: "asc" | "desc";
  /** Exact-match filters, as `column: value` — used by the list's dropdowns. */
  filters?: Record<string, string>;
}

function isColumnError(message: string): boolean {
  return /column .* does not exist|could not find the .* column/i.test(message);
}

/**
 * Applies the parts of a list query that are not pagination, so the list view
 * and the CSV export can share one definition of "what the user is looking at".
 */
function applyListOptions<T extends { or: (filter: string) => T; eq: (column: string, value: string) => T }>(
  builder: T,
  def: TableDef,
  options: ListOptions,
): T {
  let next = builder;

  if (options.query) {
    const term = options.query.replace(/[%,]/g, " ").trim();
    const targets = def.searchable.length ? def.searchable : [def.primary];
    // PostgREST OR filter: any of the searchable columns matches.
    next = next.or(targets.map((column) => `${column}.ilike.%${term}%`).join(","));
  }

  for (const [column, value] of Object.entries(options.filters ?? {})) {
    if (value) next = next.eq(column, value);
  }

  return next;
}

/**
 * Lists rows without ever trusting the registry's column names blindly.
 * Everything is `select("*")` so a stale field name in `schema.ts` cannot
 * break a screen — it simply isn't shown.
 */
export async function listRows(def: TableDef, options: ListOptions = {}): Promise<ListResult> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const sortColumn = options.sort ?? def.orderBy;
  const ascending = options.sort ? options.dir !== "desc" : (def.ascending ?? false);

  const run = async (ordered: boolean) => {
    let builder = supabase.from(def.table).select("*", { count: "exact" });
    builder = applyListOptions(builder, def, options);

    if (ordered) builder = builder.order(sortColumn, { ascending });

    const { data, count, error } = await builder.range(from, to);
    return { data, count, error };
  };

  let result = await run(true);

  // A wrong column in the registry should degrade, not 500.
  if (result.error && isColumnError(result.error.message)) result = await run(false);

  if (result.error) {
    return { rows: [], total: 0, error: result.error.message };
  }

  return {
    rows: (result.data ?? []) as Record<string, unknown>[],
    total: result.count ?? 0,
    error: null,
  };
}

/**
 * Every matching row, unpaginated. Used by the CSV export, which must honour
 * the same search and filters the list is showing.
 *
 * `select("*")` with a hard cap rather than paging: an export of tens of
 * thousands of rows is not something this admin should attempt silently, so it
 * stops at `EXPORT_LIMIT` and reports whether it truncated.
 */
export const EXPORT_LIMIT = 5000;

export async function rowsForExport(
  def: TableDef,
  options: Omit<ListOptions, "page"> = {},
): Promise<{ rows: Record<string, unknown>[]; truncated: boolean; error: string | null }> {
  const supabase = await createClient();
  const sortColumn = options.sort ?? def.orderBy;
  const ascending = options.sort ? options.dir !== "desc" : (def.ascending ?? false);

  let builder = supabase.from(def.table).select("*");
  builder = applyListOptions(builder, def, options);

  const { data, error } = await builder
    .order(sortColumn, { ascending })
    .limit(EXPORT_LIMIT + 1);

  if (error) return { rows: [], truncated: false, error: error.message };

  const rows = (data ?? []) as Record<string, unknown>[];
  return {
    rows: rows.slice(0, EXPORT_LIMIT),
    truncated: rows.length > EXPORT_LIMIT,
    error: null,
  };
}

export async function getRow(
  def: TableDef,
  id: string,
): Promise<{ row: Record<string, unknown> | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(def.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return {
    row: (data as Record<string, unknown> | null) ?? null,
    error: error?.message ?? null,
  };
}

export async function countRows(table: TableDef["table"]): Promise<number | null> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  return error ? null : (count ?? 0);
}

export async function recentEnquiries(limit = 5): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Record<string, unknown>[];
}

export async function getEnquiries(): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as Record<string, unknown>[];
}

/* ── Dashboard feeds ───────────────────────────────────────────────── */

/** Enquiry counts by status, for the overview's pipeline strip. */
export async function enquiryStatusCounts(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("enquiries").select("status");
  if (error || !data) return {};

  return data.reduce<Record<string, number>>((acc, row) => {
    const key = String(row.status ?? "new");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

/** The most recently touched insights, published or draft. */
export async function recentArticles(limit = 5): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, title, status, published_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Record<string, unknown>[];
}

/** Unread notifications for the signed-in admin. */
export async function unreadNotifications(
  userId: string,
  limit = 5,
): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, link, created_at, is_read")
    .eq("recipient_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Record<string, unknown>[];
}

export interface NotificationFeed {
  unread: number;
  rows: {
    id: string;
    title: string;
    body: string | null;
    link: string | null;
    is_read: boolean;
    created_at: string;
  }[];
}

/**
 * Everything the header bell needs, read once on the server. The shell is a
 * client component, so the data is passed down rather than fetched there.
 */
export async function notificationFeed(userId: string, limit = 6): Promise<NotificationFeed> {
  const supabase = await createClient();
  const [{ count }, { data }] = await Promise.all([
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", userId)
      .eq("is_read", false),
    supabase
      .from("notifications")
      .select("id, title, body, link, is_read, created_at")
      .eq("recipient_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  return {
    unread: count ?? 0,
    rows: (data ?? []) as NotificationFeed["rows"],
  };
}

/** The last few outbound emails, so delivery health is visible at a glance. */
export async function recentSendLog(limit = 5): Promise<Record<string, unknown>[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_send_log")
    .select("id, subject, status, error, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Record<string, unknown>[];
}
