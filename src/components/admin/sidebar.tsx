"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, LayoutDashboard, X, Menu } from "lucide-react";
import { adminGroups, tablesInGroup } from "@/lib/admin/schema";
import { cn } from "@/lib/utils";

/**
 * Schema-driven navigation: every table in the registry appears here under its
 * group, so the sidebar can never drift from what the admin can actually edit.
 */
export function AdminSidebar({ email, role }: { email: string; role: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-on-band/15 px-5 py-5">
        <Image
          src="/brand/icon.png"
          alt=""
          width={36}
          height={36}
          className="size-9 rounded-full ring-1 ring-gold-400/50"
        />
        <div className="min-w-0">
          <p className="truncate font-display text-lg leading-tight text-on-band">Adesua</p>
          <p className="truncate text-[0.65rem] uppercase tracking-[0.18em] text-gold-300">
            Admin
          </p>
        </div>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 py-4">
        <Link
          href="/admin"
          className={cn(
            "mb-3 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
            pathname === "/admin"
              ? "bg-gold-500/20 text-on-band"
              : "text-on-band/75 hover:bg-on-band/10 hover:text-on-band",
          )}
        >
          <LayoutDashboard className="size-4" aria-hidden />
          Overview
        </Link>

        {adminGroups.map((group) => {
          const tables = tablesInGroup(group);
          if (!tables.length) return null;
          const isCollapsed = collapsed[group];

          return (
            <div key={group} className="mt-4">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
                className="flex w-full items-center justify-between px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-300/90 hover:text-gold-300"
                aria-expanded={!isCollapsed}
              >
                {group}
                <ChevronDown
                  className={cn("size-3.5 transition-transform", isCollapsed && "-rotate-90")}
                  aria-hidden
                />
              </button>

              {!isCollapsed && (
                <ul className="mt-1 space-y-0.5">
                  {tables.map((def) => {
                    const href = `/admin/${def.table}`;
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <li key={def.table}>
                        <Link
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition",
                            active
                              ? "bg-gold-500/20 font-medium text-on-band"
                              : "text-on-band/70 hover:bg-on-band/10 hover:text-on-band",
                          )}
                        >
                          <span className="truncate">{def.plural}</span>
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

      <div className="border-t border-on-band/15 px-5 py-4">
        <p className="truncate text-xs text-on-band/60">{email}</p>
        <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.16em] text-gold-300">{role}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex size-10 items-center justify-center rounded-full bg-plum-500 text-ivory-200 shadow-lg lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Desktop rail */}
      <aside className="hidden w-64 shrink-0 bg-gradient-to-b from-band to-band-3 lg:block">
        {content}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin menu"
            className="absolute inset-0 bg-charcoal-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 bg-gradient-to-b from-band to-band-3 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 flex size-9 items-center justify-center rounded-full text-on-band/70 hover:bg-on-band/10"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
