"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2, Mail, User } from "lucide-react";
import { acceptInvitation, type AuthState } from "@/lib/auth/actions";

const inputClass =
  "w-full rounded-md border border-border bg-card py-2.5 pl-10 pr-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 aria-[invalid=true]:border-destructive/60";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 shadow-lg shadow-plum-500/25 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Joining the studio…" : "Accept invitation"}
    </button>
  );
}

interface InviteFormProps {
  token: string;
  email: string;
  role: string;
  invitedBy: string | null;
}

export function InviteForm({ token, email, role, invitedBy }: InviteFormProps) {
  const [state, formAction] = useActionState<AuthState, FormData>(acceptInvitation, {
    status: "idle",
  });
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-7 space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />

      <div className="rounded-xl border border-border bg-ivory-100 px-4 py-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Invited as
        </p>
        <p className="mt-1 text-sm font-semibold text-plum-600">{role}</p>
        {invitedBy && (
          <p className="mt-0.5 text-xs text-muted-foreground">Invited by {invitedBy}</p>
        )}
      </div>

      {state.status === "error" && !state.fieldErrors && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="invite-email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative mt-1.5">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="invite-email"
            type="email"
            value={email}
            readOnly
            disabled
            className={`${inputClass} disabled:bg-ivory-200 disabled:text-muted-foreground`}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          This address is fixed by the invitation.
        </p>
      </div>

      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
          Full name
        </label>
        <div className="relative mt-1.5">
          <User
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            placeholder="Your full name"
            aria-invalid={errors.fullName ? true : undefined}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            className={inputClass}
          />
        </div>
        {errors.fullName && (
          <p id="fullName-error" className="mt-1.5 text-xs text-destructive">
            {errors.fullName}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative mt-1.5">
          <KeyRound
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : "password-help"}
            className={inputClass}
          />
        </div>
        {errors.password ? (
          <p id="password-error" className="mt-1.5 text-xs text-destructive">
            {errors.password}
          </p>
        ) : (
          <p id="password-help" className="mt-1.5 text-xs text-muted-foreground">
            At least 12 characters, with upper case, lower case and a number.
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  );
}
