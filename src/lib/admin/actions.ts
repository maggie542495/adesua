"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { sendOwnerAlert } from "@/lib/email/send";
import { readingTime } from "@/lib/markdown";
import { changedFields, recordAudit } from "@/lib/admin/audit";
import type { TableName } from "@/lib/admin/schema";

/** A write that changes publication state is logged as more than an update. */
function auditActionFor(body: Record<string, unknown>): "create" | "publish" | "unpublish" {
  if (body.status === "published") return "publish";
  if (body.status === "unpublished") return "unpublish";
  return "create";
}

/** Tables whose writes are worth telling the owner about. */
const NOTIFY_ON_WRITE = new Set<TableName>([
  "articles",
  "gallery_items",
  "services",
  "pages",
  "site_settings",
  "admin_invitations",
  "admin_profiles",
]);

function labelFor(table: TableName): string {
  return table.replace(/_/g, " ");
}

/**
 * Article housekeeping the editor should not have to remember: publishing
 * stamps `published_at`, and the reading time follows the body.
 */
function prepareBody(table: TableName, body: Record<string, unknown>) {
  if (table !== "articles") return body;

  if (body.status === "published" && !body.published_at) {
    body.published_at = new Date().toISOString();
  }

  if (typeof body.body === "string" && body.body.trim()) {
    body.reading_time_minutes = readingTime(body.body);
  }

  return body;
}

export interface SaveState {
  status: "idle" | "saved" | "error";
  message?: string;
}

/**
 * Coerces a submitted string into the shape the column expects.
 *
 * The form posts strings; Postgres will not accept "false" for a boolean or
 * "" for a nullable timestamp, so each field is converted according to the
 * editor's declared type.
 */
function coerce(value: FormDataEntryValue | null, type: string): unknown {
  if (value === null) return undefined;
  const raw = String(value);

  switch (type) {
    case "number":
      return raw.trim() === "" ? null : Number(raw);
    case "boolean":
      return raw === "true" || raw === "on";
    case "json":
      if (raw.trim() === "") return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    case "datetime":
      return raw.trim() === "" ? null : new Date(raw).toISOString();
    default:
      return raw.trim() === "" ? null : raw;
  }
}

/** Only writes the fields the editor declared — never arbitrary columns. */
function payload(
  formData: FormData,
  fields: readonly { name: string; type: string; readOnly?: boolean }[],
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.readOnly) continue;
    if (field.name === "id") continue;

    /**
     * A checkbox only submits when it is checked, so an unticked boolean posts
     * nothing at all — `get()` returned null, `coerce()` turned that into
     * `undefined`, and the column was skipped. The result was a flag that
     * could be switched on but never off: `is_featured` stayed true forever.
     * Reading the whole submission means "absent" correctly means false.
     */
    if (field.type === "boolean") {
      body[field.name] = formData.getAll(field.name).includes("true");
      continue;
    }

    const value = coerce(formData.get(field.name), field.type);
    if (value !== undefined) body[field.name] = value;
  }
  return body;
}

export async function createRecord(
  table: TableName,
  fields: readonly { name: string; type: string; readOnly?: boolean; createOnly?: boolean }[],
  listPath: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const session = await requireAdmin("editor");
  const supabase = await createClient();

  const body = prepareBody(table, payload(formData, fields.filter((f) => !f.createOnly)));
  const { data: created, error } = await supabase
    .from(table)
    .insert(body as never)
    .select("id")
    .maybeSingle();

  if (error) return { status: "error", message: error.message };

  await recordAudit(session, {
    action: auditActionFor(body),
    resourceType: table,
    resourceId: created?.id ? String(created.id) : null,
    metadata: { title: titleOf(body) },
  });

  revalidatePath(listPath);
  revalidatePath("/", "layout");

  if (NOTIFY_ON_WRITE.has(table)) {
    await sendOwnerAlert({
      title: `New ${labelFor(table)} record`,
      body: `A new record was added to ${labelFor(table)}.`,
      link: listPath,
    });
  }

  return { status: "saved", message: "Record created." };
}

/**
 * Create, then hand the editor back to the list with a confirmation. A fresh
 * record has no page of its own worth landing on, so staying put would strand
 * the user on an empty "new" form.
 */
export async function createRecordAndReturn(
  table: TableName,
  fields: readonly { name: string; type: string; readOnly?: boolean; createOnly?: boolean }[],
  listPath: string,
  prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const state = await createRecord(table, fields, listPath, prev, formData);
  if (state.status === "saved") redirect(`${listPath}?saved=1`);
  return state;
}

