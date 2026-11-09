import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { siteConfig } from "@/config/site";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  button,
  detailRows,
  escapeHtml,
  paragraphs,
  renderEmail,
} from "@/lib/email/template";

let cached: Transporter | null = null;

const fromAddress = () =>
  process.env.ZOHO_MAIL_FROM || process.env.ZOHO_SMTP_USER || siteConfig.links.email;
const fromName = () => process.env.ZOHO_MAIL_FROM_NAME || siteConfig.name;
const ownerAddress = () => process.env.ZOHO_MAIL_REPLY_TO || siteConfig.links.email;

/**
 * Zoho (and most providers) refuse to relay as an address the authenticated
 * mailbox does not own. This is the single most common cause of
 * "550 Sender is not allowed to relay emails" — the login succeeds, the
 * connection verifies, and only the send fails.
 */
export function mailFromMismatch(): string | null {
  const user = process.env.ZOHO_SMTP_USER;
  const from = process.env.ZOHO_MAIL_FROM;
  if (!user || !from) return null;

  const userDomain = user.split("@")[1]?.toLowerCase();
  const fromDomain = from.split("@")[1]?.toLowerCase();
  if (!userDomain || !fromDomain || userDomain === fromDomain) return null;

  return `ZOHO_MAIL_FROM is ${from}, but the SMTP account authenticates as ${user}. Zoho will not relay mail as an address it does not own, so every send is refused with "550 Sender is not allowed to relay emails". Either set ZOHO_MAIL_FROM to ${user} (or another address on ${userDomain}), or add ${from} as a verified alias in Zoho Mail → Settings → Mail accounts.`;
}

export function isMailConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_SMTP_HOST &&
      process.env.ZOHO_SMTP_USER &&
      process.env.ZOHO_SMTP_PASSWORD,
  );
}

function getTransporter(): Transporter | null {
  if (!isMailConfigured()) return null;
  if (cached) return cached;

  cached = nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST,
    port: Number(process.env.ZOHO_SMTP_PORT ?? 465),
    secure: process.env.ZOHO_SMTP_SECURE !== "false",
    auth: {
      user: process.env.ZOHO_SMTP_USER as string,
      pass: process.env.ZOHO_SMTP_PASSWORD as string,
    },
  });

  return cached;
}

export interface MailResult {
  sent: boolean;
  reason?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
  /** Logged to email_send_log so the studio can show what was delivered. */
  meta?: { kind: string; resourceId?: string | null };
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  replyTo,
  meta,
}: SendMailInput): Promise<MailResult> {
  const transporter = getTransporter();

  if (!transporter) {
    await logSend({ to, subject, status: "skipped", error: "SMTP not configured", meta });
    return { sent: false, reason: "Email delivery is not configured yet." };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName()}" <${fromAddress()}>`,
      to,
      replyTo: replyTo ?? ownerAddress(),
      subject,
      text,
      html,
    });
    await logSend({
      to,
      subject,
      status: "sent",
      providerId: info.messageId,
      meta,
    });
    return { sent: true };
  } catch (error) {
    const detail = describeMailError(error);
    console.error("[mail] send failed:", detail, error);
    await logSend({
      to,
      subject,
      status: "failed",
      error: detail,
      meta,
    });
    return { sent: false, reason: detail };
  }
}

/**
 * Turns a nodemailer failure into something an admin can act on.
 *
 * The generic "could not be sent" message hid the one fact that matters —
 * whether the credentials were rejected, the host was unreachable, or the
 * message itself was refused — so the studio could not tell a wrong password
 * from a network blip.
 */
export function describeMailError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  const response = (error as { response?: string } | null)?.response;
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");

  // The 550 relay refusal is a configuration problem, not a network one, and
  // the raw text never says which setting is wrong.
  if (/not allowed to relay/i.test(response ?? message)) {
    return `The server refused the sender (${response ?? message}). ${
      mailFromMismatch() ??
      "ZOHO_MAIL_FROM must be an address the SMTP account is allowed to send as."
    }`;
  }

  switch (code) {
    case "EAUTH":
      return `SMTP rejected the login (${response ?? message}). Check ZOHO_SMTP_USER and ZOHO_SMTP_PASSWORD — the user must be a mailbox on the same Zoho host, and an app-specific password is required when 2FA is on.`;
    case "ECONNECTION":
    case "ESOCKET":
    case "ETIMEDOUT":
      return `Could not reach the SMTP server (${message}). Check ZOHO_SMTP_HOST, ZOHO_SMTP_PORT and ZOHO_SMTP_SECURE, and that outbound port ${process.env.ZOHO_SMTP_PORT ?? "465"} is open.`;
    case "EENVELOPE":
      return `The server refused the sender or recipient (${response ?? message}). Check ZOHO_MAIL_FROM — it must be an address the account is allowed to send as.`;
    case "EDNS":
      return `The SMTP host could not be resolved (${message}). Check ZOHO_SMTP_HOST.`;
    default:
      return response ? `${message} — ${response}` : message;
  }
}

