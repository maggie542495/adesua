import { connection } from "next/server";
import { Save } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { saveSiteSettings } from "@/lib/admin/studio-actions";
import { SettingsForm } from "@/components/admin/settings-form";

export const instant = false;

export const metadata = { title: "Site settings" };

const KNOWN: Record<string, { label: string; help?: string; type?: "text" | "textarea" | "json" }> = {
  contact_email: { label: "Contact email", help: "Shown on the contact page and in emails." },
  contact_phone: { label: "Contact phone", help: "Shown on the contact page." },
  contact_location: { label: "Location", help: "e.g. Lagos, Nigeria" },
  business_hours: {
    label: "Business hours",
    help: "JSON object keyed by weekday, e.g. {\"monday\":\"9:00-17:00\"}.",
    type: "json",
  },
  gallery_categories: {
    label: "Gallery categories",
    help: "JSON array of category names.",
    type: "json",
  },
  site_announcement: {
    label: "Site announcement",
    help: "Optional banner text. Leave empty to hide.",
    type: "textarea",
  },
  booking_url: { label: "Booking link", help: "External scheduling link, if any." },
  response_time: { label: "Response time", help: "e.g. Within one working day." },
};

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default async function SettingsPage() {
  await connection();
  await requireAdmin("administrator");

  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("key, value, is_public, updated_at")
    .order("key", { ascending: true });

  const rows = data ?? [];
  const known = rows.filter((row) => KNOWN[row.key]);
  const other = rows.filter((row) => !KNOWN[row.key]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
          Site &amp; media
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">Site settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The values the public pages read. Changes take effect on the next page load.
        </p>
      </div>

      <SettingsForm
        action={saveSiteSettings}
        groups={[
          {
            title: "Contact & availability",
            fields: known.map((row) => ({
              key: row.key,
              label: KNOWN[row.key].label,
              help: KNOWN[row.key].help,
              type: KNOWN[row.key].type ?? "text",
              value: displayValue(row.value),
            })),
          },
          {
            title: "Other settings",
            fields: other.map((row) => ({
              key: row.key,
              label: row.key.replace(/_/g, " "),
              type: "text" as const,
              value: displayValue(row.value),
            })),
          },
        ]}
      />

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Save className="size-3.5" aria-hidden />
        Settings are stored in <code className="rounded bg-ivory-300 px-1">site_settings</code> and
        can also be edited row by row under Site &amp; media → Site settings.
      </p>
    </div>
  );
}
