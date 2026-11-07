"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import type { FieldDef } from "@/lib/admin/schema";
import type { SaveState } from "@/lib/admin/actions";
import { toInputValue } from "@/lib/admin/derive";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-ivory-200 disabled:text-muted-foreground";
const labelClass = "block text-sm font-medium text-foreground";

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : isNew ? "Create record" : "Save changes"}
    </button>
  );
}

export interface RecordFormProps {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  fields: readonly FieldDef[];
  initial: Record<string, unknown> | null;
  title: string;
  listPath: string;
  isNew: boolean;
}

export function RecordForm({
  action,
  deleteAction,
  fields,
  initial,
  title,
  listPath,
  isNew,
}: RecordFormProps) {
  const [state, formAction] = useActionState(action, { status: "idle" });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={listPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to list
          </Link>
          <h1 className="mt-2 font-display text-3xl font-medium text-plum-600">{title}</h1>
        </div>

        {deleteAction && (
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          </form>
        )}
      </div>

      {state.status === "saved" && (
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

      <form action={formAction} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          {fields.map((field) => {
            const value = initial?.[field.name];
            const id = `field-${field.name}`;

            return (
              <div key={field.name} className={cn(field.span === 2 && "sm:col-span-2")}>
                <label htmlFor={id} className={labelClass}>
                  {field.label}
                  {field.readOnly && (
                    <span className="ml-2 text-[0.68rem] uppercase tracking-wide text-muted-foreground">
                      read only
                    </span>
                  )}
                </label>

                {field.type === "boolean" ? (
                  <label className="mt-2 flex items-center gap-2 text-sm text-charcoal-700">
                    <input
                      id={id}
                      name={field.name}
                      type="checkbox"
                      defaultChecked={Boolean(value)}
                      value="true"
                      disabled={field.readOnly}
                      className="size-4 rounded border-border text-plum-500 focus:ring-gold-500"
                    />
                    Enabled
                  </label>
                ) : field.type === "textarea" || field.type === "json" ? (
                  <textarea
                    id={id}
                    name={field.name}
                    rows={field.type === "json" ? 6 : 4}
                    defaultValue={toInputValue(value, field.type)}
                    disabled={field.readOnly}
                    className={cn(inputClass, field.type === "json" && "font-mono text-xs")}
                  />
                ) : field.type === "select" && field.options ? (
                  <select
                    id={id}
                    name={field.name}
                    defaultValue={toInputValue(value, field.type)}
                    disabled={field.readOnly}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    name={field.name}
                    type={
                      field.type === "number"
                        ? "number"
                        : field.type === "datetime"
                          ? "datetime-local"
                          : field.type === "email"
                            ? "email"
                            : field.type === "url"
                              ? "text"
                              : "text"
                    }
                    defaultValue={toInputValue(value, field.type)}
                    disabled={field.readOnly}
                    className={inputClass}
                  />
                )}

                {field.help && (
                  <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-5">
          <SaveButton isNew={isNew} />
          <Link href={listPath} className="text-sm text-muted-foreground hover:text-plum-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
