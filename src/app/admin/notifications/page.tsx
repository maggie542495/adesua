import Link from "next/link";
import { connection } from "next/server";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Mail,
  MailX,
  Search,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import {
  listNotifications,
  notificationKindCounts,
  NOTIFICATIONS_PER_PAGE,
  type NotificationKind,
} from "@/lib/admin/notification-store";
import { markEverythingRead, markOneRead } from "@/lib/admin/notification-actions";
import { formatDateTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const instant = false;

export const metadata = { title: "Notifications" };

interface PageProps {
  searchParams: Promise<{ page?: string; filter?: string; q?: string }>;
}

const KIND_STYLE: Record<NotificationKind, { label: string; icon: LucideIcon; className: string }> = {
  enquiry: {
    label: "Enquiry",
    icon: Inbox,
    className: "bg-plum-500/10 text-plum-600",
  },
  escalation: {
    label: "Escalation",
    icon: TriangleAlert,
    className: "bg-amber-100 text-amber-800",
  },
  email: {
    label: "Email",
    icon: Mail,
    className: "bg-gold-500/15 text-gold-800",
  },
  failure: {
    label: "Failed",
    icon: MailX,
    className: "bg-destructive/10 text-destructive",
  },
  activity: {
    label: "Activity",
    icon: Sparkles,
    className: "bg-emerald-100 text-emerald-700",
  },
  alert: {
    label: "Alert",
    icon: AlertTriangle,
    className: "bg-destructive/10 text-destructive",
  },
  system: {
    label: "System",
    icon: Bell,
    className: "bg-ivory-200 text-muted-foreground",
  },
};

const FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "enquiry", label: "Enquiries" },
  { value: "activity", label: "Activity" },
  { value: "failure", label: "Failures" },
  { value: "alert", label: "Alerts" },
  { value: "email", label: "Email" },
];

/**
 * The notification log.
 *
 * Read-only by design: these rows are written by the studio when something
 * happens, and letting an editor compose or delete them would turn a record
 * into a feed. The one write is marking an entry seen.
 */