export interface MailDiagnosis {
  configured: boolean;
  ok: boolean;
  /** What to show the admin: the real reason, not a generic apology. */
  message: string;
  /** A configuration problem that will not stop the connection but will stop a send. */
  warning?: string | null;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  from?: string;
}

/**
 * Opens a real connection and authenticates, without sending anything.
 * This is what the Email Studio's delivery check reports, so a broken
 * credential is named rather than guessed at.
 */
export async function verifyMailConnection(): Promise<MailDiagnosis> {
  const host = process.env.ZOHO_SMTP_HOST;
  const port = Number(process.env.ZOHO_SMTP_PORT ?? 465);
  const secure = process.env.ZOHO_SMTP_SECURE !== "false";
  const user = process.env.ZOHO_SMTP_USER;
  const from = fromAddress();

  if (!isMailConfigured()) {
    return {
      configured: false,
      ok: false,
      message:
        "SMTP is not configured. Set ZOHO_SMTP_HOST, ZOHO_SMTP_USER and ZOHO_SMTP_PASSWORD, then restart the server.",
      host,
      port,
      secure,
      user,
      from,
    };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return {
      configured: false,
      ok: false,
      message: "The mail transport could not be created.",
      host,
      port,
      secure,
      user,
      from,
    };
  }

  try {
    await transporter.verify();
    const warning = mailFromMismatch();
    return {
      configured: true,
      ok: true,
      message: warning
        ? `Connected to ${host}:${port} and authenticated as ${user} — but sends will be refused.`
        : `Connected to ${host}:${port} and authenticated as ${user}.`,
      warning,
      host,
      port,
      secure,
      user,
      from,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: `${describeMailError(error)}${mismatchHint(host, user)}`,
      host,
      port,
      secure,
      user,
      from,
    };
  }
}

/**
 * Catches the mistake that is easy to make and hard to see: pointing at one
 * provider's SMTP server while authenticating with another provider's
 * mailbox. Zoho will never accept a gmail.com login, and the 535 it returns
 * says nothing about why.
 */
function mismatchHint(host: string | undefined, user: string | undefined): string {
  if (!host || !user) return "";

  const domain = user.split("@")[1]?.toLowerCase() ?? "";
  const consumer: Record<string, string> = {
    "gmail.com": "smtp.gmail.com",
    "googlemail.com": "smtp.gmail.com",
    "outlook.com": "smtp-mail.outlook.com",
    "hotmail.com": "smtp-mail.outlook.com",
    "live.com": "smtp-mail.outlook.com",
    "yahoo.com": "smtp.mail.yahoo.com",
  };

  const expected = consumer[domain];
  if (!expected) return "";

  const hostMatches = host.toLowerCase().includes(expected.split(".")[1] ?? "");
  if (hostMatches) return "";

  return ` This looks like a provider mismatch: ${user} is a ${domain} mailbox, but ZOHO_SMTP_HOST is ${host}. Either point the host at ${expected} (with a Google/Microsoft app password), or use a mailbox that actually lives on ${host}.`;
}

async function logSend(input: {
  to: string;
  subject: string;
  status: string;
  providerId?: string;
  error?: string;
  meta?: { kind: string; resourceId?: string | null };
}) {
  try {
    const supabase = createAdminClient();
    await supabase.from("email_send_log").insert({
      status: input.status,
      subject: input.subject,
      message_id: input.providerId ?? null,
      error: input.error ?? null,
      enquiry_id: input.meta?.resourceId ?? null,
      envelope: {
        to: input.to,
        kind: input.meta?.kind ?? "transactional",
      },
    });
  } catch {
    // Logging must never break delivery.
  }
}

/* ── Enquiry to the owner ───────────────────────────────────────────── */

export interface EnquiryPayload {
  name: string;
  email: string;
  phone?: string | null;
  category: string;
  subject?: string | null;
  message: string;
  pathway?: string | null;
  source?: string;
}

