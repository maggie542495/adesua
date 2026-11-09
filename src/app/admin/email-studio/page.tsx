import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Inbox, Mail, MailOpen, Reply } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { getEnquiries } from "@/lib/admin/data";
import { formatDateTime } from "@/lib/admin/format";
import { verifyMailConnection } from "@/lib/email/send";
import { ReplyForm } from "@/components/admin/reply-form";
import { TestEmailForm } from "@/components/admin/test-email-form";
import { setEnquiryStatus } from "@/lib/admin/studio-actions";
import { cn } from "@/lib/utils";

export const instant = false;

interface PageProps {
  searchParams: Promise<{ id?: string; status?: string }>;
}

const STATUSES = ["new", "in_progress", "awaiting_response", "resolved", "archived"] as const;

export default async function EmailStudioPage({ searchParams }: PageProps) {
  await connection();
  const session = await requireAdmin("editor");

  const { id, status } = await searchParams;

  // A real connection test, not an env-var check: the badge used to say
  // "connected" while every send failed on a rejected login.
  const mail = await verifyMailConnection();

  const all = await getEnquiries();
  const filtered = status ? all.filter((row) => row.status === status) : all;
  const selected = id ? all.find((row) => String(row.id) === id) ?? null : null;

  const counts = {
    total: all.length,
    new: all.filter((row) => row.status === "new").length,
    awaiting: all.filter((row) => row.status === "awaiting_response").length,
    resolved: all.filter((row) => row.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
            Communications
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">Email Studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every enquiry, in one thread. Reply in the branded shell without leaving the studio.
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em]",
            mail.ok && !mail.warning
              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              : mail.ok
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                : mail.configured
                  ? "bg-destructive/15 text-destructive"
                  : "bg-amber-500/15 text-amber-700 dark:text-amber-300",
          )}
        >
          {mail.ok
            ? mail.warning
              ? "SMTP connected — sender refused"
              : "SMTP connected"
            : mail.configured
              ? "SMTP login failed"
              : "SMTP not configured"}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-lg text-plum-600">Delivery check</h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
              Send a real message through the configured transport. If it arrives,
              enquiries, replies, invitations and alerts will send the same way.
            </p>
          </div>
          <div className="w-full max-w-sm">
            <TestEmailForm defaultTo={session.user.email ?? ""} />
          </div>
        </div>

        {/* The live connection result — the actual reason, not a guess. */}
        <div
          className={cn(
            "mt-4 rounded-xl border px-4 py-3",
            mail.ok
              ? "border-emerald-500/30 bg-emerald-500/5"
              : mail.configured
                ? "border-destructive/30 bg-destructive/5"
                : "border-amber-500/30 bg-amber-500/5",
          )}
        >
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Connection
          </p>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              mail.ok
                ? "text-emerald-700 dark:text-emerald-300"
                : mail.configured
                  ? "text-destructive"
                  : "text-amber-700 dark:text-amber-300",
            )}
          >
            {mail.message}
          </p>
          {mail.warning && (
            <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              {mail.warning}
            </p>
          )}
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-[0.7rem] text-muted-foreground sm:grid-cols-2">
            <div className="flex gap-1.5">
              <dt className="font-medium">Host</dt>
              <dd className="truncate">
                {mail.host ?? "—"}:{mail.port ?? "—"}
                {mail.secure ? " (TLS)" : " (STARTTLS)"}
              </dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium">User</dt>
              <dd className="truncate">{mail.user ?? "—"}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium">From</dt>
              <dd className="truncate">{mail.from ?? "—"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "All enquiries", value: counts.total, icon: Inbox },
          { label: "New", value: counts.new, icon: Mail },
          { label: "Awaiting reply", value: counts.awaiting, icon: Reply },
          { label: "Resolved", value: counts.resolved, icon: MailOpen },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-blush-300 text-plum-500">
                  <Icon className="size-4" aria-hidden />
                </span>
                <p className="font-display text-3xl text-plum-500">{card.value}</p>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
        {/* Thread list */}
        <div className="rounded-2xl border border-border bg-card">
          <div className="flex flex-wrap gap-1.5 border-b border-border p-3">
            <Link
              href="/admin/email-studio"
              className={cn(
                "rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] transition",
                !status ? "bg-plum-500 text-ivory-200" : "text-muted-foreground hover:text-plum-600",
              )}
            >
              All
            </Link>
            {STATUSES.map((value) => (
              <Link
                key={value}
                href={`/admin/email-studio?status=${value}`}
                className={cn(
                  "rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.1em] transition",
                  status === value
                    ? "bg-plum-500 text-ivory-200"
                    : "text-muted-foreground hover:text-plum-600",
                )}
              >
                {value.replace(/_/g, " ")}
              </Link>
            ))}
          </div>

          <ul className="max-h-[34rem] divide-y divide-border overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-muted-foreground">
                Nothing here yet.
              </li>
            )}
            {filtered.map((row) => {
              const active = String(row.id) === id;
              return (
                <li key={String(row.id)}>
                  <Link
                    href={`/admin/email-studio?id=${row.id}`}
                    className={cn(
                      "block px-4 py-3 transition",
                      active ? "bg-gold-500/10" : "hover:bg-blush-100/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-plum-600">
                        {String(row.name ?? "—")}
                      </p>
                      <span className="shrink-0 text-[0.65rem] text-muted-foreground">
                        {formatDateTime(row.created_at)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {String(row.subject ?? row.message ?? "")}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-gold-500/15 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-gold-700">
                      {String(row.status ?? "new").replace(/_/g, " ")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Reading pane */}
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
          {!selected ? (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center text-center">
              <Mail className="size-8 text-gold-600" aria-hidden />
              <p className="mt-3 font-display text-2xl text-plum-500">Choose a conversation</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Select an enquiry on the left to read it and reply. Replies go out in the
                branded email shell and are logged against the enquiry.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href="/admin/email-studio"
                    className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
                  >
                    <ArrowLeft className="size-3" aria-hidden />
                    Back
                  </Link>
                  <h2 className="mt-2 font-display text-2xl text-plum-600">
                    {String(selected.subject ?? `Enquiry from ${selected.name}`)}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {String(selected.name)} ·{" "}
                    <a
                      href={`mailto:${String(selected.email)}`}
                      className="text-gold-700 hover:underline"
                    >
                      {String(selected.email)}
                    </a>
                    {selected.phone ? ` · ${String(selected.phone)}` : ""}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {String(selected.category ?? "other")} · {formatDateTime(selected.created_at)}
                  </p>
                </div>

                <form action={setEnquiryStatus} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={String(selected.id)} />
                  <select
                    name="status"
                    defaultValue={String(selected.status ?? "new")}
                    className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
                  >
                    {STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {value.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-plum-600 transition hover:border-gold-400"
                  >
                    Update
                  </button>
                </form>
              </div>

              <div className="rounded-xl border border-border bg-ivory-100 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-charcoal-700">
                  {String(selected.message ?? "")}
                </p>
              </div>

              <div className="border-t border-border pt-5">
                <h3 className="font-display text-xl text-plum-600">Reply</h3>
                <div className="mt-3">
                  <ReplyForm
                    enquiryId={String(selected.id)}
                    to={String(selected.email)}
                    name={String(selected.name ?? "there")}
                    defaultSubject={`Re: ${String(selected.subject ?? "your enquiry")}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
