"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, Loader2, Mail, User } from "lucide-react";
import { setupOwner, type AuthState } from "@/lib/auth/actions";

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
      {pending ? "Creating owner…" : "Create owner account"}
    </button>
  );
}

interface Field {
  name: string;
  label: string;
  type: string;
  icon: typeof Mail;
  autoComplete?: string;
  placeholder?: string;
  help?: string;
  span?: boolean;
}

const fields: readonly Field[] = [
  {
    name: "fullName",
    label: "Full name",
    type: "text",
    icon: User,
    autoComplete: "name",
    placeholder: "Adesua Oriaifo",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    icon: Mail,
    autoComplete: "email",
    placeholder: "you@example.com",
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    icon: KeyRound,
    autoComplete: "new-password",
    help: "At least 12 characters, with upper case, lower case and a number.",
    span: true,
  },
  {
    name: "setupSecret",
    label: "Setup secret",
    type: "password",
    icon: KeyRound,
    placeholder: "ADMIN_SETUP_SECRET",
    help: "The value of ADMIN_SETUP_SECRET on this deployment.",
    span: true,
  },
];

export function SetupForm() {
  const [state, formAction] = useActionState<AuthState, FormData>(setupOwner, {
    status: "idle",
  });
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mt-7 space-y-5" noValidate>
      {state.status === "error" && !state.fieldErrors && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      {fields.map((field) => {
        const Icon = field.icon;
        const error = errors[field.name];

        return (
          <div key={field.name}>
            <label htmlFor={field.name} className="block text-sm font-medium text-foreground">
              {field.label}
            </label>
            <div className="relative mt-1.5">
              <Icon
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id={field.name}
                name={field.name}
                type={field.type}
                autoComplete={field.autoComplete}
                required
                placeholder={field.placeholder}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? `${field.name}-error` : undefined}
                className={inputClass}
              />
            </div>
            {error ? (
              <p id={`${field.name}-error`} className="mt-1.5 text-xs text-destructive">
                {error}
              </p>
            ) : (
              field.help && (
                <p className="mt-1.5 text-xs text-muted-foreground">{field.help}</p>
              )
            )}
          </div>
        );
      })}

      <SubmitButton />
    </form>
  );
}
