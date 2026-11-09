"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronDown,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { adminGroups, tablesInGroup } from "@/lib/admin/schema";
import { signOut } from "@/lib/admin/actions";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const workspace: NavLink[] = [
  { href: "/admin/email-studio", label: "Email Studio", icon: Mail },
  { href: "/admin/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/settings", label: "Site settings", icon: Settings },
  { href: "/admin/security", label: "Security & 2FA", icon: ShieldCheck },
];

/**
 * A group heading has no room for its label once the rail is collapsed, so it
 * shows this icon instead — the divider alone told you nothing about which
 * section you were looking at.
 */
const groupIcons: Record<string, LucideIcon> = {
  Enquiries: Inbox,
  Content: FileText,
  Email: Mail,
  Automation: Workflow,
  Chatbot: MessagesSquare,
  "Site & media": Images,
  "Team & access": Users,
  System: Settings,
};

interface AdminSidebarProps {
  email: string;
  role: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile drawer state. */
  open: boolean;
  onClose: () => void;
}

/**
 * Schema-driven navigation: every table in the registry appears here under its
 * group, so the sidebar can never drift from what the admin can actually edit.
 *
 * The rail is full-height and scrolls on its own — the page behind it never
 * moves. Collapsing is remembered per browser.
 */
export function AdminSidebar({
  email,
  role,
  collapsed,
  onToggleCollapsed,
  open,
  onClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (active: boolean, compact: boolean) =>
    cn(
      "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent",
      active
        ? "bg-sidebar-accent/15 font-medium text-sidebar-foreground"
        : "text-sidebar-muted hover:bg-sidebar-line hover:text-sidebar-foreground",
      compact && "justify-center px-0",
    );

  const content = (compact: boolean) => (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center gap-3 border-b border-sidebar-line",
          compact ? "justify-center px-2" : "px-4",
        )}
      >
        <Image
          src="/brand/icon.png"
          alt=""
          width={36}
          height={36}
          className="size-9 shrink-0 rounded-full ring-1 ring-sidebar-accent/50"
        />
        {!compact && (
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg leading-tight text-sidebar-foreground">Adesua</p>
            <p className="truncate text-[0.62rem] uppercase tracking-[0.18em] text-sidebar-accent">
              Studio
            </p>
          </div>
        )}
        {!compact && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-sidebar-muted transition hover:bg-sidebar-line hover:text-sidebar-foreground lg:flex"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        aria-label="Admin"
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain py-3",
          compact ? "px-2" : "px-3",
        )}
      >
        <Link
          href="/admin"
          onClick={onClose}
          aria-current={pathname === "/admin" ? "page" : undefined}
          aria-label={compact ? "Overview" : undefined}
          onMouseEnter={(event) => {
            if (!compact) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setTooltip({ label: "Overview", y: rect.top + rect.height / 2 });
          }}
          onMouseLeave={() => setTooltip(null)}
          className={linkClass(pathname === "/admin", compact)}
        >
          {pathname === "/admin" && (
            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-accent" />
          )}
          <LayoutDashboard className="size-4 shrink-0" aria-hidden />
          {!compact && <span className="truncate">Overview</span>}
        </Link>

        <div className="mt-4">
          {!compact && (
            <p className="px-3 pb-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-sidebar-muted">
              Workspace
            </p>
          )}
          <ul className="space-y-0.5">
            {workspace.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    aria-label={compact ? item.label : undefined}
                    onMouseEnter={(event) => {
                      if (!compact) return;
                      const rect = event.currentTarget.getBoundingClientRect();
                      setTooltip({ label: item.label, y: rect.top + rect.height / 2 });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    className={linkClass(active, compact)}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-accent" />
                    )}
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {!compact && <span className="truncate">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {adminGroups.map((group) => {
          const tables = tablesInGroup(group);
          if (!tables.length) return null;
          const isClosed = closedGroups[group];

          return (
            <div key={group} className="mt-4">
              {compact ? (
                <div
                  className="mx-2 mb-1 flex items-center justify-center border-t border-sidebar-line pt-2 text-sidebar-muted"
                  title={group}
                  aria-hidden
                >
                  {(() => {
                    const GroupIcon = groupIcons[group] ?? FileText;
                    return <GroupIcon className="size-3.5" />;
                  })()}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setClosedGroups((c) => ({ ...c, [group]: !c[group] }))}
                  className="flex w-full items-center justify-between px-3 py-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-sidebar-muted transition hover:text-sidebar-accent"
                  aria-expanded={!isClosed}
                >
                  {group}
                  <ChevronDown
                    className={cn("size-3.5 transition-transform", isClosed && "-rotate-90")}
                    aria-hidden
                  />
                </button>
              )}

              {!isClosed && (
                <ul className="space-y-0.5">
                  {tables.map((def) => {
                    const href = `/admin/${def.table}`;
                    const active = isActive(href);
                    const Icon = def.icon;
                    return (
                      <li key={def.table}>
                        <Link
                          href={href}
                          onClick={onClose}
                          aria-current={active ? "page" : undefined}
                          aria-label={compact ? def.plural : undefined}
                          onMouseEnter={(event) => {
                            if (!compact) return;
                            const rect = event.currentTarget.getBoundingClientRect();
                            setTooltip({ label: def.plural, y: rect.top + rect.height / 2 });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          className={linkClass(active, compact)}
                        >
                          {active && (
                            <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-sidebar-accent" />
                          )}
                          <Icon className="size-4 shrink-0" aria-hidden />
                          {!compact && <span className="truncate">{def.plural}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Account */}
      <div
        className={cn(
          "shrink-0 space-y-2 border-t border-sidebar-line",
          compact ? "px-2 py-3" : "px-3 py-3",
        )}
      >
        {compact ? (
          <>
            <form action={signOut}>
              <button
                type="submit"
                className="flex size-10 w-full items-center justify-center rounded-lg text-sidebar-muted transition hover:bg-destructive/20 hover:text-sidebar-foreground"
                aria-label="Sign out"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
            </form>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex size-10 w-full items-center justify-center rounded-lg text-sidebar-muted transition hover:bg-sidebar-line hover:text-sidebar-foreground"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="size-4" aria-hidden />
            </button>
          </>
        ) : (
          <>
            <div className="px-1">
              <p className="truncate text-xs text-sidebar-muted">{email}</p>
              <p className="mt-0.5 truncate text-[0.62rem] uppercase tracking-[0.16em] text-sidebar-accent">
                {role}
              </p>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/15 px-3 text-sm font-semibold text-sidebar-foreground transition hover:bg-destructive/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent"
              >
                <LogOut className="size-4" aria-hidden />
                Sign out
              </button>
            </form>
          </>
        )}
      </div>

      {tooltip && compact && (
        <div
          className="pointer-events-none fixed left-[5.5rem] z-[60] -translate-y-1/2 rounded-md bg-sidebar-3 px-2.5 py-1 text-xs font-medium text-sidebar-foreground shadow-lg"
          style={{ top: tooltip.y }}
        >
          {tooltip.label}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop rail — pinned to the viewport, scrolls in place */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col bg-gradient-to-b from-sidebar via-sidebar-2 to-sidebar-3 transition-[width] duration-200 ease-out lg:flex",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {content(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-sidebar-3/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-sidebar via-sidebar-2 to-sidebar-3 shadow-2xl">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-4 z-10 flex size-9 items-center justify-center rounded-full text-sidebar-muted hover:bg-sidebar-line"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
            {content(false)}
          </div>
        </div>
      )}
    </>
  );
}
