"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, RotateCcw } from "lucide-react";

import type { ContactDetails } from "@/lib/site/contact-shared";
import { cn } from "@/lib/utils";

/* ── The stationery palette ─────────────────────────────────────────────
   The same five colours as the printed stationery and the email shell, so a
   design copied from here matches every email the practice already sends. */
const PLUM = "#710b49";
const PLUM_DEEP = "#65063f";
const ROSE = "#b82d68";
const AMBER = "#d77a32";
const SAFFRON = "#d5a01c";
const OLIVE = "#777a35";
const CREAM = "#fff8f2";
const CREAM_SOFT = "#fffaf7";
const RULE = "#8b5273";
const HAIRLINE = "#eadfd6";
const WHITE = "#ffffff";
const INK = "#202a3b";
const DEEP = "#171923";
const MUTED = "#6b5f66";

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";
const RULE_COLOURS = [PLUM_DEEP, ROSE, AMBER, SAFFRON, OLIVE];

const ROLE_LINES =
  "CUSTOMER EXPERIENCE &amp; CLIENT SUCCESS LEADER<br>COACH&nbsp;&nbsp;|&nbsp;&nbsp;FACILITATOR&nbsp;&nbsp;|&nbsp;&nbsp;PURPOSE-DRIVEN";

const OUTLOOK = "More Confidence. Greater Impact. Brighter Futures.";

