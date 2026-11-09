/**
 * Works out form fields from the shape of a real row.
 *
 * The database is the source of truth (it already generates `database.ts`),
 * so the editor derives its inputs from live data instead of keeping a second
 * hand-maintained schema that would drift.
 */
import type { FieldDef, FieldType } from "@/lib/admin/schema";
import { humanize } from "@/lib/admin/format";

const SERVER_MANAGED = new Set([
  "id",
  "created_at",
  "updated_at",
  "updated_by",
  "search_vector",
]);

const LONG_TEXT = new Set([
  "body",
  "message",
  "note",
  "description",
  "summary",
  "excerpt",
  "content",
  "bio",
  "value",
  "body_html",
  "body_text",
  "preview_text",
  "seo_description",
  "raw_headers",
]);

const DATE_LIKE = /(_at|_on)$/;

function inferType(column: string, value: unknown): FieldType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (value !== null && typeof value === "object") return "json";
  if (LONG_TEXT.has(column)) return "textarea";
  if (DATE_LIKE.test(column) && (value === null || !Number.isNaN(Date.parse(String(value))))) {
    return "datetime";
  }
  if (/email/.test(column)) return "email";
  if (/url|href|endpoint|path$/.test(column)) return "url";
  return "text";
}

/** Fields for an existing record. */
export function deriveFields(row: Record<string, unknown> | null): FieldDef[] {
  if (!row) return [];

  return Object.entries(row)
    .filter(([column]) => column !== "search_vector")
    .map(([column, value]) => {
      const serverManaged = SERVER_MANAGED.has(column);
      const type = inferType(column, value);

      return {
        name: column,
        label: humanize(column),
        type: serverManaged ? "text" : type,
        readOnly: serverManaged,
        span: type === "textarea" || type === "json" ? 2 : 1,
      } satisfies FieldDef;
    });
}

/**
 * The registry's declared fields, in declared order, plus any column the row
 * has that the registry forgot about.
 *
 * Declared fields win because they carry the choices a select needs and the
 * read-only flags that keep ids and hashes out of the editor. Appending the
 * stragglers means a column added to the database tomorrow still shows up
 * instead of silently disappearing from the editor.
 */
export function mergeDeclaredFields(
  declared: readonly FieldDef[],
  row: Record<string, unknown> | null,
): FieldDef[] {
  if (!row) return [...declared];

  const declaredNames = new Set(declared.map((field) => field.name));
  const extras = deriveFields(row).filter((field) => !declaredNames.has(field.name));

  return [...declared, ...extras];
}

/**
 * Fallback for an empty table: there is no row to inspect, so use the registry's
 * suggested columns as plain text inputs.
 */
export function fallbackFields(columns: readonly string[]): FieldDef[] {
  return columns
    .filter((column) => column !== "id")
    .map((column) => ({
      name: column,
      label: humanize(column),
      type: "text" as FieldType,
      readOnly: SERVER_MANAGED.has(column),
    }));
}

/** Turns a value into what an <input> expects. */
export function toInputValue(value: unknown, type: FieldType): string {
  if (value === null || value === undefined) return "";
  if (type === "json") return JSON.stringify(value, null, 2);
  if (type === "datetime") {
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
  }
  return String(value);
}
