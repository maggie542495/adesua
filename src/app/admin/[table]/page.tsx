import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { ArrowRight, Plus, Search } from "lucide-react";
import { tableDefBySlug } from "@/lib/admin/schema";
import { listRows, PAGE_SIZE } from "@/lib/admin/data";
import { formatCell, formatDateTime, humanize, looksLikeDate } from "@/lib/admin/format";
import { getAdminSession } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";

export const instant = false;

interface PageProps {
  params: Promise<{ table: string }>;
  searchParams: Promise<{ q?: string; page?: string; deleted?: string; saved?: string }>;
}

export default async function AdminTablePage({ params, searchParams }: PageProps) {
  await connection();

  const { table } = await params;
  const { q, page: pageParam, deleted, saved } = await searchParams;

  const def = tableDefBySlug.get(table);
  if (!def) notFound();

  const page = Number(pageParam ?? "1") || 1;
  const [{ rows, total, error }, session] = await Promise.all([
    listRows(def, { query: q, page }),
    getAdminSession(),
  ]);

  const canWrite = session
    ? roleAtLeast(session.profile.role, def.writeRole ?? "editor")
    : false;

  // Only show columns the data actually has — the registry is a guide, not a cage.
  const presentColumns = rows.length
    ? def.columns.filter((column) => column in rows[0])
    : def.columns;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const listPath = `/admin/${def.table}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-medium text-plum-600">{def.plural}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {def.description ?? `${total} record${total === 1 ? "" : "s"}.`}
          </p>
        </div>

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

      {saved && (
        <p className="rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          Record created.
        </p>
      )}

      {deleted && (
        <p className="rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          Record deleted.
        </p>
      )}

      <form className="flex gap-2" action={listPath}>
        <div className="relative flex-1">
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
        <button
          type="submit"
          className="rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-plum-600 transition hover:border-gold-400"
        >
          Search
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="border-b border-border bg-ivory-100/80">
            <tr>
              {presentColumns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                >
                  {humanize(column)}
                </th>
              ))}
              <th scope="col" className="w-10 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 && !error && (
              <tr>
                <td
                  colSpan={presentColumns.length + 1}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {q ? `Nothing matches “${q}”.` : "No records yet."}
                </td>
              </tr>
            )}

            {rows.map((row, index) => (
              <tr
                key={row.id === null || row.id === undefined ? `row-${index}` : String(row.id)}
                className="group hover:bg-blush-100/50"
              >
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
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {page} of {totalPages} · {total} record{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`${listPath}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`}
                className="rounded-md border border-border px-3 py-1.5 font-medium text-plum-600 hover:border-gold-400"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`${listPath}?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`}
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
