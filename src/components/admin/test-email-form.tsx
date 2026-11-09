"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Send } from "lucide-react";
import { sendTestEmailAction, type StudioState } from "@/lib/admin/studio-actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex shrink-0 items-center gap-2 rounded-md bg-plum-500 px-4 py-2 text-xs font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <Send className="size-3.5" aria-hidden />
      )}
      {pending ? "Sending…" : "Send test"}
    </button>
  );
}

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [state, formAction] = useActionState<StudioState, FormData>(sendTestEmailAction, {
    status: "idle",
  });

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="test-email-to" className="sr-only">
          Send a test email to
        </label>
        <input
          id="test-email-to"
          name="to"
          type="email"
          defaultValue={defaultTo}
          placeholder="you@example.com"
          className="min-w-0 flex-1 rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
        />
        <SubmitButton />
      </div>
      {state.status !== "idle" && state.message && (
        <p
          role="status"
          className={
            state.status === "success"
              ? "text-xs text-emerald-700 dark:text-emerald-300"
              : "text-xs text-destructive"
          }
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
