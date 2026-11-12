"use client";

import { useFormStatus } from "react-dom";
import { Eye, ShieldCheck, UserX, Users } from "lucide-react";
import { setMemberRole, setMemberSuspended } from "@/lib/admin/invitation-actions";
import type { TeamMember } from "@/lib/admin/invitations";
import { ROLE_LABELS, type AdminRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

function relative(value: string | null): string {
  if (!value) return "never signed in";
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return "signed in today";
  if (days === 1) return "signed in yesterday";
  if (days < 30) return `signed in ${days} days ago`;
  return `last seen ${new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function RowButton({ label, danger }: { label: string; danger?: boolean }) {
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
          : "border-border text-plum-600 hover:border-gold-400",
      )}
    >
      {pending ? (
        <span className="size-3 animate-pulse rounded-full bg-current" />
      ) : danger ? (
        <UserX className="size-3.5" aria-hidden />
      ) : (
        <ShieldCheck className="size-3.5" aria-hidden />
      )}
    </button>
  );
}

interface TeamListProps {
  team: TeamMember[];
  canManage: boolean;
  viewerRole: AdminRole;
}

/**
 * The people who can actually sign in.
 *
 * Role changes are owner-only and never touch your own row — that is how a
 * studio ends up with no owner. Neither action is offered on the viewer's own
 * account, so the guard is visible in the interface as well as enforced in the
 * action.
 */
export function TeamList({ team, canManage, viewerRole }: TeamListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex size-8 items-center justify-center rounded-full bg-plum-500/10 text-plum-600">
          <Users className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-medium text-plum-600">The team</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {team.length} account{team.length === 1 ? "" : "s"} with studio access.
          </p>
        </div>
      </div>

      <ul className="divide-y divide-border">
        {team.map((member) => {
          const suspended = member.status !== "active";
          const mayTouchOwners = viewerRole === "owner";
          // Never your own row, and only an owner may touch an owner.
          const editable = canManage && !member.isSelf && (member.role !== "owner" || mayTouchOwners);

          return (
            <li
              key={member.id}
              className={cn(
                "flex flex-wrap items-center gap-3 px-5 py-3.5",
                suspended && "bg-ivory-100/60",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold",
                  suspended
                    ? "bg-ivory-200 text-muted-foreground"
                    : "bg-gold-500/15 text-gold-800",
                )}
              >
                {(member.fullName || member.email).slice(0, 1).toUpperCase()}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-charcoal-700">
                  {member.fullName || member.email.split("@")[0]}
                  {member.isSelf && (
                    <span className="rounded-full bg-plum-500/10 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-plum-600">
                      You
                    </span>
                  )}
                  {suspended && (
                    <span className="rounded-full bg-ivory-200 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Suspended
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-[0.7rem] text-muted-foreground">
                  {member.email} · {relative(member.lastLoginAt)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {editable ? (
                  <>
                    <form action={setMemberRole} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={member.id} />
                      <label className="sr-only" htmlFor={`role-${member.id}`}>
                        Role for {member.email}
                      </label>
                      <select
                        id={`role-${member.id}`}
                        name="role"
                        defaultValue={member.role}
                        className="rounded-md border border-border bg-card px-2 py-1 text-[0.7rem] text-charcoal-700 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      >
                        {(["editor", "administrator", "owner"] as const)
                          .filter((role) => role !== "owner" || mayTouchOwners)
                          .map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                      </select>
                      <RowButton label={`Save role for ${member.email}`} />
                    </form>

                    <form action={setMemberSuspended}>
                      <input type="hidden" name="id" value={member.id} />
                      <input type="hidden" name="suspend" value={suspended ? "false" : "true"} />
                      <RowButton
                        label={
                          suspended
                            ? `Restore ${member.email}`
                            : `Suspend ${member.email}`
                        }
                        danger={!suspended}
                      />
                    </form>
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[0.68rem] font-medium text-muted-foreground">
                    <Eye className="size-3" aria-hidden />
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
