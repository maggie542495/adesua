"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Enrolment {
  factorId: string;
  qr: string;
  secret: string;
}

export function MfaPanel({ hasMfa }: { hasMfa: boolean }) {
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startEnrolment() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error: enrolError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (enrolError) throw enrolError;
      setEnrolment({
        factorId: data.id,
        qr: data.totp.qr_code,
        secret: data.totp.secret,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start enrolment.");
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    if (!enrolment) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrolment.factorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrolment.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (verifyError) throw verifyError;

      setMessage("Two-factor authentication is now active on this account.");
      setEnrolment(null);
      setCode("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That code did not work.");
    } finally {
      setBusy(false);
    }
  }

  if (hasMfa && !enrolment) {
    return (
      <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
        <ShieldCheck className="size-4" aria-hidden />
        Two-factor authentication is protecting this account.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {!enrolment ? (
        <button
          type="button"
          onClick={startEnrolment}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
        >
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {busy ? "Preparing…" : "Set up an authenticator"}
        </button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Scan this code with Google Authenticator, 1Password or Authy, then enter the
            six-digit code it shows.
          </p>
          {/* Supabase returns an SVG data URL for the QR code. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={enrolment.qr}
            alt="Two-factor authentication QR code"
            width={180}
            height={180}
            className="rounded-lg border border-border bg-white p-2"
          />
          <p className="break-all text-xs text-muted-foreground">
            Manual key: <code className="rounded bg-ivory-300 px-1.5 py-0.5">{enrolment.secret}</code>
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="mfa-code" className="block text-sm font-medium text-foreground">
                Six-digit code
              </label>
              <input
                id="mfa-code"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="mt-1.5 w-40 rounded-md border border-border bg-card px-3 py-2 text-sm tracking-[0.3em] focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>
            <button
              type="button"
              onClick={verify}
              disabled={busy || code.length !== 6}
              className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
              Verify and enable
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
