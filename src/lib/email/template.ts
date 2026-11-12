import { siteConfig } from "@/config/site";

/**
 * One branded shell for every email the practice sends — auth, enquiries,
 * replies, invitations and owner alerts.
 *
 * The layout follows Adesua's printed stationery: a portrait-and-wordmark
 * header band, the message sitting beside a "Purpose drives everything" side
 * panel, a cream footer band, and the five-colour rule closing it off.
 *
 * The card is pinned at 700px so it reads wide and airy in a desktop reading
 * pane, and three rules keep that width honest:
 *
 * 1. The width is declared as an attribute *and* in px, on both the outer
 *    wrapper and the card. `max-width` alone is ignored by Outlook and lets
 *    other clients quietly shrink the whole email to their content width.
 * 2. Columns are percentages, never a run of fixed widths, so a client that
 *    does render narrower shrinks everything in proportion instead of
 *    collapsing the fluid column to nothing.
 * 3. Nothing important sits in a fourth or fifth column. The header is two
 *    columns, the footer three — a logo lives inside the text block, aligned
 *    right, where it can never steal the room the wordmark needs.
 *
 * Table-based, inline styles, no external CSS or web fonts. A media query at
 * 640px drops the card to full width and stacks every row for phones; clients
 * that ignore it (Outlook desktop) render at 700px, where the layout holds.
 */

/* Brand palette — taken from the stationery and the "Living Life in Colour"
   logo, which is where the five rule colours come from. */
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
const PAGE = "#f2f1ef";
const WHITE = "#ffffff";
const INK = "#202a3b";
const DEEP = "#171923";
const MUTED = "#6b5f66";

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Arial,Helvetica,sans-serif";

/** The five swatches that close the card off. */
const RULE_COLOURS = [PLUM_DEEP, ROSE, AMBER, SAFFRON, OLIVE];

const ROLE_LINES =
  "CUSTOMER EXPERIENCE &amp; CLIENT SUCCESS LEADER<br>COACH&nbsp;&nbsp;|&nbsp;&nbsp;FACILITATOR&nbsp;&nbsp;|&nbsp;&nbsp;PURPOSE-DRIVEN";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Paragraphs from plain text — doubles render as breaks, never as raw HTML. */
