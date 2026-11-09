import Link from "next/link";
import { connection } from "next/server";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Inbox,
  Mail,
  MailCheck,
  MailWarning,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import {
  countRows,
  enquiryStatusCounts,
  recentArticles,
  recentEnquiries,
  recentSendLog,
  unreadNotifications,
} from "@/lib/admin/data";
import { formatDateTime } from "@/lib/admin/format";
import { isMailConfigured } from "@/lib/email/send";
import { cn } from "@/lib/utils";

// Every admin screen reads the live database behind the session cookie, so
// there is nothing worth prerendering — this is a blocking route by design.
export const instant = false;

/** The four numbers that answer "is anything waiting on me?". */
const headline = [
  {
    table: "enquiries",
    label: "Enquiries",
    href: "/admin/enquiries",
    icon: Inbox,
    hint: "From the contact form",
  },
  {
    table: "articles",
    label: "Insights",
    href: "/admin/articles",
    icon: FileText,
    hint: "Published and draft",
  },
  {
    table: "admin_profiles",
    label: "Team",
    href: "/admin/admin_profiles",
    icon: Users,
    hint: "People with access",
  },
  {
    table: "email_messages",
    label: "Mailbox",
    href: "/admin/email_messages",
    icon: CalendarClock,
    hint: "Synced messages",
  },
] as const;

/** The supporting numbers — content and delivery health. */
const secondary = [
  {
    table: "gallery_items",
    label: "Gallery",
    href: "/admin/gallery_items",
    icon: ImageIcon,
  },
  {
    table: "services",
    label: "Services",
    href: "/admin/services",
    icon: Sparkles,
  },
  {
    table: "notifications",
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    table: "email_send_log",
    label: "Emails sent",
    href: "/admin/email_send_log",
    icon: Send,
  },
] as const;

const quickActions = [
  {
    href: "/admin/articles/new",
    label: "Write an insight",
    body: "Draft, preview and publish a new article.",
    icon: FileText,
  },
  {
    href: "/admin/gallery_items/new",
    label: "Add to the gallery",
    body: "Upload an image and caption it.",
    icon: ImageIcon,
  },
  {
    href: "/admin/email-studio",
    label: "Open the Email Studio",
    body: "Read enquiries and reply in the branded shell.",
    icon: Mail,
  },
  {
    href: "/admin/settings",
    label: "Site settings",
    body: "Contact details, social links and SEO defaults.",
    icon: Settings,
  },
] as const;

