import { requireAdminApi } from "@/lib/auth/session";
import { tableDefBySlug } from "@/lib/admin/schema";
import { rowsForExport, EXPORT_LIMIT } from "@/lib/admin/data";

/**
 * CSV export for any registry table.
 *
 * Lives beside the list rather than in it so the browser can stream the file
 * down directly. It reads the same `q`, `sort`, `dir` and filter parameters the
 * list is showing, so what lands in the spreadsheet is what the admin was
 * looking at — an export that quietly ignored the active filter would be worse
 * than no export.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const { table } = await params;
  const def = tableDefBySlug.get(table);
  if (!def) return new Response("Unknown table", { status: 404 });

  const auth = await requireAdminApi("editor");
  if (!auth.ok) return new Response(auth.error, { status: auth.status });

  const url = new URL(request.url);
  const filters: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith("f_") && value) filters[key.slice(2)] = value;
  }

  const { rows, truncated, error } = await rowsForExport(def, {
    query: url.searchParams.get("q") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    dir: url.searchParams.get("dir") === "asc" ? "asc" : "desc",
    filters,
  });

  if (error) return new Response(`Export failed: ${error}`, { status: 500 });

  // Columns come from the data, not the registry: a column the registry forgot
  // is still in the rows, and silently dropping it from the export would lose
  // information the admin can see in the editor.
  const columns = rows.length
    ? Object.keys(rows[0]).filter((column) => column !== "search_vector")
    : [...def.columns];

  const csv = [
    columns.map(csvCell).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
  ].join("\r\n");

  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${def.table}-${stamp}${truncated ? `-first-${EXPORT_LIMIT}` : ""}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/**
 * One CSV field. Excel treats a leading =, +, - or @ as a formula, so those
 * are prefixed with a quote — a spreadsheet of form submissions is exactly
 * where a bystander ends up typing `=cmd` into a cell.
 */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";

  let text: string;
  if (typeof value === "object") text = JSON.stringify(value);
  else if (typeof value === "boolean") text = value ? "yes" : "no";
  else text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;

  return `"${text.replace(/"/g, '""')}"`;
}
