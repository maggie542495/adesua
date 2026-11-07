import { connection } from "next/server";
import { notFound } from "next/navigation";
import { RecordForm } from "@/components/admin/record-form";
import { tableDefBySlug } from "@/lib/admin/schema";
import { listRows } from "@/lib/admin/data";
import { deriveFields, fallbackFields } from "@/lib/admin/derive";
import { createRecordAndReturn } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";

export const instant = false;

interface PageProps {
  params: Promise<{ table: string }>;
}

export default async function NewRecordPage({ params }: PageProps) {
  await connection();

  const { table } = await params;

  const def = tableDefBySlug.get(table);
  if (!def) notFound();

  await requireAdmin(def.writeRole ?? "editor");

  // A row already in the table tells us the real column types (boolean,
  // timestamps, long text). Only an empty table falls back to the registry.
  const { rows } = await listRows(def, { page: 1 });
  const fields = rows.length ? deriveFields(rows[0]) : fallbackFields(def.columns);

  const listPath = `/admin/${def.table}`;

  return (
    <RecordForm
      action={createRecordAndReturn.bind(null, def.table, fields, listPath)}
      fields={fields}
      initial={null}
      title={`New ${def.label.toLowerCase()}`}
      listPath={listPath}
      isNew
    />
  );
}
