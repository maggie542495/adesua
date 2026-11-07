import type { Metadata } from "next";
import Link from "next/link";
import { SetupForm } from "@/components/auth/setup-form";

export const metadata: Metadata = {
  title: "Create the owner account",
  robots: { index: false, follow: false },
};

export default function SetupPage() {
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