/** The label a person would recognise a row by, for the log's own column. */
function titleOf(body: Record<string, unknown>): string | null {
  for (const key of ["title", "subject", "email", "name", "file_name", "slug", "key"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 120);
  }
  return null;
}

export async function updateRecord(
  table: TableName,
  id: string,
  fields: readonly { name: string; type: string; readOnly?: boolean; updateOnly?: boolean }[],
  listPath: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const session = await requireAdmin("editor");
  const supabase = await createClient();

  const body = prepareBody(table, payload(formData, fields.filter((f) => !f.updateOnly)));

  // Read the old row first, so the log can say what actually changed.
  const { data: before } = await supabase.from(table).select("*").eq("id", id).maybeSingle();

  const { error } = await supabase
    .from(table)
    .update(body as never)
    .eq("id", id);

  if (error) return { status: "error", message: error.message };

  const changes = before ? changedFields(before as Record<string, unknown>, body) : {};

  await recordAudit(session, {
    action: body.status === "published" ? "publish" : "update",
    resourceType: table,
    resourceId: id,
    metadata: {
      title: titleOf({ ...(before as Record<string, unknown> | null), ...body }),
      changed: Object.keys(changes),
      fields: changes,
    },
  });

  revalidatePath(listPath);
  revalidatePath(`${listPath}/${id}`);
  revalidatePath("/", "layout");

  if (NOTIFY_ON_WRITE.has(table)) {
    await sendOwnerAlert({
      title: `${labelFor(table)} updated`,
      body: `A record in ${labelFor(table)} was changed.`,
      link: `${listPath}/${id}`,
      quiet: true,
    });
  }

  return { status: "saved", message: "Changes saved." };
}

/**
 * Bulk actions from the list view.
 *
 * Deletion is administrator-only, matching the single-record Delete button.
 * Bulk *editing* is deliberately limited to one column at a time: setting a
 * status across a selection of enquiries is a real workflow, whereas writing
 * arbitrary columns into many rows at once is how a bulk action becomes an
 * outage.
 */
/** Reads the checked rows out of a list form's submission. */
function selectedIds(formData: FormData): string[] {
  return formData
    .getAll("ids")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function bulkDelete(
  table: TableName,
  listPath: string,
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin("administrator");
  const ids = selectedIds(formData);
  if (ids.length === 0) redirect(`${listPath}?error=${encodeURIComponent("Nothing was selected.")}`);

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().in("id", ids);

  revalidatePath(listPath);
  revalidatePath("/", "layout");

  if (error) {
    redirect(`${listPath}?error=${encodeURIComponent(error.message)}`);
  }

  await recordAudit(session, {
    action: "bulk_delete",
    resourceType: table,
    metadata: { count: ids.length, ids: ids.slice(0, 50) },
  });

  redirect(`${listPath}?deleted=${ids.length}`);
}

export async function bulkUpdate(
  table: TableName,
  column: string,
  listPath: string,
  formData: FormData,
): Promise<void> {
  const session = await requireAdmin("editor");
  const ids = selectedIds(formData);
  const value = String(formData.get("bulkValue") ?? "");

  if (ids.length === 0 || !column) {
    redirect(`${listPath}?error=${encodeURIComponent("Nothing was selected.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ [column]: value === "" ? null : value } as never)
    .in("id", ids);

  revalidatePath(listPath);
  revalidatePath("/", "layout");

  if (error) {
    redirect(`${listPath}?error=${encodeURIComponent(error.message)}`);
  }

  await recordAudit(session, {
    action: "bulk_update",
    resourceType: table,
    metadata: { count: ids.length, column, to: value || null },
  });

  redirect(`${listPath}?updated=${ids.length}`);
}

export async function deleteRecord(table: TableName, id: string, listPath: string) {
  const session = await requireAdmin("administrator");
  const supabase = await createClient();

  // The row is gone after a successful delete, so its label is read first.
  const { data: before } = await supabase.from(table).select("*").eq("id", id).maybeSingle();

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) redirect(`${listPath}/${id}?error=${encodeURIComponent(error.message)}`);

  await recordAudit(session, {
    action: "delete",
    resourceType: table,
    resourceId: id,
    metadata: { title: before ? titleOf(before as Record<string, unknown>) : null },
  });

  revalidatePath(listPath);
  redirect(`${listPath}?deleted=1`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