export default async function NotificationsPage({ searchParams }: PageProps) {
  await connection();

  const session = await requireAdmin("editor");
  const sp = await searchParams;

  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const filter = sp.filter ?? "all";
  const query = sp.q ?? "";

  const [feed, counts] = await Promise.all([
    listNotifications({ recipientId: session.user.id, page, filter, query }),
    notificationKindCounts(session.user.id),
  ]);

  const href = (overrides: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    const merged = { filter: filter === "all" ? undefined : filter, q: query || undefined, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value === undefined || value === "") continue;
      next.set(key, String(value));
    }
    const search = next.toString();
    return search ? `/admin/notifications?${search}` : "/admin/notifications";
  };

  const rangeStart = feed.total === 0 ? 0 : (feed.page - 1) * NOTIFICATIONS_PER_PAGE + 1;
  const rangeEnd = Math.min(feed.page * NOTIFICATIONS_PER_PAGE, feed.total);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
            Studio
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">Notifications</h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Everything the studio has told you about — enquiries, content going live, mail
            failures and alerts. This list is written automatically and cannot be edited here.
          </p>
        </div>

        {feed.unread > 0 && (
          <form action={markEverythingRead}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-plum-600 transition hover:border-gold-400 hover:text-gold-700"
            >
              <CheckCheck className="size-4" aria-hidden />
              Mark all {feed.unread} read
            </button>
          </form>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((option) => {
            const active = filter === option.value;
            const count = counts[option.value] ?? 0;
            // A kind with nothing in it is noise in a filter bar.
            if (option.value !== "all" && option.value !== "unread" && count === 0) return null;

            return (
              <Link
                key={option.value}
                href={href({ filter: option.value === "all" ? undefined : option.value, page: 1 })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.08em] transition",
                  active
                    ? "border-plum-500 bg-plum-500 text-ivory-200"
                    : "border-border bg-card text-muted-foreground hover:border-gold-400 hover:text-plum-600",
                )}
              >
                {option.label}
                <span className={cn("ml-1.5", active ? "text-ivory-200/70" : "opacity-60")}>
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        <form action="/admin/notifications" className="relative w-full sm:w-64">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search notifications…"
            aria-label="Search notifications"
            className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </form>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {feed.items.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-ivory-200 text-muted-foreground">
              <Bell className="size-5" aria-hidden />
            </span>
            <p className="mt-3 font-display text-lg text-plum-600">
              {query || filter !== "all" ? "Nothing matches that view" : "Nothing to report"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
              {query || filter !== "all"
                ? "Try a different filter, or clear the search."
                : "When an enquiry arrives or something needs your attention, it lands here."}
            </p>
            {(query || filter !== "all") && (
              <Link
                href="/admin/notifications"
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gold-700 hover:text-gold-600"
              >
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {feed.items.map((item) => {
              const style = KIND_STYLE[item.kind] ?? KIND_STYLE.system;
              const Icon = style.icon;

              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex flex-wrap items-start gap-3 px-5 py-4 transition hover:bg-blush-100/40 sm:flex-nowrap",
                    !item.isRead && "bg-gold-500/[0.035]",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                      style.className,
                    )}
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!item.isRead && (
                        <span
                          aria-label="Unread"
                          className="size-1.5 shrink-0 rounded-full bg-gold-600"
                        />
                      )}
                      <p
                        className={cn(
                          "text-sm",
                          item.isRead ? "text-charcoal-700" : "font-semibold text-plum-600",
                        )}
                      >
                        {item.title}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.08em]",
                          style.className,
                        )}
                      >
                        {style.label}
                      </span>
                    </div>

                    {item.body && (
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-charcoal-700/80">
                        {item.body}
                      </p>
                    )}

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
                      <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
                      {item.readAt && <span>Read {formatDateTime(item.readAt)}</span>}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {item.link && (
                      <Link
                        href={item.link}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[0.68rem] font-semibold text-plum-600 transition hover:border-gold-400 hover:text-gold-700"
                      >
                        Open
                        <ArrowRight className="size-3" aria-hidden />
                      </Link>
                    )}
                    {!item.isRead && (
                      <form action={markOneRead}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          title="Mark as read"
                          aria-label="Mark as read"
                          className="inline-flex items-center justify-center rounded-md border border-border px-2 py-1.5 text-muted-foreground transition hover:border-gold-400 hover:text-plum-600"
                        >
                          <CheckCheck className="size-3.5" aria-hidden />
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {feed.total > 0 && (
        <nav
          aria-label="Pagination"
          className="flex flex-wrap items-center justify-between gap-3 text-sm"
        >
          <p className="text-muted-foreground">
            Showing {rangeStart}–{rangeEnd} of {feed.total}
            {feed.unread > 0 && ` · ${feed.unread} unread`}
          </p>

          {feed.totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Link
                href={href({ page: feed.page - 1 })}
                aria-disabled={feed.page <= 1}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-medium transition",
                  feed.page <= 1
                    ? "pointer-events-none border-border/50 text-muted-foreground/50"
                    : "border-border text-plum-600 hover:border-gold-400",
                )}
              >
                <ChevronLeft className="size-3.5" aria-hidden />
                Previous
              </Link>

              {pageNumbers(feed.page, feed.totalPages).map((entry, index) =>
                entry === null ? (
                  <span key={`gap-${index}`} className="px-1 text-muted-foreground">
                    …
                  </span>
                ) : (
                  <Link
                    key={entry}
                    href={href({ page: entry })}
                    aria-current={entry === feed.page ? "page" : undefined}
                    className={cn(
                      "min-w-8 rounded-md border px-2.5 py-1.5 text-center font-medium transition",
                      entry === feed.page
                        ? "border-plum-500 bg-plum-500 text-ivory-200"
                        : "border-border text-plum-600 hover:border-gold-400",
                    )}
                  >
                    {entry}
                  </Link>
                ),
              )}

              <Link
                href={href({ page: feed.page + 1 })}
                aria-disabled={feed.page >= feed.totalPages}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md border px-3 py-1.5 font-medium transition",
                  feed.page >= feed.totalPages
                    ? "pointer-events-none border-border/50 text-muted-foreground/50"
                    : "border-border text-plum-600 hover:border-gold-400",
                )}
              >
                Next
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            </div>
          )}
        </nav>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ArrowLeft className="size-3.5" aria-hidden />
        <Link href="/admin" className="hover:text-plum-600">
          Back to the dashboard
        </Link>
      </p>
    </div>
  );
}

/**
 * Page numbers with gaps, so twenty pages do not become twenty links: the
 * first, the last, and a window around where you are.
 */
function pageNumbers(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set<number>([1, total, current]);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | null)[] = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) out.push(null);
    out.push(value);
  });

  return out;
}
