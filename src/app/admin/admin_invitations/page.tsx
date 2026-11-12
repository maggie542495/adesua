import { connection } from "next/server";
import { CheckCircle2, Clock, Mail, Users } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";
import {
  listInvitations,
  listTeam,
  roleAllowedFor,
  summariseInvitations,
} from "@/lib/admin/invitations";
import { InvitePanel } from "@/components/admin/invite-panel";
import { InvitationTable } from "@/components/admin/invitation-table";
import { TeamList } from "@/components/admin/team-list";
import { cn } from "@/lib/utils";

export const instant = false;

export const metadata = { title: "Invitations" };

/**
 * Invitations get a screen of their own rather than the generic table form.
 *
 * Sending an invitation is not editing a row: the row is a credential, the
 * write is an email, and the outcome is somebody joining the team days later.
 * The generic screen offered a "New invitation" form that could never have
 * produced a working link, and no way to see whether anything was accepted.
 */
export default async function InvitationsPage() {
  await connection();

  const session = await requireAdmin("administrator");
  const canManageTeam = roleAtLeast(session.profile.role, "owner");

  const [invitations, team] = await Promise.all([listInvitations(), listTeam(session)]);

  const stats = summariseInvitations(invitations);
  const cards = [
    { label: "Awaiting acceptance", value: stats.pending, icon: Clock, tone: "gold" },
    { label: "Accepted", value: stats.accepted, icon: CheckCircle2, tone: "green" },
    { label: "Lapsed", value: stats.expired + stats.revoked, icon: Mail, tone: "plain" },
    { label: "On the team", value: team.length, icon: Users, tone: "plum" },
  ] as const;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
          Team &amp; access
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">Invitations</h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Nobody can sign themselves up. Everyone who works in the studio arrives through
          an invitation sent from this page, and takes the role they were invited at.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  card.tone === "gold"
                    ? "bg-gold-500/15 text-gold-800"
                    : card.tone === "green"
                      ? "bg-emerald-100 text-emerald-700"
                      : card.tone === "plum"
                        ? "bg-plum-500/10 text-plum-600"
                        : "bg-ivory-200 text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {card.label}
                </dt>
                <dd className="font-display text-xl font-medium text-plum-600">{card.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>

      <InvitePanel roles={roleAllowedFor(session)} />

      <InvitationTable invitations={invitations} />

      <TeamList team={team} canManage={canManageTeam} viewerRole={session.profile.role} />
    </div>
  );
}