export function paragraphs(value: string): string {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map(
      (block) =>
        `<p style="margin:0 0 14px;font-family:${SANS};font-size:16px;line-height:1.8;color:${INK};">${block.replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 6px;">
    <tr><td bgcolor="${PLUM}" style="border-radius:4px;background-color:${PLUM};">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:13px;font-weight:bold;letter-spacing:.06em;color:#ffffff;text-decoration:none;border-radius:4px;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`;
}

export interface EmailShellOptions {
  /** Small line above the title, e.g. "New enquiry". */
  preheader: string;
  title: string;
  /** Inner HTML (already escaped by the helpers above). */
  body: string;
  /** Optional footer note shown above the closing band. */
  footnote?: string;
}

/** "More Confidence. Greater Impact. Brighter Futures." → one sentence a line. */
function sentences(value: string): string {
  return (value.match(/[^.]+\.?/g) ?? [value])
    .map((part) => part.trim())
    .filter(Boolean)
    .join("<br>");
}

/** A single flowing contact line — wraps instead of cramping into a column. */
function contactLine(size = 11): string {
  const dot = `<span style="color:${RULE};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`;
  const parts = [
    `✉&nbsp; <a href="mailto:${escapeHtml(siteConfig.links.email)}" style="color:${INK};text-decoration:none;">${escapeHtml(siteConfig.links.email)}</a>`,
    `<b style="color:${PLUM};">in</b>&nbsp; <a href="${escapeHtml(siteConfig.links.linkedin)}" style="color:${INK};text-decoration:none;">LinkedIn</a>`,
    `📍&nbsp; ${escapeHtml(siteConfig.location)}`,
    `<b style="color:${PLUM};">❤️</b>&nbsp; ${escapeHtml(siteConfig.signature)}`,
  ];

  return `<div style="font-family:${SANS};font-size:${size}px;line-height:1.95;color:${INK};">${parts.join(dot)}</div>`;
}

/**
 * Where the brand files are reachable from a mail client today.
 *
 * `adesuaoriaifo.com` is the address the practice actually uses and which the
 * footer links to; it is not wired to a host yet, so images are fetched from
 * the deploy that does serve them. Once the domain resolves, email images and
 * the link can share it.
 */
const PUBLIC_BRAND_ORIGIN = "https://adesuaoriaifo.vercel.app";
const PUBLIC_SITE_ORIGIN = "https://adesuaoriaifo.com";

/**
 * The origin email images are served from.
 *
 * `EMAIL_ASSET_BASE_URL` wins when set, so a deployment can point mail at its
 * own public domain. Failing that, a configured site URL is used only if it is
 * a real, non-local origin; anything local or empty falls back to the deployed
 * brand origin, because a broken image is worse than a hard-coded one.
 */
function publicAssetBase(): string {
  const configured = process.env.EMAIL_ASSET_BASE_URL;
  if (configured) return configured.replace(/\/$/, "");

  /**
   * The brand origin is the default rather than `siteConfig.url`. The site URL
   * points at whatever domain the app is *served* from — localhost in
   * development, and in production `adesua.com`, which does not resolve today.
   * Neither is where the brand files actually live, so emphasizing either
   * leaves the recipient's client showing a broken image.
   */
  return PUBLIC_BRAND_ORIGIN;
}

export function renderEmail({
  preheader,
  title,
  body,
  footnote,
}: EmailShellOptions): string {
  /**
   * Images are fetched by the recipient's mail client, not by this server, so
   * they must be absolute and publicly reachable. `NEXT_PUBLIC_SITE_URL` is
   * routinely `localhost` in development, which renders as a broken image in
   * every inbox — so a public base is preferred here, and a local one is
   * replaced by the deployed origin rather than sent out.
   */
  /**
   * All three images come from the deployed public origin, not from
   * `NEXT_PUBLIC_SITE_URL`. That variable is `localhost` in development and
   * the configured domain may not resolve yet in production, and either way
   * the recipient's mail client is the one fetching these — a host it cannot
   * reach renders as a broken image in every inbox.
   *
   * `icon.png` is the head-and-shoulders portrait: at 24% of a 700px card the
   * full-torso cut-out left the face too small to read, and this crop fills
   * the cell the way the stationery does.
   */
  const base = publicAssetBase();
  const portrait = `${base}/brand/icon.png`;
  const mark = `${base}/brand/living-life-in-colour.jpg`;

  const principles = escapeHtml(siteConfig.principles)
    .split("|")
    .map((part) => part.trim())
    .join("&nbsp; | &nbsp;");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light only" />
    <title>${escapeHtml(title)}</title>
    <style>
      /* Phones: every row becomes a stack, edges pull in, type stays readable. */
      @media only screen and (max-width:640px) {
        .wrap { padding:10px 0 !important; }
        .card { width:100% !important; max-width:100% !important; }
        .stack { display:block !important; width:100% !important; max-width:100% !important; box-sizing:border-box !important; }
        .stack-pad { padding:20px !important; }
        .stack-rule { border-left:0 !important; border-top:1px solid ${RULE} !important; }
        .portrait-cell { padding:18px 20px 0 !important; text-align:center !important; }
        .portrait-img { width:150px !important; max-width:150px !important; margin:0 auto !important; }
        .logo-cell { width:64px !important; }
        .mark-img { width:60px !important; }
        .panel { padding:20px !important; }
        .wordmark { font-size:28px !important; }
        .footmark { font-size:24px !important; }
        .bar-cell { height:8px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${PAGE};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wrap" style="width:100%;background:${PAGE};padding:20px 12px;">
      <tr><td align="center">

        <table role="presentation" width="700" cellpadding="0" cellspacing="0" border="0" class="card" style="width:700px;max-width:700px;table-layout:fixed;border-collapse:collapse;background:${WHITE};">

          <!-- ── Header band: portrait, wordmark, logo, contact ─────────── -->
          <tr><td style="padding:0;background:${CREAM};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;background:${CREAM};">
              <tr>
                <td class="stack portrait-cell" width="24%" valign="middle" style="width:24%;padding:0;vertical-align:middle;">
                  <img src="${portrait}" width="168" alt="${escapeHtml(siteConfig.name)}" class="portrait-img" style="display:block;width:100%;max-width:168px;height:auto;border:0;" />
                </td>
                <td class="stack stack-pad" width="76%" valign="middle" style="width:76%;padding:20px 22px;vertical-align:middle;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td valign="top" style="padding:0 10px 0 0;vertical-align:top;">
                        <div class="wordmark" style="font-family:${SERIF};font-style:italic;font-size:31px;line-height:1.12;color:${PLUM};">${escapeHtml(siteConfig.name)}</div>
                        <div style="margin-top:10px;font-family:${SANS};font-size:9px;line-height:1.85;letter-spacing:1.2px;color:${DEEP};font-weight:bold;">${ROLE_LINES}</div>
                        <div style="margin-top:13px;font-family:${SERIF};font-style:italic;font-size:13px;line-height:1.55;color:${PLUM};">${principles}</div>
                      </td>
                      <td class="logo-cell" width="70" align="right" valign="top" style="width:70px;padding:2px 0 0;vertical-align:top;text-align:right;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" style="border-collapse:collapse;">
                          <tr>
                            <td align="center" valign="middle" style="width:58px;height:58px;padding:0;vertical-align:middle;text-align:center;">
                              <div style="width:58px;height:58px;background-color:${CREAM};border:1px solid ${RULE};font-family:${SERIF};font-style:italic;font-size:22px;line-height:56px;color:${PLUM};text-align:center;">A</div>
                            </td>
                          </tr>
                          <tr>
                            <td height="3" style="height:3px;padding:0;font-size:0;line-height:0;">
                              <table role="presentation" width="58" cellpadding="0" cellspacing="0" border="0" style="width:58px;height:3px;border-collapse:collapse;"><tr>
                                ${RULE_COLOURS.map((colour) => `<td width="20%" height="3" style="width:20%;height:3px;background:${colour};background-color:${colour};font-size:0;line-height:0;">&nbsp;</td>`).join("")}
                              </tr></table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:16px;padding-top:13px;border-top:1px solid ${RULE};">
                    ${contactLine(11)}
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- ── Message, beside the purpose panel ──────────────────────── -->
          <tr><td style="padding:0;background:${WHITE};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;background:${WHITE};">
              <tr>
                <td class="stack" width="80%" valign="top" style="width:80%;padding:28px 26px 32px;vertical-align:top;font-family:${SANS};font-size:16px;line-height:1.8;color:${INK};">
                  <p style="margin:0 0 6px;font-family:${SANS};font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${PLUM};">${escapeHtml(preheader)}</p>
                  <h1 style="margin:0 0 16px;font-family:${SERIF};font-style:italic;font-size:26px;line-height:1.25;font-weight:normal;color:${PLUM};">${escapeHtml(title)}</h1>
                  <div style="margin:0 0 20px;height:1px;background:${HAIRLINE};"></div>
                  ${body}
                  ${footnote ? `<p style="margin:24px 0 0;padding-top:16px;border-top:1px solid ${HAIRLINE};font-family:${SANS};font-size:12px;line-height:1.7;color:${MUTED};">${footnote}</p>` : ""}
                </td>
                <td class="stack panel" width="20%" valign="middle" align="center" bgcolor="${CREAM_SOFT}" style="width:20%;padding:22px 10px;vertical-align:middle;text-align:center;background-color:${CREAM_SOFT};">
                  <div style="font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.4;color:${PLUM};">${escapeHtml(siteConfig.purpose).replace(/\s+/g, "<br>")}<br><span style="font-style:normal;">♡</span></div>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- ── Footer band ────────────────────────────────────────────── -->
          <tr><td style="padding:0;background:${CREAM_SOFT};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;border-collapse:collapse;background:${CREAM_SOFT};">
              <tr>
                <td class="stack" width="46%" valign="middle" style="width:46%;padding:22px 14px 16px 24px;vertical-align:middle;">
                  <div class="footmark" style="font-family:${SERIF};font-style:italic;font-size:26px;line-height:1.12;color:${PLUM};">${escapeHtml(siteConfig.name)}</div>
                  <div style="margin-top:9px;font-family:${SANS};font-size:9px;line-height:1.9;letter-spacing:1.1px;color:${DEEP};font-weight:bold;">${ROLE_LINES}</div>
                </td>
                <td class="stack" width="18%" valign="middle" align="center" style="width:18%;padding:16px 8px;vertical-align:middle;text-align:center;">
                  <img src="${mark}" width="74" alt="Living Life in Colour" style="display:block;width:74px;max-width:74px;height:auto;border:0;margin:0 auto;" />
                </td>
                <td class="stack stack-rule" width="36%" valign="middle" align="center" style="width:36%;padding:16px 20px;border-left:1px solid ${RULE};vertical-align:middle;text-align:center;">
                  <div style="font-family:${SERIF};font-style:italic;font-size:15px;line-height:1.45;color:${PLUM};">${sentences(siteConfig.outlook)}</div>
                </td>
              </tr>
              <tr>
                <td colspan="3" style="padding:0 24px 20px;">
                  <div style="padding-top:14px;border-top:1px solid ${RULE};">
                    ${contactLine(11)}
                  </div>
                </td>
              </tr>
            </table>
          </td></tr>

          <!-- ── The five-colour rule ───────────────────────────────────── -->
          <tr><td style="padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;height:10px;border-collapse:collapse;">
              <tr>
                ${RULE_COLOURS.map(
                  (colour) =>
                    `<td width="20%" height="10" class="bar-cell" style="width:20%;height:10px;background:${colour};background-color:${colour};font-size:0;line-height:0;">&nbsp;</td>`,
                ).join("")}
              </tr>
            </table>
          </td></tr>

        </table>

        <p style="margin:14px 0 0;font-family:${SANS};font-size:10px;line-height:1.7;color:${MUTED};text-align:center;">
          Sent by ${escapeHtml(siteConfig.name)} · ${escapeHtml(siteConfig.locationLong)}<br>
          <a href="${PUBLIC_SITE_ORIGIN}" style="color:${MUTED};text-decoration:underline;">${escapeHtml(PUBLIC_SITE_ORIGIN.replace(/^https?:\/\//, ""))}</a>
        </p>

      </td></tr>
    </table>
  </body>
</html>`;
}

/** A label/value table used by enquiry and alert emails. */
export function detailRows(rows: Array<[string, string]>): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;font-family:${SANS};font-size:14px;margin:0 0 22px;">
    ${rows
      .map(
        ([label, value]) => `<tr>
      <td style="padding:7px 0;color:${MUTED};width:120px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:7px 0;color:${INK};font-weight:bold;">${escapeHtml(value)}</td>
    </tr>`,
      )
      .join("")}
  </table>`;
}