const STATUS_TONE: Record<string, string> = {
  new: "bg-gold-500/15 text-gold-700",
  in_progress: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  awaiting_response: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  archived: "bg-muted text-muted-foreground",
};

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminOverview() {
  await connection();
  const session = await requireAdmin("editor");

  const [counts, secondaryCounts, enquiries, statuses, articles, notes, sends] =
    await Promise.all([
      Promise.all(headline.map((item) => countRows(item.table))),
      Promise.all(secondary.map((item) => countRows(item.table))),
      recentEnquiries(6),
      enquiryStatusCounts(),
      recentArticles(4),
      unreadNotifications(session.user.id, 4),
      recentSendLog(4),
    ]);

  const firstName = (session.profile.full_name ?? "").split(" ")[0];
  const mailLive = isMailConfigured();
  const failedSends = sends.filter((row) => row.status === "failed").length;
  const openEnquiries = (statuses.new ?? 0) + (statuses.in_progress ?? 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">
            Overview
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Everything on the site, in one place. Pick a table on the left to
            browse or edit it.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Live data
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em]",
              mailLive
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
            )}
          >
            {mailLive ? (
              <MailCheck className="size-3.5" aria-hidden />
            ) : (
              <MailWarning className="size-3.5" aria-hidden />
            )}
            {mailLive ? "SMTP configured" : "SMTP not configured"}
          </span>
        </div>
      </div>

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {headline.map((item, index) => {
          const Icon = item.icon;
          const count = counts[index];
          return (
            <Link
              key={item.table}
              href={item.href}
              className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-blush-300 text-plum-500 transition group-hover:bg-gold-500/20 group-hover:text-gold-700">
                  <Icon className="size-5" aria-hidden />
                </span>
                <ArrowUpRight
                  className="size-4 text-gold-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
              <p className="mt-4 font-display text-4xl font-medium text-plum-500">
                {count === null ? "—" : count}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-plum-600">
                {item.label}
              </p>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">{item.hint}</p>
            </Link>
          );
        })}
      </div>

      {/* Supporting numbers */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {secondary.map((item, index) => {
          const Icon = item.icon;
          const count = secondaryCounts[index];
          return (
            <Link
              key={item.table}
              href={item.href}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-gold-400 hover:bg-blush-100/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-ivory-300 text-plum-500 transition group-hover:bg-gold-500/20 group-hover:text-gold-700">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {item.label}
                </p>
                <p className="font-display text-xl leading-tight text-plum-500">
                  {count === null ? "—" : count}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Enquiry pipeline */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-plum-600">Enquiry pipeline</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {openEnquiries === 0
                ? "Nothing is waiting on a reply."
                : `${openEnquiries} ${openEnquiries === 1 ? "enquiry needs" : "enquiries need"} attention.`}
            </p>
          </div>
          <Link
            href="/admin/email-studio"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-plum-600 transition hover:border-gold-400 hover:text-gold-700"
          >
            Open Email Studio
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ["new", "New"],
              ["in_progress", "In progress"],
              ["awaiting_response", "Awaiting reply"],
              ["resolved", "Resolved"],
              ["archived", "Archived"],
            ] as const
          ).map(([key, label]) => (
            <Link
              key={key}
              href={`/admin/email-studio?status=${key}`}
              className="rounded-xl border border-border bg-ivory-100/60 px-4 py-3 transition hover:border-gold-400 hover:bg-blush-100/60"
            >
              <p className="font-display text-2xl text-plum-500">{statuses[key] ?? 0}</p>
              <p className="mt-0.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {label}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <h2 className="font-display text-xl text-plum-600">Quick actions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold-400 hover:shadow-md"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-blush-300 text-plum-500 transition group-hover:bg-gold-500/20 group-hover:text-gold-700">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <p className="mt-3 text-sm font-semibold text-plum-600">{action.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {action.body}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Latest enquiries + activity */}
      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
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
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide",
                          STATUS_TONE[String(row.status ?? "new")] ??
                            "bg-gold-500/15 text-gold-700",
                        )}
                      >
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

        <div className="space-y-5">
          {/* Unread notifications */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg text-plum-600">Needs your attention</h2>
              <Link
                href="/admin/notifications"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
              >
                All
              </Link>
            </div>
            {notes.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                You are all caught up.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {notes.map((note) => (
                  <li key={String(note.id)}>
                    <Link
                      href={String(note.link ?? "/admin/notifications")}
                      className="block px-5 py-3 transition hover:bg-blush-100/60"
                    >
                      <p className="truncate text-sm font-medium text-plum-600">
                        {String(note.title ?? "Notification")}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {String(note.body ?? "")}
                      </p>
                      <p className="mt-1 text-[0.68rem] text-muted-foreground/80">
                        {formatDateTime(note.created_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent insights */}
          <section className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-lg text-plum-600">Recent insights</h2>
              <Link
                href="/admin/articles/new"
                className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
              >
                <Plus className="size-3.5" aria-hidden />
                New
              </Link>
            </div>
            {articles.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No insights yet — write the first one.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {articles.map((article) => (
                  <li key={String(article.id)}>
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-blush-100/60"
                    >
                      <p className="min-w-0 truncate text-sm font-medium text-plum-600">
                        {String(article.title ?? "Untitled")}
                      </p>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide",
                          article.status === "published"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {String(article.status ?? "draft")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Delivery health */}
      <section className="rounded-2xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg text-plum-600">Delivery health</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {failedSends === 0
                ? "The last few outbound emails all went through."
                : `${failedSends} of the last ${sends.length} sends failed.`}
            </p>
          </div>
          <Link
            href="/admin/email-studio"
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-plum-600 transition hover:border-gold-400 hover:text-gold-700"
          >
            <ShieldCheck className="size-3.5" aria-hidden />
            Run a delivery check
          </Link>
        </div>

        {sends.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nothing has been sent yet. Enquiries, replies and invitations will
            appear here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sends.map((row) => (
              <li
                key={String(row.id)}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-charcoal-700">
                    {String(row.subject ?? "—")}
                  </p>
                  {row.status === "failed" && row.error ? (
                    <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-destructive">
                      {String(row.error)}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide",
                      row.status === "sent"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : row.status === "failed"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {String(row.status ?? "—")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
