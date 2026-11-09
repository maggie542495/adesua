"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { changePassword, type StudioState } from "@/lib/admin/studio-actions";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Updating…" : "Update password"}
    </button>
  );
}

export function PasswordForm() {
  const [state, formAction] = useActionState<StudioState, FormData>(changePassword, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.status === "success" && (
        <p className="flex items-center gap-2 rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-foreground">
          Confirm password
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={inputClass}
        />
      </div>
      <Submit />
    </form>
  );
}