export async function sendEnquiryEmail(enquiry: EnquiryPayload): Promise<MailResult> {
  const body = `
    ${detailRows([
      ["Name", enquiry.name],
      ["Email", enquiry.email],
      ["Phone", enquiry.phone || "—"],
      ["Enquiry type", enquiry.category],
      ["Pathway", enquiry.pathway || "—"],
      ["Came via", enquiry.source || "contact-form"],
    ])}
    <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#710b49;">Message</p>
    ${paragraphs(enquiry.message)}
    ${button(`${siteConfig.url.replace(/\/$/, "")}/admin/enquiries`, "Open in the studio")}
  `;

  return sendMail({
    to: ownerAddress(),
    replyTo: `"${enquiry.name}" <${enquiry.email}>`,
    subject: enquiry.subject?.trim()
      ? `Enquiry — ${enquiry.subject.trim()}`
      : `New ${enquiry.category} enquiry from ${enquiry.name}`,
    text: [
      `Name: ${enquiry.name}`,
      `Email: ${enquiry.email}`,
      enquiry.phone ? `Phone: ${enquiry.phone}` : null,
      `Enquiry type: ${enquiry.category}`,
      enquiry.pathway ? `Pathway: ${enquiry.pathway}` : null,
      enquiry.source ? `Came via: ${enquiry.source}` : null,
      "",
      enquiry.message,
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderEmail({
      preheader: "New enquiry",
      title: `${enquiry.name} would like to talk`,
      body,
      footnote: `Reply directly to this email to answer ${escapeHtml(
        enquiry.name.split(" ")[0] || "them",
      )}.`,
    }),
    meta: { kind: "enquiry" },
  });
}

/* ── Acknowledgement to the visitor ─────────────────────────────────── */

export async function sendAutoReply(input: {
  name: string;
  email: string;
  message: string;
  reply?: string;
  outsideHours?: boolean;
}): Promise<MailResult> {
  const firstName = input.name.split(" ")[0] || "there";
  const message =
    input.reply ??
    "Thank you for writing — your message has reached me safely. I read every note personally and will come back to you within one working day.";
  const body = `
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
      Dear ${escapeHtml(firstName)},
    </p>
    ${paragraphs(message)}
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
      If anything is urgent, you can reach me on ${escapeHtml(siteConfig.phone)}.
    </p>
    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">Warmly,<br />Adesua</p>
    ${button(`${siteConfig.url.replace(/\/$/, "")}/work-with-me`, "Explore the pathways")}
  `;

  return sendMail({
    to: input.email,
    subject: "Thank you for reaching out",
    text: `Dear ${firstName},\n\n${message}\n\nWarmly,\nAdesua`,
    html: renderEmail({
      preheader: input.outsideHours ? "Out of hours — noted" : "Message received",
      title: "Your note reached the studio",
      body,
      footnote: `You are receiving this because you wrote to ${siteConfig.name}${
        input.outsideHours ? " outside working hours" : ""
      }. Reply to this email and it comes straight to Adesua.`,
    }),
    replyTo: ownerAddress(),
    meta: { kind: "auto-reply" },
  });
}

/* ── Owner reply from the Email Studio ─────────────────────────────── */

export async function sendVisitorReply(input: {
  to: string;
  name: string;
  subject: string;
  body: string;
}): Promise<MailResult> {
  const html = renderEmail({
    preheader: "A reply from Adesua",
    title: input.subject,
    body: `${paragraphs(input.body)}
      <p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#202a3b;">Warmly,<br />Adesua</p>`,
    footnote: "Reply to this email and it comes straight back to Adesua.",
  });

  return sendMail({
    to: input.to,
    subject: input.subject,
    text: input.body,
    html,
    replyTo: ownerAddress(),
    meta: { kind: "reply" },
  });
}

/* ── Notifications to the owner ────────────────────────────────────── */

/**
 * Records an in-dashboard notification and (when SMTP is live) emails it.
 * Used by admin writes, Zee and the public forms.
 */
export async function sendOwnerAlert(input: {
  title: string;
  body: string;
  link?: string;
  /** Skip the email but still record the dashboard notification. */
  quiet?: boolean;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { data: owners } = await supabase
      .from("admin_profiles")
      .select("id, email, full_name")
      .in("role", ["owner", "administrator"])
      .eq("status", "active");

    if (!owners?.length) return;

    await supabase.from("notifications").insert(
      owners.map((owner) => ({
        recipient_id: owner.id,
        title: input.title,
        body: input.body,
        kind: "activity" as const,
        link: input.link ?? null,
      })),
    );

    if (input.quiet) return;

    const link = input.link
      ? `${siteConfig.url.replace(/\/$/, "")}${input.link}`
      : `${siteConfig.url.replace(/\/$/, "")}/admin`;

    await sendMail({
      to: owners.map((owner) => owner.email).join(","),
      subject: input.title,
      text: `${input.body}\n\n${link}`,
      html: renderEmail({
        preheader: "Studio notification",
        title: input.title,
        body: `${paragraphs(input.body)}${button(link, "Open the studio")}`,
        footnote: "You are receiving this because you run this website.",
      }),
      meta: { kind: "notification" },
    });
  } catch (error) {
    console.error("[notify] owner alert failed", error);
  }
}

/* ── Invitations ───────────────────────────────────────────────────── */

export async function sendInvitationEmail(input: {
  email: string;
  role: string;
  acceptUrl: string;
  expiresAt: string;
  invitedBy?: string | null;
}): Promise<MailResult> {
  const body = `
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
      ${input.invitedBy ? `${escapeHtml(input.invitedBy)} has invited you` : "You have been invited"} to help run
      <strong>${escapeHtml(siteConfig.name)}</strong>'s website as
      <strong>${escapeHtml(input.role)}</strong>.
    </p>
    ${detailRows([
      ["Invited email", input.email],
      ["Access level", input.role],
      ["Expires", input.expiresAt],
    ])}
    ${button(input.acceptUrl, "Accept the invitation")}
    <p style="margin:16px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:#6b5f66;">
      The link can only be used once and expires on ${escapeHtml(input.expiresAt)}.
      If it lapses, ask for a fresh invitation.
    </p>
  `;

  return sendMail({
    to: input.email,
    subject: `You have been invited to the ${siteConfig.name} studio`,
    text: [
      input.invitedBy
        ? `${input.invitedBy} has invited you to help run ${siteConfig.name}'s website.`
        : `You have been invited to help run ${siteConfig.name}'s website.`,
      `Access level: ${input.role}`,
      `Accept here: ${input.acceptUrl}`,
      `This link expires on ${input.expiresAt}.`,
    ].join("\n"),
    html: renderEmail({
      preheader: "Studio invitation",
      title: "An invitation to the studio",
      body,
      footnote: "If you were not expecting this, you can safely ignore it.",
    }),
    meta: { kind: "invitation" },
  });
}

/* ── Account lifecycle ─────────────────────────────────────────────── */

/**
 * Sent the moment an account is created — the owner bootstrap and every
 * accepted invitation. It is the first thing a new admin sees, so it carries
 * the sign-in link, the access level and what to do next.
 */
export async function sendWelcomeEmail(input: {
  name: string;
  email: string;
  role: string;
  signInUrl: string;
  /** True for the one-time owner bootstrap. */
  isOwner?: boolean;
}): Promise<MailResult> {
  const firstName = input.name.split(" ")[0] || "there";
  const body = `
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
      Dear ${escapeHtml(firstName)},
    </p>
    <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
      ${
        input.isOwner
          ? "Your owner account is ready. You now have full control of the website — content, enquiries, email and settings."
          : "Your studio account is ready. You can sign in and start working on the site straight away."
      }
    </p>
    ${detailRows([
      ["Account", input.email],
      ["Access level", input.role],
      ["Signed in from", siteConfig.url.replace(/^https?:\/\//, "")],
    ])}
    ${button(input.signInUrl, "Sign in to the studio")}
    <p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.75;color:#6b5f66;">
      Keep this email private — it names the account that can change the site.
      If you did not create this account, reply to this message immediately.
    </p>
  `;

  return sendMail({
    to: input.email,
    subject: input.isOwner
      ? `Your ${siteConfig.name} owner account is ready`
      : `Your ${siteConfig.name} studio account is ready`,
    text: [
      `Dear ${firstName},`,
      "",
      input.isOwner
        ? "Your owner account is ready. You now have full control of the website."
        : "Your studio account is ready. You can sign in and start working on the site straight away.",
      "",
      `Account: ${input.email}`,
      `Access level: ${input.role}`,
      `Sign in: ${input.signInUrl}`,
      "",
      "If you did not create this account, reply to this message immediately.",
    ].join("\n"),
    html: renderEmail({
      preheader: "Your account is ready",
      title: input.isOwner ? "The studio is yours" : "Welcome to the studio",
      body,
      footnote: "You are receiving this because an account was created with this address.",
    }),
    meta: { kind: "welcome" },
  });
}

/** Tells the owner that an invitation was accepted, so access changes are visible. */
export async function sendInvitationAcceptedEmail(input: {
  name: string;
  email: string;
  role: string;
}): Promise<MailResult> {
  return sendMail({
    to: ownerAddress(),
    subject: `${input.name} accepted an invitation`,
    text: `${input.name} (${input.email}) accepted an invitation as ${input.role}.`,
    html: renderEmail({
      preheader: "New team member",
      title: "An invitation was accepted",
      body: `${detailRows([
        ["Name", input.name],
        ["Email", input.email],
        ["Access level", input.role],
      ])}${button(`${siteConfig.url.replace(/\/$/, "")}/admin/admin_profiles`, "Review the team")}`,
      footnote: "You are receiving this because you run this website.",
    }),
    meta: { kind: "invitation-accepted" },
  });
}

/**
 * Security notice sent after a password change. It is the one email a
 * compromised account cannot suppress, so it always goes out — even when the
 * change was legitimate.
 */
export async function sendPasswordChangedEmail(input: {
  name: string;
  email: string;
  changedAt: string;
}): Promise<MailResult> {
  const firstName = input.name.split(" ")[0] || "there";

  return sendMail({
    to: input.email,
    subject: `Your ${siteConfig.name} password was changed`,
    text: [
      `Dear ${firstName},`,
      "",
      `The password on your ${siteConfig.name} studio account was changed on ${input.changedAt} (WAT).`,
      "",
      "If this was you, nothing further is needed.",
      "If it was not, reply to this message immediately and sign out of all devices from Admin → Security.",
    ].join("\n"),
    html: renderEmail({
      preheader: "Your password was changed",
      title: "Your password was changed",
      body: `
        <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
          Dear ${escapeHtml(firstName)},
        </p>
        <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
          The password on your ${escapeHtml(siteConfig.name)} studio account was
          changed. If this was you, nothing further is needed.
        </p>
        ${detailRows([
          ["Account", input.email],
          ["Changed", `${input.changedAt} (WAT)`],
        ])}
        <p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.75;color:#6b5f66;">
          If this was not you, reply to this message immediately and use
          <strong>Sign out everywhere</strong> on Admin → Security.
        </p>
        ${button(`${siteConfig.url.replace(/\/$/, "")}/admin/security`, "Review account security")}
      `,
      footnote: "You are receiving this because the password on this account changed.",
    }),
    meta: { kind: "password-changed" },
  });
}

/**
 * New sign-in notice. Sent to the account owner so an unexpected session is
 * visible without anyone having to go looking for it.
 */
export async function sendSignInAlertEmail(input: {
  name: string;
  email: string;
  signedInAt: string;
  userAgent?: string | null;
}): Promise<MailResult> {
  const firstName = input.name.split(" ")[0] || "there";

  return sendMail({
    to: input.email,
    subject: `New sign-in to your ${siteConfig.name} studio`,
    text: [
      `Dear ${firstName},`,
      "",
      `Your studio account was signed in to on ${input.signedInAt} (WAT).`,
      input.userAgent ? `Device: ${input.userAgent}` : null,
      "",
      "If this was you, nothing further is needed.",
      "If it was not, change your password and sign out of all devices from Admin → Security.",
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderEmail({
      preheader: "New sign-in",
      title: "A new sign-in to the studio",
      body: `
        <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
          Dear ${escapeHtml(firstName)},
        </p>
        <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
          Your studio account was just signed in to. If this was you, nothing
          further is needed.
        </p>
        ${detailRows([
          ["Account", input.email],
          ["Signed in", `${input.signedInAt} (WAT)`],
          ["Device", input.userAgent || "Not reported"],
        ])}
        <p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.75;color:#6b5f66;">
          If this was not you, change your password and use
          <strong>Sign out everywhere</strong> on Admin → Security.
        </p>
        ${button(`${siteConfig.url.replace(/\/$/, "")}/admin/security`, "Review account security")}
      `,
      footnote: "You are receiving this because someone signed in to this account.",
    }),
    meta: { kind: "sign-in-alert" },
  });
}

/** A one-click SMTP check from the Email Studio. */
export async function sendTestEmail(to: string): Promise<MailResult> {
  const sentAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date());

  return sendMail({
    to,
    subject: `Test email from the ${siteConfig.name} studio`,
    text: `This is a test message. If you can read it, SMTP is working.\n\nSent ${sentAt} (WAT).`,
    html: renderEmail({
      preheader: "SMTP check",
      title: "Your email is working",
      body: `
        <p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#202a3b;">
          This is a test message from the studio. If you can read it, delivery is
          configured correctly and every other email — enquiries, replies,
          invitations and alerts — will send the same way.
        </p>
        ${detailRows([
          ["Sent", `${sentAt} (WAT)`],
          ["From", fromAddress()],
          ["Reply-to", ownerAddress()],
        ])}
      `,
      footnote: "You can send another test at any time from Admin → Email Studio.",
    }),
    meta: { kind: "test" },
  });
}
