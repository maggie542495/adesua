"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import type { TableName } from "@/lib/admin/schema";

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
  await requireAdmin("editor");
  const supabase = await createClient();

  const body = payload(formData, fields.filter((f) => !f.createOnly));
  const { error } = await supabase.from(table).insert(body as never);

  if (error) return { status: "error", message: error.message };

  revalidatePath(listPath);
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

export async function updateRecord(
  table: TableName,
  id: string,
  fields: readonly { name: string; type: string; readOnly?: boolean; updateOnly?: boolean }[],
  listPath: string,
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin("editor");
  const supabase = await createClient();

  const body = payload(formData, fields.filter((f) => !f.updateOnly));
  const { error } = await supabase
    .from(table)
    .update(body as never)
    .eq("id", id);

  if (error) return { status: "error", message: error.message };

  revalidatePath(listPath);
  revalidatePath(`${listPath}/${id}`);
  return { status: "saved", message: "Changes saved." };
}

export async function deleteRecord(table: TableName, id: string, listPath: string) {
  await requireAdmin("administrator");
  const supabase = await createClient();

  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) redirect(`${listPath}/${id}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(listPath);
  redirect(`${listPath}?deleted=1`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
