import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { siteConfig } from "@/config/site";

let cached: Transporter | null = null;

/** True once the Zoho SMTP credentials in `.env.local` are filled in. */
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

export interface MailResult {
  sent: boolean;
  /** Present when nothing was sent — the UI turns this into a mailto fallback. */
  reason?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Stationery matching the brand brief: deep plum header, champagne rule,
 * warm ivory body, charcoal copy.
 */
function renderEnquiryHtml(enquiry: EnquiryPayload): string {
  const rows: Array<[string, string]> = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone || "—"],
    ["Enquiry type", enquiry.category],
    ["Pathway", enquiry.pathway || "—"],
    ["Came via", enquiry.source || "contact-form"],
  ];

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f8f4ef;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f4ef;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffdfb;border:1px solid #e1d5c8;border-radius:14px;overflow:hidden;font-family:Helvetica,Arial,sans-serif;">
        <tr>
          <td style="background:#49283f;padding:28px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#d6b48f;">${escapeHtml(siteConfig.name)}</p>
            <p style="margin:8px 0 0;font-size:22px;color:#f8f4ef;font-family:Georgia,serif;">New enquiry</p>
          </td>
        </tr>
        <tr><td style="height:3px;background:#c99a72;"></td></tr>
        <tr>
          <td style="padding:28px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#302c30;">
              ${rows
                .map(
                  ([label, value]) => `<tr>
                <td style="padding:6px 0;color:#8a7f74;width:130px;vertical-align:top;">${escapeHtml(label)}</td>
                <td style="padding:6px 0;font-weight:600;">${escapeHtml(value)}</td>
              </tr>`,
                )
                .join("")}
            </table>
            <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee3d8;">
              <p style="margin:0 0 10px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#b07f55;">Message</p>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#302c30;white-space:pre-wrap;">${escapeHtml(enquiry.message)}</p>
            </div>
            <p style="margin:28px 0 0;font-size:13px;color:#8a7f74;">
              Reply directly to this email to answer ${escapeHtml(enquiry.name.split(" ")[0] || "them")}.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#49283f;padding:16px 32px;">
            <p style="margin:0;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#c9b3a0;">
              ${escapeHtml(siteConfig.principles)}
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Emails a new enquiry to Adesua's inbox. Never throws — the caller decides
 * what to tell the visitor, and the enquiry is still stored if email fails.
 */
export async function sendEnquiryEmail(enquiry: EnquiryPayload): Promise<MailResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return {
      sent: false,
      reason:
        "Email delivery is not configured yet, so this will be saved and answered from the inbox once it is.",
    };
  }

  const fromAddress =
    process.env.ZOHO_MAIL_FROM || process.env.ZOHO_SMTP_USER || siteConfig.links.email;
  const fromName = process.env.ZOHO_MAIL_FROM_NAME || siteConfig.name;
  const to = process.env.ZOHO_MAIL_REPLY_TO || siteConfig.links.email;

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
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
      html: renderEnquiryHtml(enquiry),
    });
    return { sent: true };
  } catch (error) {
    console.error("[mailer] enquiry email failed", error);
    return {
      sent: false,
      reason: "The email could not be sent just now — the enquiry has still been saved.",
    };
  }
}
