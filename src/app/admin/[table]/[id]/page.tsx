import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Bot, Lock, MessageCircle, Send, StickyNote } from "lucide-react";
import { RecordForm } from "@/components/admin/record-form";
import { ReplyForm } from "@/components/admin/reply-form";
import { tableDefBySlug } from "@/lib/admin/schema";
import { getRow } from "@/lib/admin/data";
import { deriveFields, mergeDeclaredFields } from "@/lib/admin/derive";
import { formatCell, formatDateTime } from "@/lib/admin/format";
import { deleteRecord, updateRecord } from "@/lib/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cn } from "@/lib/utils";

interface ThreadEntry {
  id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
}

interface ChatTurn {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface LinkedConversation {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  started_at: string;
  turns: ChatTurn[];
}

/** Replies that went to the visitor, and notes kept inside the studio. */
async function loadThread(enquiryId: string): Promise<ThreadEntry[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enquiry_notes")
      .select("id, body, is_internal, created_at")
      .eq("enquiry_id", enquiryId)
      .order("created_at", { ascending: false })
      .limit(50);

    return (data ?? []) as ThreadEntry[];
  } catch {
    return [];
  }
}

/**
 * The Zee chat that produced this enquiry, with its transcript.
 *
 * `chatbot_conversations.enquiry_id` is set by the assistant once a visitor
 * gives a name and an email, so this is where the conversation that captured
 * those details can be read back from the admin.
 */
