/** Presentation helpers shared by every admin screen. */

export function formatDateTime(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Human label for a database column: `created_at` → `Created at`. */
export function humanize(column: string): string {
  const spaced = column.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Compact cell rendering for list tables. */
export function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? "" : "s"}`;
  if (typeof value === "object") return JSON.stringify(value).slice(0, 60);
  const text = String(value);
  return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}

/** True when a value should be shown as a date rather than as text. */
export function looksLikeDate(column: string): boolean {
  return /(_at|_on|date)$/.test(column);
}
