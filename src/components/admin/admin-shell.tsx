"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ExternalLink, Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { NotificationBell, type NotificationRow } from "@/components/admin/notification-bell";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { signOut } from "@/lib/admin/actions";

interface AdminShellProps {
  email: string;
  role: string;
  name: string;
  /** Read on the server in `admin/layout.tsx` and handed down. */
  notifications: { unread: number; rows: NotificationRow[] };
  children: React.ReactNode;
}

const STORAGE_KEY = "adesua-admin-sidebar-collapsed";

/**
 * The collapsed flag lives in localStorage, which is an external store — so it
 * is read through `useSyncExternalStore` rather than copied into state inside
 * an effect. The server snapshot is always expanded, which keeps hydration
 * stable; the real value arrives on the first client read.
 */
let collapsedListeners: Array<() => void> = [];

function subscribeCollapsed(onChange: () => void) {
  collapsedListeners.push(onChange);
  return () => {
    collapsedListeners = collapsedListeners.filter((listener) => listener !== onChange);
  };
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Private mode — the default expanded rail is fine.
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  } catch {
    // Ignore storage failures.
  }
  for (const listener of collapsedListeners) listener();
}

/**
 * The admin frame.
 *
 * The viewport is locked to `h-dvh` and only the main pane scrolls, so the
 * sidebar and header stay put on desktop. The rail keeps its own scroll for
 * long table lists, and its collapsed state is remembered per browser.
 */
export function AdminShell({
  email,
  role,
  name,
  notifications,
  children,
}: AdminShellProps) {
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    () => false,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-ivory-100">
      <AdminSidebar
        email={email}
        role={role}
        collapsed={collapsed}
        onToggleCollapsed={() => writeCollapsed(!collapsed)}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-ivory-200/90 px-4 py-3 backdrop-blur-md lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-plum-600 transition hover:bg-blush-300 lg:hidden"
              aria-label="Open admin menu"
            >
              <Menu className="size-5" aria-hidden />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-plum-600">{name || email}</p>
              <p className="truncate text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
                {role}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <NotificationBell unread={notifications.unread} rows={notifications.rows} />
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-plum-600 transition hover:border-gold-400 hover:text-gold-700 sm:inline-flex"
            >
              View site
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-plum-600 transition hover:border-destructive/50 hover:text-destructive"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
