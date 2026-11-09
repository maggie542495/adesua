import { connection } from "next/server";
import { KeyRound, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/admin/format";
import { PasswordForm } from "@/components/admin/password-form";
import { MfaPanel } from "@/components/admin/mfa-panel";
import { signOutEverywhere } from "@/lib/admin/studio-actions";

export const instant = false;

export const metadata = { title: "Security" };

export default async function SecurityPage() {
  await connection();
  const session = await requireAdmin("editor");

  const supabase = await createClient();
  const [{ data: factors }, { data: audit }] = await Promise.all([
    supabase.auth.mfa.listFactors(),
    supabase
      .from("audit_logs")
      .select("action, resource_type, created_at")
      .eq("actor_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const verified = factors?.totp?.filter((factor) => factor.status === "verified") ?? [];
  const hasMfa = verified.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
          Team &amp; access
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">Security</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Password, two-factor authentication and session control for {session.user.email}.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-gold-700" aria-hidden />
            <h2 className="font-display text-xl text-plum-600">Password</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Use at least 10 characters. Changing it signs out other devices on next refresh.
          </p>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            {hasMfa ? (
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
            ) : (
              <ShieldAlert className="size-4 text-amber-600" aria-hidden />
            )}
            <h2 className="font-display text-xl text-plum-600">Two-factor authentication</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasMfa
              ? `Active on ${verified.length} authenticator${verified.length === 1 ? "" : "s"}.`
              : "Not enabled. Add an authenticator app for a second layer of protection."}
          </p>
          <div className="mt-4">
            <MfaPanel hasMfa={hasMfa} />
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl text-plum-600">Sessions</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign out of every device, including this one.
            </p>
          </div>
          <form action={signOutEverywhere}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
            >
              <LogOut className="size-3.5" aria-hidden />
              Sign out everywhere
            </button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-xl text-plum-600">Recent account activity</h2>
        </div>
        {!audit?.length ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground">
            No recorded activity yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {audit.map((row, index) => (
              <li
                key={`${row.action}-${index}`}
                className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
              >
                <span className="text-charcoal-700">
                  {row.action.replace(/_/g, " ")}
                  {row.resource_type ? ` · ${row.resource_type}` : ""}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDateTime(row.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
