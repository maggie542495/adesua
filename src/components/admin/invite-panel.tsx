"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Copy, Link2, Loader2, Mail, Send } from "lucide-react";
import { inviteAdmin, type InviteState } from "@/lib/admin/invitation-actions";
import { ROLE_LABELS, type AdminRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

const ROLE_HINTS: Record<string, string> = {
  editor:
    "Writes content, works enquiries and replies to visitors. Cannot publish anyone's role or delete records.",
  administrator:
    "Everything an editor can do, plus deleting records, email settings and sending invitations.",
  owner:
    "Full control, including team roles, security and site settings. Only an owner can appoint another.",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 shadow-sm transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Send className="size-4" aria-hidden />
      )}
      {pending ? "Sending…" : "Send invitation"}
    </button>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[0.68rem] font-semibold text-plum-600 transition hover:border-gold-400"
    >
      {copied ? (
        <Check className="size-3" aria-hidden />
      ) : (
        <Copy className="size-3" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

interface InvitePanelProps {
  roles: AdminRole[];
}

/**
 * The invitation composer.
 *
 * Invitations are the only way anyone joins the studio — there is no public
 * sign-up — so this form is the whole front door. It sends one email, shows
 * plainly whether that email left, and when it did not it hands over the link
 * instead of pretending the invitation reached anyone.
 */
export function InvitePanel({ roles }: InvitePanelProps) {
  const [state, formAction] = useActionState<InviteState, FormData>(inviteAdmin, {
    status: "idle",
  });
  const reduceMotion = useReducedMotion();
  const [role, setRole] = useState<AdminRole>("editor");
  const emailId = useId();
  const roleId = useId();

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-br from-plum-500/[0.06] via-transparent to-gold-500/[0.07] px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-plum-500/10 text-plum-600">
            <Mail className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl font-medium text-plum-600">
              Invite someone to the studio
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              They receive one email with a private link. Nothing is created until they
              open it and set a password — the link works once and lapses after seven days.
            </p>
          </div>
        </div>
      </div>

      <form action={formAction} className="px-6 py-5">
        <AnimatePresence mode="wait" initial={false}>
          {state.message && (
            <motion.div
              key={state.status + state.message}
              initial={reduceMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="mb-4"
            >
              {state.status === "success" ? (
                <div className="rounded-xl border border-gold-400/50 bg-gold-500/10 px-4 py-3">
                  <p className="flex items-start gap-2 text-sm text-gold-800">
                    <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{state.message}</span>
                  </p>
                  {state.fallbackUrl && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-gold-400/40 bg-card/70 px-2.5 py-2">
                      <Link2 className="size-3.5 shrink-0 text-gold-700" aria-hidden />
                      <code className="min-w-0 flex-1 truncate text-[0.7rem] text-charcoal-700">
                        {state.fallbackUrl}
                      </code>
                      <CopyButton value={state.fallbackUrl} />
                    </div>
                  )}
                </div>
              ) : (
                <p
                  role="alert"
                  className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{state.message}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_15rem_auto] lg:items-start">
          <div>
            <label htmlFor={emailId} className="block text-sm font-medium text-foreground">
              Email address
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              autoComplete="off"
              placeholder="name@example.com"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              The invitation is locked to this address — it cannot be accepted by anyone else.
            </p>
          </div>

          <div>
            <label htmlFor={roleId} className="block text-sm font-medium text-foreground">
              Access level
            </label>
            <select
              id={roleId}
              name="role"
              value={role}
              onChange={(event) => setRole(event.target.value as AdminRole)}
              className={inputClass}
            >
              {roles.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:pt-7">
            <Submit />
          </div>

        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={role}
            initial={reduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "mt-3 rounded-lg bg-ivory-100 px-3 py-2 text-xs leading-relaxed text-muted-foreground",
            )}
          >
            {ROLE_HINTS[role]}
          </motion.p>
        </AnimatePresence>
      </form>
    </section>
  );
}
