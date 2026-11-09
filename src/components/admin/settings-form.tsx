"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { StudioState } from "@/lib/admin/studio-actions";

interface Field {
  key: string;
  label: string;
  help?: string;
  type: "text" | "textarea" | "json";
  value: string;
}

interface Group {
  title: string;
  fields: Field[];
}

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : "Save settings"}
    </button>
  );
}

export function SettingsForm({
  action,
  groups,
}: {
  action: (prev: StudioState, formData: FormData) => Promise<StudioState>;
  groups: Group[];
}) {
  const [state, formAction] = useActionState<StudioState, FormData>(action, { status: "idle" });

  return (
    <form action={formAction} className="space-y-6">
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

      {groups
        .filter((group) => group.fields.length > 0)
        .map((group) => (
          <section key={group.title} className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl text-plum-600">{group.title}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.key} className={field.type === "text" ? "" : "sm:col-span-2"}>
                  <label
                    htmlFor={`setting-${field.key}`}
                    className="block text-sm font-medium capitalize text-foreground"
                  >
                    {field.label}
                  </label>
                  {field.type === "text" ? (
                    <input
                      id={`setting-${field.key}`}
                      name={`setting:${field.key}`}
                      defaultValue={field.value}
                      className={inputClass}
                    />
                  ) : (
                    <textarea
                      id={`setting-${field.key}`}
                      name={`setting:${field.key}`}
                      defaultValue={field.value}
                      rows={field.type === "json" ? 5 : 3}
                      className={`${inputClass} ${field.type === "json" ? "font-mono text-xs" : ""}`}
                    />
                  )}
                  {field.help && (
                    <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

      <SaveButton />
    </form>
  );
}
