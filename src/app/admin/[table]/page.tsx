import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpDown, ChevronDown, ChevronUp, Download, Plus, Search } from "lucide-react";
import { tableDefBySlug } from "@/lib/admin/schema";
import { listRows, PAGE_SIZE } from "@/lib/admin/data";
import { formatCell, formatDateTime, humanize, looksLikeDate } from "@/lib/admin/format";
import { bulkDelete, bulkUpdate } from "@/lib/admin/actions";
import { getAdminSession } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";
import { InviteForm } from "@/components/admin/invite-form";
import { SelectAllCheckbox } from "@/components/admin/select-all";

export const instant = false;

interface PageProps {
  params: Promise<{ table: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Search params that belong to the list's own state rather than to a filter. */
const RESERVED = new Set(["q", "page", "sort", "dir", "saved", "deleted", "updated", "error"]);

export default async function AdminTablePage({ params, searchParams }: PageProps) {
  await connection();

  const { table } = await params;
  const sp = await searchParams;

  const def = tableDefBySlug.get(table);
  if (!def) notFound();

  const first = (key: string): string | undefined => {
    const value = sp[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const q = first("q");
  const page = Number(first("page") ?? "1") || 1;
  const sort = first("sort");
  const dir = first("dir") === "desc" ? "desc" : "asc";
  const deleted = first("deleted");
  const saved = first("saved");
  const updated = first("updated");
  const errorParam = first("error");

  /** Active `f_*` filters, keyed by column. */
  const filters: Record<string, string> = {};
  for (const [key, value] of Object.entries(sp)) {
    if (!key.startsWith("f_") || RESERVED.has(key)) continue;
    const text = Array.isArray(value) ? value[0] : value;
    if (text) filters[key.slice(2)] = text;
  }

  const [{ rows, total, error }, session] = await Promise.all([
    listRows(def, { query: q, page, sort, dir, filters }),
    getAdminSession(),
  ]);

  const canWrite = session
    ? roleAtLeast(session.profile.role, def.writeRole ?? "editor")
    : false;
  const canDelete = session ? roleAtLeast(session.profile.role, "administrator") : false;

  // Columns the data actually has — the registry is a guide, not a cage.
  const presentColumns = rows.length
    ? def.columns.filter((column) => column in rows[0])
    : def.columns;

  /**
   * Filter dropdowns come from the registry's own `select` fields, so the list
   * offers exactly the values the editor can save. Nothing is hard-coded here:
   * a table that grows a `status` select grows a filter with it.
   */
  const filterFields = (def.fields ?? []).filter(
    (field) => field.type === "select" && field.options?.length,
  );

  /** The status-like column bulk editing is allowed to write. */
  const bulkField = filterFields.find((field) => field.name === "status") ?? null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const listPath = `/admin/${def.table}`;

  const buildHref = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged: Record<string, string | number | undefined> = {
      q,
      sort,
      dir: sort ? dir : undefined,
      ...Object.fromEntries(
        Object.entries(filters).map(([column, value]) => [`f_${column}`, value]),
      ),
      ...overrides,
    };

    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "" || value === null) continue;
      next.set(key, String(value));
    }

    const query = next.toString();
    return query ? `${listPath}?${query}` : listPath;
  };

  const sortHref = (column: string) =>
    buildHref({
      sort: column,
      dir: sort === column && dir === "asc" ? "desc" : "asc",
      page: 1,
    });

  const hasState = Boolean(q) || Object.keys(filters).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-plum-600">{def.plural}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {def.description ?? `${total} record${total === 1 ? "" : "s"}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${listPath}/export?${new URLSearchParams({
              ...(q ? { q } : {}),
              ...(sort ? { sort, dir } : {}),
              ...Object.fromEntries(
                Object.entries(filters).map(([column, value]) => [`f_${column}`, value]),
              ),
            }).toString()}`}
            prefetch={false}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-plum-600 transition hover:border-gold-400"
          >
            <Download className="size-4" aria-hidden />
            Export CSV
          </Link>

          {canWrite && (
            <Link
              href={`${listPath}/new`}
              className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-4 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
            >
              <Plus className="size-4" aria-hidden />
              New {def.label.toLowerCase()}
            </Link>
          )}
        </div>
      </div>

      {def.table === "admin_invitations" && canWrite && <InviteForm />}

      {saved && (
        <p className="rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          Record created.
        </p>
      )}

      {deleted && (
        <p className="rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          {deleted === "1" ? "Record deleted." : `${deleted} records deleted.`}
        </p>
      )}

      {updated && (
        <p className="rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          {updated} record{updated === "1" ? "" : "s"} updated.
        </p>
      )}

      {(error || errorParam) && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorParam ?? error}
        </p>
      )}

      {/* Search and filters */}
      <form className="flex flex-wrap gap-2" action={listPath}>
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder={`Search ${def.plural.toLowerCase()}…`}
            className="w-full rounded-md border border-border bg-card py-2.5 pl-9 pr-3 text-sm shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>

        {filterFields.map((field) => (
          <label key={field.name} className="sr-only" htmlFor={`filter-${field.name}`}>
            {field.label}
          </label>
        ))}

        {filterFields.map((field) => (
          <select
            key={field.name}
            id={`filter-${field.name}`}
            name={`f_${field.name}`}
            defaultValue={filters[field.name] ?? ""}
            className="rounded-md border border-border bg-card px-3 py-2.5 text-sm shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          >
            <option value="">All {field.label.toLowerCase()}s</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {humanize(option.replace(/_/g, " "))}
              </option>
            ))}
          </select>
        ))}

        {/* Sorting survives a new search, so the table does not reset on submit. */}
        {sort && <input type="hidden" name="sort" value={sort} />}
        {sort && <input type="hidden" name="dir" value={dir} />}

        <button
          type="submit"
          className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-plum-600 transition hover:border-gold-400"
        >
          Apply
        </button>

        {hasState && (
          <Link
            href={listPath}
            className="inline-flex items-center rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:text-plum-600"
          >
            Clear
          </Link>
        )}
      </form>

      <form
        action={bulkDelete.bind(null, def.table, listPath)}
        className="overflow-x-auto rounded-2xl border border-border bg-card"
      >
        {canWrite && (
          <div className="flex flex-wrap items-center gap-3 border-b border-border bg-ivory-100/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Bulk actions
            </p>

            {bulkField && (
              <>
                <select
                  name="bulkValue"
                  aria-label={`New ${bulkField.label.toLowerCase()}`}
                  className="rounded-md border border-border bg-card px-2.5 py-1.5 text-sm shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                >
                  {bulkField.options?.map((option) => (
                    <option key={option} value={option}>
                      {humanize(option.replace(/_/g, " "))}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  formAction={bulkUpdate.bind(null, def.table, bulkField.name, listPath)}
                  className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-semibold text-plum-600 transition hover:border-gold-400"
                >
                  Set {bulkField.label.toLowerCase()}
                </button>
              </>
            )}

            {canDelete && (
              <button
                type="submit"
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
              >
                Delete selected
              </button>
            )}

            <p className="ml-auto text-xs text-muted-foreground">
              Tick rows below, then choose an action. Deleting cannot be undone.
            </p>
          </div>
        )}

        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="border-b border-border bg-ivory-100/80">
            <tr>
              {canWrite && (
                <th scope="col" className="w-10 px-4 py-3">
                  <SelectAllCheckbox label={`Select all ${def.plural.toLowerCase()}`} />
                </th>
              )}
              {presentColumns.map((column) => {
                const active = sort === column;
                return (
                  <th
                    key={column}
                    scope="col"
                    aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
                    className="whitespace-nowrap px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    <Link
                      href={sortHref(column)}
                      className="inline-flex items-center gap-1 hover:text-plum-600"
                      title={`Sort by ${humanize(column)}`}
                    >
                      {humanize(column)}
                      {active ? (
                        dir === "asc" ? (
                          <ChevronUp className="size-3" aria-hidden />
                        ) : (
                          <ChevronDown className="size-3" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-30" aria-hidden />
                      )}
                    </Link>
                  </th>
                );
              })}
              <th scope="col" className="w-10 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && !error && (
              <tr>
                <td
                  colSpan={presentColumns.length + (canWrite ? 2 : 1)}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {hasState ? "Nothing matches those filters." : "No records yet."}
                </td>
              </tr>
            )}

            {rows.map((row, index) => {
              const rowId = row.id === null || row.id === undefined ? `row-${index}` : String(row.id);
              return (
                <tr key={rowId} className="group hover:bg-blush-100/50">
                  {canWrite && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        name="ids"
                        value={rowId}
                        aria-label="Select row"
                        className="size-4 rounded border-border text-plum-500 focus:ring-gold-500"
                      />
                    </td>
                  )}
                  {presentColumns.map((column) => (
                    <td key={column} className="max-w-[18rem] truncate px-4 py-3 text-charcoal-700">
                      <Link href={`${listPath}/${row.id}`} className="block truncate">
                        {looksLikeDate(column)
                          ? formatDateTime(row[column])
                          : formatCell(row[column])}
                      </Link>
                    </td>
                  ))}
                  <td className="px-2">
                    <Link
                      href={`${listPath}/${row.id}`}
                      aria-label={`Open ${def.label}`}
                      className="flex size-8 items-center justify-center rounded-full text-gold-700 opacity-0 transition group-hover:opacity-100"
                    >
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>

      {(totalPages > 1 || total > 0) && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages} · {total} record{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1 })}
                className="rounded-md border border-border px-3 py-1.5 font-medium text-plum-600 hover:border-gold-400"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={buildHref({ page: page + 1 })}
                className="rounded-md border border-border px-3 py-1.5 font-medium text-plum-600 hover:border-gold-400"
              >
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}