import type { Metadata } from "next";
import Link from "next/link";
import { SetupForm } from "@/components/auth/setup-form";
import { InviteForm } from "@/components/auth/invite-form";
import { lookupInvitation } from "@/lib/auth/actions";
import { ROLE_LABELS } from "@/lib/auth/roles";

export const metadata: Metadata = {
  title: "Join the studio",
  robots: { index: false, follow: false },
};

// The invitation token arrives in `searchParams` and is looked up live, so
// there is nothing to prerender — this is a blocking route by design.
export const instant = false;

interface PageProps {
  searchParams: Promise<{ invite?: string }>;
}

export default async function SetupPage({ searchParams }: PageProps) {
  const { invite } = await searchParams;

  if (invite) {
    const invitation = await lookupInvitation(invite);

    if (!invitation) {
      return (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-700">
            Invitation
          </p>
          <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-plum-600">
            This link has lapsed
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Invitations expire after seven days and can only be used once. Ask
            whoever invited you for a fresh one — it takes a moment to send.
          </p>
          <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-plum-500 hover:text-gold-700">
              Sign in instead
            </Link>
          </p>
        </div>
      );
    }

    return (
      <div>
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-700">
          Invitation
        </p>
        <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-plum-600">
          Join the studio
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Set a name and password for {invitation.email}. You will be signed in
          straight away.
        </p>

        <InviteForm
          token={invite}
          email={invitation.email}
          role={ROLE_LABELS[invitation.role]}
          invitedBy={invitation.invitedBy}
        />

        <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
          Already set up?{" "}
          <Link href="/auth/login" className="font-semibold text-plum-500 hover:text-gold-700">
            Sign in instead
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-700">
        First-time setup
      </p>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-plum-600">
        Create the owner
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This runs once, and only while no owner exists. Everyone else joins later
        through an invitation from the Team page.
      </p>

      <SetupForm />

      <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
        Already set up?{" "}
        <Link href="/auth/login" className="font-semibold text-plum-500 hover:text-gold-700">
          Sign in instead
        </Link>
      </p>
    </div>
  );
}
