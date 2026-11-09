"use client";

import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import { formatDateTime } from "@/lib/admin/format";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/admin/studio-actions";

export interface NotificationRow {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  unread: number;
  rows: NotificationRow[];
}

/**
 * The header bell.
 *
 * It is a client component because the admin shell is one — the data is read
 * on the server in `admin/layout.tsx` and handed down, so this file never
 * touches `next/headers`. The two forms post to server actions, which is
 * allowed from a client component.
 */
export function NotificationBell({ unread, rows }: NotificationBellProps) {
  return (
    <details className="group relative">
      <summary
        className="relative flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-border text-plum-600 transition hover:border-gold-400 hover:text-gold-700 [&::-webkit-details-marker]:hidden"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-gold-600 px-1 text-[0.6rem] font-bold text-ivory-100">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Notifications
          </p>
          {unread > 0 && (
            <form action={markAllNotificationsRead}>
              <button
                type="submit"
                className="inline-flex items-center gap-1 text-[0.68rem] font-semibold text-gold-700 hover:text-gold-600"
              >
                <CheckCheck className="size-3" aria-hidden />
                Mark all read
              </button>
            </form>
          )}
        </div>

        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {rows.length === 0 && (
            <li className="px-4 py-8 text-center text-xs text-muted-foreground">
              Nothing yet. Activity on the site lands here.
            </li>
          )}
          {rows.map((row) => (
            <li key={row.id} className={row.is_read ? "" : "bg-gold-500/5"}>
              <div className="flex items-start gap-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={row.link ?? "/admin/notifications"}
                    className="block truncate text-sm font-medium text-plum-600 hover:text-gold-700"
                  >
                    {row.title}
                  </Link>
                  {row.body && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.body}</p>
                  )}
                  <p className="mt-1 text-[0.62rem] uppercase tracking-wide text-muted-foreground">
                    {formatDateTime(row.created_at)}
                  </p>
                </div>
                {!row.is_read && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={row.id} />
                    <button
                      type="submit"
                      aria-label="Mark as read"
                      className="mt-1 size-2 rounded-full bg-gold-500 transition hover:bg-gold-600"
                    />
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>

        <Link
          href="/admin/notifications"
          className="block border-t border-border px-4 py-2.5 text-center text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-700 hover:bg-blush-100/60"
        >
          View all
        </Link>
      </div>
    </details>
  );
}