async function loadConversation(enquiryId: string): Promise<LinkedConversation | null> {
  try {
    const supabase = createAdminClient();
    const { data: conversation } = await supabase
      .from("chatbot_conversations")
      .select("id, name, email, status, started_at")
      .eq("enquiry_id", enquiryId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) return null;

    const { data: messages } = await supabase
      .from("chatbot_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(200);

    return {
      id: conversation.id,
      name: conversation.name,
      email: conversation.email,
      status: conversation.status,
      started_at: conversation.started_at,
      turns: (messages ?? []) as ChatTurn[],
    };
  } catch {
    return null;
  }
}

export const instant = false;

interface PageProps {
  params: Promise<{ table: string; id: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function EditRecordPage({ params, searchParams }: PageProps) {
  await connection();

  const { table, id } = await params;
  const { error: actionError } = await searchParams;

  const def = tableDefBySlug.get(table);
  if (!def) notFound();

  const session = await requireAdmin("editor");
  const { row, error } = await getRow(def, id);

  if (!row) notFound();

  const listPath = `/admin/${def.table}`;

  /**
   * The registry's declared fields carry the things a live row cannot tell us:
   * the choices behind `status`, `category` and `pathway`, the read-only flags
   * that keep ids and hashes out of the editor, and the order a person reads
   * the form in. Anything the row has that the registry forgot is appended, so
   * a new column still shows up instead of vanishing.
   */
  const fields = def.fields ? mergeDeclaredFields(def.fields, row) : deriveFields(row);

  const canWrite = roleAtLeast(session.profile.role, def.writeRole ?? "editor");
  const canDelete = roleAtLeast(session.profile.role, "administrator");
  const title = formatCell(row[def.primary]);

  const isEnquiry = def.table === "enquiries";
  const thread = isEnquiry ? await loadThread(id) : [];
  const conversation = isEnquiry ? await loadConversation(id) : null;

  const notice =
    actionError ? (
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        {actionError}
      </p>
    ) : error ? (
      <p
        role="alert"
        className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
      >
        {error}
      </p>
    ) : null;

  if (!canWrite) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-gold-700">
            {def.label}
          </p>
          <h1 className="mt-1 font-display text-3xl font-medium text-plum-600">{title}</h1>
        </div>

        {notice}

        <p className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4 shrink-0" aria-hidden />
          Your role can read {def.plural.toLowerCase()} but not change them.
        </p>

        <FieldSummary fields={fields} row={row} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notice}

      <RecordForm
        action={updateRecord.bind(null, def.table, id, fields, listPath)}
        deleteAction={canDelete ? deleteRecord.bind(null, def.table, id, listPath) : undefined}
        fields={fields}
        initial={row}
        title={title === "—" ? `${def.label} ${id.slice(0, 8)}` : title}
        listPath={listPath}
        isNew={false}
      />

      {isEnquiry && (
        <>
          <ReplySection
            enquiryId={id}
            to={String(row.email ?? "")}
            name={String(row.name ?? "")}
            defaultSubject={defaultReplySubject(row)}
          />
          <ConversationPanel conversation={conversation} />
          <ThreadPanel thread={thread} />
        </>
      )}
    </div>
  );
}

function defaultReplySubject(row: Record<string, unknown>): string {
  const subject = String(row.subject ?? "").trim();
  if (subject) return /^re:/i.test(subject) ? subject : `Re: ${subject}`;
  const name = String(row.name ?? "").trim().split(" ")[0];
  return name ? `Re: your message, ${name}` : "Re: your message";
}

function FieldSummary({
  fields,
  row,
}: {
  fields: ReturnType<typeof deriveFields>;
  row: Record<string, unknown>;
}) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
      {fields.map((field) => (
        <div
          key={field.name}
          className={cn("bg-card px-5 py-4", field.span === 2 && "sm:col-span-2")}
        >
          <dt className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {field.label}
          </dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-charcoal-700">
            {field.type === "datetime"
              ? formatDateTime(row[field.name])
              : field.type === "json"
                ? JSON.stringify(row[field.name], null, 2)
                : formatCell(row[field.name])}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function SectionShell({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-start gap-3 border-b border-border px-6 py-4">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-gold-500/12 text-gold-700">
          <Icon className="size-4" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-lg font-medium text-plum-600">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function ReplySection({
  enquiryId,
  to,
  name,
  defaultSubject,
}: {
  enquiryId: string;
  to: string;
  name: string;
  defaultSubject: string;
}) {
  if (!to) {
    return (
      <SectionShell icon={Send} title="Reply" description="No address to reply to.">
        <p className="text-sm text-muted-foreground">
          This enquiry has no email address, so a reply cannot be sent. Add one
          above and save, then reply.
        </p>
      </SectionShell>
    );
  }

  return (
    <SectionShell
      icon={Send}
      title="Reply"
      description={`Sends from the studio mailbox to ${to} and records the message on this enquiry.`}
    >
      <ReplyForm
        enquiryId={enquiryId}
        to={to}
        name={name}
        defaultSubject={defaultSubject}
      />
    </SectionShell>
  );
}

function ThreadPanel({ thread }: { thread: ThreadEntry[] }) {
  return (
    <SectionShell
      icon={MessageCircle}
      title="Conversation history"
      description="Replies sent to the visitor, and notes kept inside the studio."
    >
      {thread.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing yet. The first reply you send from the composer above appears
          here.
        </p>
      ) : (
        <ol className="space-y-4">
          {thread.map((entry) => (
            <li
              key={entry.id}
              className={cn(
                "rounded-xl border px-4 py-3",
                entry.is_internal
                  ? "border-dashed border-border bg-ivory-100"
                  : "border-gold-300/60 bg-gold-500/5",
              )}
            >
              <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em]">
                {entry.is_internal ? (
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <StickyNote className="size-3" aria-hidden />
                    Internal note
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-gold-800">
                    <Send className="size-3" aria-hidden />
                    Sent to visitor
                  </span>
                )}
                <span className="font-normal normal-case tracking-normal text-muted-foreground">
                  {formatDateTime(entry.created_at)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-charcoal-700">
                {entry.body}
              </p>
            </li>
          ))}
        </ol>
      )}
    </SectionShell>
  );
}

function ConversationPanel({ conversation }: { conversation: LinkedConversation | null }) {
  if (!conversation) return null;

  return (
    <SectionShell
      icon={Bot}
      title="Zee conversation"
      description="The chat that captured this visitor's name and email."
    >
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-ivory-100 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          Captured name:{" "}
          <span className="font-medium text-charcoal-700">
            {conversation.name ?? "not given"}
          </span>
        </span>
        <span className="text-muted-foreground">
          Captured email:{" "}
          <span className="font-medium text-charcoal-700">
            {conversation.email ?? "not given"}
          </span>
        </span>
        <span className="text-muted-foreground">
          Started {formatDateTime(conversation.started_at)}
        </span>
      </div>

      <ol className="space-y-3">
        {conversation.turns.map((turn) => (
          <li
            key={turn.id}
            className={cn(
              "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              turn.role === "user"
                ? "ml-auto bg-plum-500 text-ivory-200"
                : "bg-ivory-200 text-charcoal-700",
            )}
          >
            <p className="whitespace-pre-wrap">{turn.content}</p>
          </li>
        ))}
      </ol>

      <Link
        href={`/admin/chatbot_conversations/${conversation.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gold-700 hover:text-gold-600"
      >
        Open the conversation
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </SectionShell>
  );
}
