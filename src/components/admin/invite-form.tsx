"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { inviteAdmin, type StudioState } from "@/lib/admin/studio-actions";

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
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
      {pending ? "Inviting…" : "Send invitation"}
    </button>
  );
}

export function InviteForm() {
  const [state, formAction] = useActionState<StudioState, FormData>(inviteAdmin, {
    status: "idle",
  });

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-plum-600">Invite someone to the studio</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        They receive a branded email with a seven-day link to set their password.
      </p>

      {state.status === "success" && (
        <p className="mt-4 flex items-center gap-2 rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="name@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="invite-role" className="block text-sm font-medium text-foreground">
            Role
          </label>
          <select id="invite-role" name="role" defaultValue="editor" className={inputClass}>
            <option value="editor">Editor</option>
            <option value="administrator">Administrator</option>
            <option value="owner">Owner</option>
          </select>
        </div>
        <Submit />
      </div>
    </form>
  );
}
