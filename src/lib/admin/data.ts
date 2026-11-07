import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TableDef } from "@/lib/admin/schema";

export const PAGE_SIZE = 25;

export interface ListResult {
  rows: Record<string, unknown>[];
  total: number;
  error: string | null;
}

function isColumnError(message: string): boolean {
  return /column .* does not exist|could not find the .* column/i.test(message);
}

/**
 * Lists rows without ever trusting the registry's column names blindly.
 * Everything is `select("*")` so a stale field name in `schema.ts` cannot
 * break a screen — it simply isn't shown.
 */
export async function listRows(
  def: TableDef,
  options: { query?: string; page?: number } = {},
): Promise<ListResult> {
  const supabase = await createClient();
  const page = Math.max(1, options.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const run = async (ordered: boolean) => {
    let builder = supabase.from(def.table).select("*", { count: "exact" });

    if (options.query) {
      const term = options.query.replace(/[%,]/g, " ").trim();
      const targets = def.searchable.length ? def.searchable : [def.primary];
      // PostgREST OR filter: any of the searchable columns matches.
      builder = builder.or(
        targets.map((column) => `${column}.ilike.%${term}%`).join(","),
      );
    }

    if (ordered) builder = builder.order(def.orderBy, { ascending: def.ascending ?? false });

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