const DEFAULTS = {
  subject: "A note from Adesua",
  greeting: "Good morning,",
  body: "Thank you for writing — I have read your note and I am glad you reached out.\n\nI will come back to you properly within one working day. If anything is urgent in the meantime, simply reply to this email and it will reach me directly.",
  signoff: "Best regards,\nAdesua",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function paragraphs(value: string): string {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.8;color:${INK};">${block.replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function sentences(value: string): string {
  return (value.match(/[^.]+\.?/g) ?? [value])
    .map((part) => part.trim())
    .filter(Boolean)
    .join("<br>");
}

function contactLine(contact: ContactDetails): string {
  const dot = `<span style="color:${RULE};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`;
  const parts = [
    `✉&nbsp; <a href="mailto:${escapeHtml(contact.email)}" style="color:${INK};text-decoration:none;">${escapeHtml(contact.email)}</a>`,
    `<b style="color:${PLUM};">in</b>&nbsp; <a href="${escapeHtml(contact.linkedin)}" style="color:${INK};text-decoration:none;">LinkedIn</a>`,
    `📍&nbsp; ${escapeHtml(contact.location)}`,
    `<b style="color:${PLUM};">❤️</b>&nbsp; Lead with Care.`,
  ];
  return `<div style="font-family:${SANS};font-size:11px;line-height:1.95;color:${INK};">${parts.join(dot)}</div>`;
}

interface StationeryInput {
  subject: string;
  greeting: string;
  body: string;
  signoff: string;
  contact: ContactDetails;
  assetBase: string;
}

/**
 * The stationery as a paste-ready email: tables and inline styles only, no
 * external CSS, so Gmail, Outlook and Apple Mail all render the same card.
 */
export function buildStationery({
  subject,
  greeting,
  body,
  signoff,
  contact,
  assetBase,
}: StationeryInput): string {
  const portrait = `${assetBase}/brand/icon.png`;
  const signoffHtml = escapeHtml(signoff).replace(/\n/g, "<br />");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${CREAM};">
<!-- Subject: ${escapeHtml(subject)} -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${CREAM};">
<tr><td align="center" style="padding:24px 12px;">

<table role="presentation" width="700" cellpadding="0" cellspacing="0" border="0" style="width:700px;max-width:700px;background:${WHITE};border:1px solid ${HAIRLINE};">

<!-- ── Header: portrait, wordmark, monogram ─────────────────────── -->
<tr><td style="padding:0;background:${CREAM_SOFT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;background:${CREAM_SOFT};">
<tr>
<td width="24%" valign="bottom" style="width:24%;padding:18px 0 10px 20px;vertical-align:bottom;">
<img src="${portrait}" width="120" alt="Adesua Oriaifo" style="display:block;width:120px;max-width:120px;height:auto;border:0;" />
</td>
<td width="76%" valign="middle" style="width:76%;padding:22px 24px 18px;vertical-align:middle;">
<div style="font-family:${SERIF};font-style:italic;font-size:30px;line-height:1.1;color:${PLUM};">Adesua Oriaifo</div>
<div style="margin-top:9px;font-family:${SANS};font-size:9px;line-height:1.9;letter-spacing:1.1px;color:${DEEP};font-weight:bold;">${ROLE_LINES}</div>
<div style="margin-top:10px;font-family:${SANS};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${RULE};">Better People&nbsp; | &nbsp;Better Experiences&nbsp; | &nbsp;A Brighter Future</div>
</td>
</tr>
<tr><td colspan="2" height="3" style="height:3px;padding:0;font-size:0;line-height:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;height:3px;border-collapse:collapse;"><tr>
${RULE_COLOURS.map((colour) => `<td width="20%" height="3" style="width:20%;height:3px;background:${colour};background-color:${colour};font-size:0;line-height:0;">&nbsp;</td>`).join("")}
</tr></table>
</td></tr>
</table>
</td></tr>

<!-- ── Message, beside the purpose panel ────────────────────────── -->
<tr><td style="padding:0;background:${WHITE};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;background:${WHITE};">
<tr>
<td width="80%" valign="top" style="width:80%;padding:28px 26px 32px;vertical-align:top;font-family:${SANS};font-size:16px;line-height:1.8;color:${INK};">
<p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.8;color:${INK};">${escapeHtml(greeting)}</p>
${paragraphs(body)}
<p style="margin:22px 0 0;font-family:${SANS};font-size:16px;line-height:1.8;color:${INK};">${signoffHtml}</p>
</td>
<td width="20%" valign="middle" align="center" bgcolor="${CREAM_SOFT}" style="width:20%;padding:22px 10px;vertical-align:middle;text-align:center;background-color:${CREAM_SOFT};">
<div style="font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.4;color:${PLUM};">Purpose<br>drives<br>everything.<br><span style="font-style:normal;">♡</span></div>
</td>
</tr>
</table>
</td></tr>

<!-- ── Footer band ──────────────────────────────────────────────── -->
<tr><td style="padding:0;background:${CREAM_SOFT};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;background:${CREAM_SOFT};">
<tr>
<td width="58%" valign="middle" style="width:58%;padding:22px 14px 16px 24px;vertical-align:middle;">
<div style="font-family:${SERIF};font-style:italic;font-size:26px;line-height:1.12;color:${PLUM};">Adesua Oriaifo</div>
<div style="margin-top:9px;font-family:${SANS};font-size:9px;line-height:1.9;letter-spacing:1.1px;color:${DEEP};font-weight:bold;">${ROLE_LINES}</div>
</td>
<td width="42%" valign="middle" align="center" style="width:42%;padding:16px 20px;border-left:1px solid ${RULE};vertical-align:middle;text-align:center;">
<div style="font-family:${SERIF};font-style:italic;font-size:15px;line-height:1.45;color:${PLUM};">${sentences(OUTLOOK)}</div>
</td>
</tr>
<tr>
<td colspan="2" style="padding:0 24px 20px;">
<div style="padding-top:14px;border-top:1px solid ${RULE};">
${contactLine(contact)}
</div>
</td>
</tr>
</table>
</td></tr>

<tr><td height="3" style="height:3px;padding:0;font-size:0;line-height:0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;height:3px;border-collapse:collapse;"><tr>
${RULE_COLOURS.map((colour) => `<td width="20%" height="3" style="width:20%;height:3px;background:${colour};background-color:${colour};font-size:0;line-height:0;">&nbsp;</td>`).join("")}
</tr></table>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

const fieldClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

export function EmailStationeryDesigner({
  contact,
  assetBase,
}: {
  contact: ContactDetails;
  assetBase: string;
}) {
  const [subject, setSubject] = useState(DEFAULTS.subject);
  const [greeting, setGreeting] = useState(DEFAULTS.greeting);
  const [body, setBody] = useState(DEFAULTS.body);
  const [signoff, setSignoff] = useState(DEFAULTS.signoff);
  const [copied, setCopied] = useState(false);

  const html = useMemo(
    () => buildStationery({ subject, greeting, body, signoff, contact, assetBase }),
    [subject, greeting, body, signoff, contact, assetBase],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${subject.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "adesua-email"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setSubject(DEFAULTS.subject);
    setGreeting(DEFAULTS.greeting);
    setBody(DEFAULTS.body);
    setSignoff(DEFAULTS.signoff);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      {/* ── The writing side ── */}
      <div className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div>
          <label htmlFor="stationery-subject" className="text-sm font-semibold text-plum-600">
            Subject
          </label>
          <input
            id="stationery-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className={fieldClass}
            placeholder="A note from Adesua"
          />
        </div>

        <div>
          <label htmlFor="stationery-greeting" className="text-sm font-semibold text-plum-600">
            Greeting
          </label>
          <input
            id="stationery-greeting"
            value={greeting}
            onChange={(event) => setGreeting(event.target.value)}
            className={fieldClass}
            placeholder="Good morning,"
          />
        </div>

        <div>
          <label htmlFor="stationery-body" className="text-sm font-semibold text-plum-600">
            Message
          </label>
          <textarea
            id="stationery-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={10}
            className={cn(fieldClass, "resize-y leading-relaxed")}
            placeholder="Write the message. A blank line starts a new paragraph."
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            A blank line starts a new paragraph. Everything is escaped, so nothing you type can
            break the design.
          </p>
        </div>

        <div>
          <label htmlFor="stationery-signoff" className="text-sm font-semibold text-plum-600">
            Sign-off
          </label>
          <textarea
            id="stationery-signoff"
            value={signoff}
            onChange={(event) => setSignoff(event.target.value)}
            rows={2}
            className={cn(fieldClass, "resize-y")}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-plum-600"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copied" : "Copy email design"}
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-plum-600 transition hover:border-gold-300"
          >
            <Download className="size-4" aria-hidden />
            Download .html
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:text-plum-600"
          >
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </button>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Paste the copied design into the body of a new email in Gmail, Outlook or Apple Mail.
          The portrait and colours load from the live site, so the card looks the same in her
          inbox as it does here.
        </p>
      </div>

      {/* ── The design, live ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-ivory-100 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold-700">
            Live preview
          </p>
          <p className="truncate text-xs text-muted-foreground">{subject || "Untitled"}</p>
        </div>
        <iframe
          title="Email stationery preview"
          srcDoc={html}
          className="h-[46rem] w-full bg-white"
          sandbox=""
        />
      </div>
    </div>
  );
}
