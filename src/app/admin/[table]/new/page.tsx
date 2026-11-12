import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { GalleryEditor } from "@/components/admin/gallery-editor";
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

  /**
   * An invitation is a credential, not a row: it needs a token, an expiry and
   * an email to be worth anything, none of which a generic field list can
   * produce. The dedicated screen owns that job.
   */
  if (def.table === "admin_invitations") redirect("/admin/admin_invitations");

  /**
   * Order of preference for a create form:
   *
   * 1. The registry's declared fields. They carry the things a row cannot tell
   *    us — the choices behind a `select`, the help text, the reading order —
   *    and this page used to ignore them, so creating an article offered every
   *    column as free text and no status choices at all.
   * 2. A live row, for simple tables that never declared anything.
   * 3. The registry's column list, when the table is empty.
   *
   * Read-only and update-only fields are dropped: a create form has no
   * timestamps to show and nothing to preserve.
   */
  const { rows } = await listRows(def, { page: 1 });
  const fields = def.fields
    ? def.fields.filter((field) => !field.readOnly && !field.updateOnly)
    : rows.length
      ? deriveFields(rows[0]).filter((field) => !field.readOnly)
      : fallbackFields(def.columns).filter((field) => !field.readOnly);

  const listPath = `/admin/${def.table}`;

  /**
   * A gallery item is a photograph, so it gets the editor built around one:
   * drop the file in, see it at the size the public grid shows it, save. The
   * generic form would only offer a text box for the storage path.
   */
  if (def.table === "gallery_items") {
    return (
      <GalleryEditor
        action={createRecordAndReturn.bind(null, def.table, fields, listPath)}
        fields={fields}
        item={null}
        title={`New ${def.label.toLowerCase()}`}
        listPath={listPath}
        isNew
      />
    );
  }

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
