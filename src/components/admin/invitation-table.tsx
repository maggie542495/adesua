"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Mail,
  RotateCcw,
  Search,
  ShieldOff,
  UserCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { revokeInvitation, resendInvitation } from "@/lib/admin/invitation-actions";
import type { InvitationRecord, InvitationStatus } from "@/lib/admin/invitations";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function relative(value: string): string {
  const then = new Date(value).getTime();
  const diff = Date.now() - then;
  const days = Math.floor(diff / 86_400_000);

  if (days < 1) {
    const hours = Math.floor(diff / 3_600_000);
    if (hours < 1) return "just now";
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_STYLE: Record<InvitationStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: {
    label: "Awaiting acceptance",
    className: "border-amber-300/60 bg-amber-50 text-amber-800",
    icon: Clock,
  },
  accepted: {
    label: "Accepted",
    className: "border-emerald-300/60 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  expired: {
    label: "Expired",
    className: "border-border bg-ivory-200 text-muted-foreground",
    icon: CalendarClock,
  },
  revoked: {
    label: "Revoked",
    className: "border-border bg-ivory-200 text-muted-foreground",
    icon: XCircle,
  },
};

function RowAction({
  children,
  label,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  danger?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-md border transition disabled:opacity-50",
        danger
          ? "border-destructive/30 text-destructive hover:bg-destructive/10"
          : "border-border text-plum-600 hover:border-gold-400 hover:text-gold-700",
      )}
    >
      {pending ? <span className="size-3 animate-pulse rounded-full bg-current" /> : children}
    </button>
  );
}

const FILTERS: { value: "all" | InvitationStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Awaiting" },
  { value: "accepted", label: "Accepted" },
  { value: "expired", label: "Expired" },
  { value: "revoked", label: "Revoked" },
];

interface InvitationTableProps {
  invitations: InvitationRecord[];
}

/**
 * The record of every invitation ever sent — who, at what level, by whom, and
 * where it stands now. Revoked and expired rows are kept rather than deleted:
 * "what happened to that invitation" is a question this page should answer.
 */
export function InvitationTable({ invitations }: InvitationTableProps) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<"all" | InvitationStatus>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: invitations.length };
    for (const row of invitations) out[row.status] = (out[row.status] ?? 0) + 1;
    return out;
  }, [invitations]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return invitations.filter((row) => {
      if (filter !== "all" && row.status !== filter) return false;
      if (!term) return true;
      return (
        row.email.toLowerCase().includes(term) ||
        (row.invitedBy ?? "").toLowerCase().includes(term)
      );
    });
  }, [invitations, filter, query]);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-medium text-plum-600">Invitation records</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every invitation sent, and where each one stands.
          </p>
        </div>

        <div className="relative w-full sm:w-56">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search email or inviter…"
            aria-label="Search invitations"
            className="w-full rounded-md border border-border bg-card py-1.5 pl-8 pr-3 text-xs shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-border bg-ivory-100/50 px-5 py-2.5">
        {FILTERS.map((option) => {
          const active = filter === option.value;
          const count = counts[option.value] ?? 0;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition",
                active
                  ? "bg-plum-500 text-ivory-200"
                  : "text-muted-foreground hover:bg-card hover:text-plum-600",
              )}
            >
              {option.label}
              <span className={cn("ml-1.5", active ? "text-ivory-200/70" : "opacity-60")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="px-6 py-14 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-ivory-200 text-muted-foreground">
            <UserPlus className="size-5" aria-hidden />
          </span>
          <p className="mt-3 font-display text-base text-plum-600">
            {invitations.length === 0 ? "No invitations yet" : "Nothing matches that view"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
            {invitations.length === 0
              ? "Invite someone above. They will appear here the moment the email is sent, and again when they accept."
              : "Try a different filter, or clear the search."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          <AnimatePresence initial={false}>
            {visible.map((row, index) => {
              const style = STATUS_STYLE[row.status];
              const StatusIcon = style.icon;
              const canAct = row.status === "pending" || row.status === "expired";

              return (
                <motion.li
                  key={row.id}
                  layout={reduceMotion ? false : true}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index, 8) * 0.03 }}
                  className="group flex flex-wrap items-center gap-3 px-5 py-3.5 transition hover:bg-blush-100/40"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      row.status === "accepted"
                        ? "bg-emerald-100 text-emerald-700"
                        : row.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-ivory-200 text-muted-foreground",
                    )}
                  >
                    {row.status === "accepted" ? (
                      <UserCheck className="size-4" aria-hidden />
                    ) : (
                      <Mail className="size-4" aria-hidden />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-charcoal-700">{row.email}</p>
                    <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
                      {ROLE_LABELS[row.role]}
                      {row.invitedBy ? ` · invited by ${row.invitedBy}` : ""}
                      {` · ${relative(row.createdAt)}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em]",
                        style.className,
                      )}
                    >
                      <StatusIcon className="size-2.5" aria-hidden />
                      {style.label}
                    </span>

                    <span className="hidden w-24 text-right text-[0.68rem] text-muted-foreground sm:block">
                      {row.status === "pending"
                        ? `${row.daysLeft} day${row.daysLeft === 1 ? "" : "s"} left`
                        : row.status === "accepted" && row.acceptedAt
                          ? relative(row.acceptedAt)
                          : row.status === "expired"
                            ? relative(row.expiresAt)
                            : "—"}
                    </span>

                    {canAct && (
                      <div className="flex items-center gap-1.5">
                        <form action={resendInvitation}>
                          <input type="hidden" name="id" value={row.id} />
                          <RowAction label={`Re-send invitation to ${row.email}`}>
                            <RotateCcw className="size-3.5" aria-hidden />
                          </RowAction>
                        </form>
                        <form action={revokeInvitation}>
                          <input type="hidden" name="id" value={row.id} />
                          <RowAction label={`Revoke invitation for ${row.email}`} danger>
                            <ShieldOff className="size-3.5" aria-hidden />
                          </RowAction>
                        </form>
                      </div>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}
