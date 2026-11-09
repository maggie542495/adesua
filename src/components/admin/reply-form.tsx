"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Loader2, Send, Sparkles } from "lucide-react";
import {
  draftEnquiryReply,
  replyToEnquiry,
  type StudioState,
} from "@/lib/admin/studio-actions";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
      {pending ? "Sending…" : "Send reply"}
    </button>
  );
}

export function ReplyForm({
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
  const [state, formAction] = useActionState<StudioState, FormData>(replyToEnquiry, {
    status: "idle",
  });
  const [body, setBody] = useState("");
  const [drafting, startDraft] = useTransition();
  const [draftError, setDraftError] = useState<string | null>(null);

  function handleDraft() {
    setDraftError(null);
    startDraft(async () => {
      const result = await draftEnquiryReply(enquiryId);
      if (result.ok && result.body) setBody(result.body);
      else setDraftError(result.message ?? "Zee could not draft a reply just now.");
    });
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="name" value={name} />

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
        <label htmlFor="reply-subject" className="block text-sm font-medium text-foreground">
          Subject
        </label>
        <input
          id="reply-subject"
          name="subject"
          defaultValue={defaultSubject}
          className={inputClass}
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="reply-body" className="block text-sm font-medium text-foreground">
            Reply
          </label>
          <button
            type="button"
            onClick={handleDraft}
            disabled={drafting}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/60 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-gold-700 transition hover:border-gold-500 hover:bg-gold-500/10 disabled:opacity-60"
          >
            {drafting ? (
              <Loader2 className="size-3 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-3" aria-hidden />
            )}
            {drafting ? "Drafting…" : "Draft with Zee"}
          </button>
        </div>
        <textarea
          id="reply-body"
          name="body"
          rows={9}
          required
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={`Dear ${name.split(" ")[0] || "there"},\n\n`}
          className={inputClass}
        />
        {draftError && (
          <p role="alert" className="mt-1 text-xs text-destructive">
            {draftError}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Sent in the branded email shell, signed by Adesua. Blank lines become paragraphs.
          Zee drafts in her voice — read it before you send.
        </p>
      </div>

      <SendButton />
    </form>
  );
}
