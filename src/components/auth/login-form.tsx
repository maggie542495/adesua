"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Lock, Mail } from "lucide-react";
import { signIn, type AuthState } from "@/lib/auth/actions";

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
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useActionState<AuthState, FormData>(signIn, { status: "idle" });
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-7 space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />

      {state.status === "error" && !errors.email && !errors.password && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email
        </label>
        <div className="relative mt-1.5">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={inputClass}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="mt-1.5 text-xs text-destructive">
            {errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Password
        </label>
        <div className="relative mt-1.5">
          <Lock
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            className={inputClass}
          />
        </div>
        {errors.password && (
          <p id="password-error" className="mt-1.5 text-xs text-destructive">
            {errors.password}
          </p>
        )}
      </div>

      <SubmitButton />

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Access is by invitation. If you need an account, ask the site owner to send
        you one.
      </p>
    </form>
  );
}
