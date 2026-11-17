import { connection } from "next/server";

import { requireAdmin } from "@/lib/auth/session";
import { getContactDetails } from "@/lib/site/contact";
import { publicAssetBase } from "@/lib/email/template";
import { EmailStationeryDesigner } from "@/components/admin/email-stationery-designer";

export const instant = false;

/**
 * The stationery designer: write a note, watch it set in the branded shell,
 * copy the finished HTML into a mail client. Contact details and the portrait
 * come from the same source the rest of the site uses, so the design never
 * drifts from the dashboard.
 */
export default async function EmailStationeryPage() {
  await connection();
  await requireAdmin("editor");

  const contact = await getContactDetails();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
          Communications
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">Email stationery</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Write the note, watch it set in the branded card, then copy the finished HTML into
          Gmail, Outlook or Apple Mail. Her portrait, colours and contact line are already in
          place.
        </p>
      </div>

      <EmailStationeryDesigner contact={contact} assetBase={publicAssetBase()} />
    </div>
  );
}
