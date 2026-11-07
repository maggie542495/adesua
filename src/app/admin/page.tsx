import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Inbox, FileText, CalendarClock, Users } from "lucide-react";
import { countRows, recentEnquiries } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/admin/format";

// Every admin screen reads the live database behind the session cookie, so
// there is nothing worth prerendering — this is a blocking route by design.
export const instant = false;

const summary = [
  { table: "enquiries", label: "Enquiries", href: "/admin/enquiries", icon: Inbox },
  { table: "articles", label: "Insights", href: "/admin/articles", icon: FileText },
  { table: "admin_profiles", label: "Team", href: "/admin/admin_profiles", icon: Users },
  {
    table: "email_messages",
    label: "Mailbox",
    href: "/admin/email_messages",
    icon: CalendarClock,
  },
] as const;

export default async function AdminOverview() {
  await connection();

  const [counts, enquiries] = await Promise.all([
    Promise.all(summary.map((item) => countRows(item.table))),
    recentEnquiries(6),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium text-plum-600">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Everything on the site, in one place. Pick a table on the left to browse or edit it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item, index) => {
          const Icon = item.icon;
          const count = counts[index];
          return (
            <Link
              key={item.table}
              href={item.href}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-lg bg-blush-300 text-plum-500">
                  <Icon className="size-5" aria-hidden />
                </span>
                <ArrowRight className="size-4 text-gold-600 transition-transform group-hover:translate-x-1" aria-hidden />
              </div>
              <p className="mt-4 font-display text-3xl text-plum-500">
                {count === null ? "—" : count}
              </p>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {item.label}
              </p>
            </Link>
          );
        })}
      </div>

      <section className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-xl text-plum-600">Latest enquiries</h2>
          <Link
            href="/admin/enquiries"
            className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
          >
            View all
          </Link>
        </div>

        {enquiries.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No enquiries yet. Submissions from the contact form land here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {enquiries.map((row) => (
              <li key={String(row.id)}>
                <Link
                  href={`/admin/enquiries/${row.id}`}
                  className="flex flex-col gap-1 px-5 py-4 transition hover:bg-blush-100/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-plum-600">
                      {String(row.name ?? "—")}{" "}
                      <span className="font-normal text-muted-foreground">
                        · {String(row.email ?? "")}
                      </span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {String(row.subject ?? row.message ?? "").slice(0, 90)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="rounded-full bg-gold-500/15 px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-gold-700">
                      {String(row.status ?? "new").replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(row.created_at)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
