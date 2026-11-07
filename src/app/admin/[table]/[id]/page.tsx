import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { RecordForm } from "@/components/admin/record-form";
import { tableDefBySlug } from "@/lib/admin/schema";
import { getRow } from "@/lib/admin/data";
import { deriveFields } from "@/lib/admin/derive";
import { formatCell, formatDateTime, humanize } from "@/lib/admin/format";
import { deleteRecord, updateRecord } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";

export const instant = false;

interface PageProps {
  params: Promise<{ table: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditRecordPage({ params, searchParams }: PageProps) {
  await connection();

  const { table, id } = await params;
  const { error: actionError } = await searchParams;

  const def = tableDefBySlug.get(table);
  if (!def) notFound();

  const session = await requireAdmin("editor");
  const { row, error } = await getRow(def, id);

  if (!row) notFound();

  const listPath = `/admin/${def.table}`;
  const fields = deriveFields(row);
  const canWrite = roleAtLeast(session.profile.role, def.writeRole ?? "editor");
  const canDelete = roleAtLeast(session.profile.role, "administrator");
  const title = formatCell(row[def.primary]);

  const notice =
    actionError ? (
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        {actionError}
      </p>
    ) : error ? (
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    ) : null;

  if (!canWrite) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-700">
            {def.label}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">{title}</h1>
        </div>

        {notice}

        <p className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Your role can read {def.plural.toLowerCase()} but not change them.
        </p>

        <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.name} className="bg-card px-5 py-4">
              <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {humanize(field.name)}
              </dt>
              <dd className="mt-1 break-words text-sm text-charcoal-700">
                {field.type === "datetime"
                  ? formatDateTime(row[field.name])
                  : field.type === "json"
                    ? JSON.stringify(row[field.name], null, 2)
                    : formatCell(row[field.name])}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice}

      <RecordForm
        action={updateRecord.bind(null, def.table, id, fields, listPath)}
        deleteAction={canDelete ? deleteRecord.bind(null, def.table, id, listPath) : undefined}
        fields={fields}
        initial={row}
        title={title === "—" ? `${def.label} ${id.slice(0, 8)}` : title}
        listPath={listPath}
        isNew={false}
      />
    </div>
  );
}
