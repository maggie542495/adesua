import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { siteConfig } from "@/config/site";
import { sendAutoReply, sendOwnerAlert } from "@/lib/email/send";

export interface ZeeTurn {
  role: "user" | "assistant";
  content: string;
}

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]{2,}/;

/**
 * Gemini models on the free tier, in the order we would like to use them.
 *
 * Every entry is free of charge on the Gemini Developer API, so the chain can
 * fall through on a rate limit without ever moving the studio onto a paid
 * model by accident. `AI_MODEL` (and `AI_MODEL_FALLBACKS`) are tried first so
 * a deployment can pin a model without editing code.
 */
const FREE_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
] as const;

function modelChain(): string[] {
  const split = (value: string | undefined) =>
    (value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

  return [
    ...new Set([...split(process.env.AI_MODEL), ...split(process.env.AI_MODEL_FALLBACKS), ...FREE_MODELS]),
  ];
}

/**
 * Adesua's professional record, quoted from her own profile. Kept verbatim so
 * Zee can answer questions about her background without inventing anything.
 */
export const PROFILE = `
FULL NAME: Adesua Margaret Oriaifo
HEADLINE: Customer Experience Specialist (CXS™) — designs innovative customer experiences by analysing customer data and patterns. Finance enthusiast — helps people make smart money decisions.
LOCATION: Lagos State, Nigeria. Works globally.
LINKEDIN: ${siteConfig.links.linkedin}
LANGUAGES: English (native or bilingual), French (elementary).

SUMMARY
Over seven years in Customer Success, Corporate Banking and Total Quality Management. Designs and implements customer journey frameworks, improves customer experience and drives process improvement. Works across functions to align delivery with the brand promise, lifting satisfaction, loyalty and retention.

EXPERIENCE
1. Sterling Bank — Head, Customer Success (July 2023 to present)
   - Documented all key processes for internal alignment and team effectiveness.
   - Led customer engagements based on data insights that produced a 6% increase in revenue.
   - Designed and implemented a defined Customer Journey for corporate customers, plus an engagement framework addressing gaps around inactive, dormant and unfunded accounts.
   - Built systems that improved the support team's productivity and capacity across the corporate customer lifecycle; deployed a 24/7 email team that improved turnaround on complaints and enquiries.
   - Ran regular communication training, which improved email response times; created pre-approved notification and holding-response templates.
   - Introduced monthly one-to-one check-ins and performance reviews; set minimum daily and monthly targets that lifted team productivity.
   - Her team was awarded "Most Improved Team" in 2023.

2. Access Bank Plc — Customer Journey Manager, Corporate Banking (August 2020 to July 2023)
   - Managed the end-to-end corporate customer journey, working with cross-functional units to design and implement solutions that improved experience, loyalty and retention.
   - Lifted CSAT on the corporate banking platform by 33 points: 53% (December 2020) to 83% (December 2021) to 86% (June 2022), exceeding the 85% target.
   - Championed the Customer Feedback Channel and redesigned the payment processing flow: 55% faster issue resolution, and Customer Effort score from 79% (December 2021) to 83% (June 2022).
   - Improved Net Promoter Score by 28 points: 9 (June 2021) to 28 (December 2021) to 37 (June 2022).
   - Facilitated customer service and relationship management training for Sales and Marketing teams.

3. Access Bank Plc — Customer Experience Analyst, Total Quality Management (September 2018 to August 2020)
   - Ran Voice of Customer satisfaction surveys, service quality assessments and user experience reviews that surfaced pain points and drove process improvement.
   - Helped move the bank's corporate segment from 9th (2018) to 5th (2019) in the annual KPMG Banking Industry Customer Experience Survey.
   - Supervised the launch of the monthly Corporate Customer Newsletter.
   - Planned and executed the maiden virtual Corporate Customer Forum during the first Covid-19 lockdown.
   - Developed the Rates Guide for all bank charges, addressing recurring complaints about unclear charges.

4. Access Bank Plc — Customer Support and Operations Officer (October 2016 to September 2018)
   - Delivered first-contact resolution on at least 120 customer tickets a day, within SLA.
   - Compiled team and customer reports and balanced all General Ledgers daily; the branch was rated "Satisfactory" in the biannual bank-wide audit.
   - Identified patterns in user frustration and ran weekly staff training; the branch was recognised as outstanding in the region.
   - Onboarded customers onto the mobile app, lifting the sign-up rate by 70%.

EDUCATION
- Master of Business Administration (MBA), University of the People, 2019 to 2021.
- Access Bank School of Banking Excellence, 2018 to 2019.
- Bachelor's degree in Microbiology, Obafemi Awolowo University, 2010 to 2015.

CERTIFICATIONS
- Customer Experience Specialist (CXS)
- ACIB
- Coaching Masteries Practitioner
- Product Management
- Certified Contact Center Manager (CCCM)®

CORE SKILLS
Strategy implementation · presentations · key metrics · customer journey mapping · Voice of Customer surveys and research · process improvement and optimisation · service quality assessment · CRM and complaint resolution · employee engagement and training · user experience testing and reviews · facilitation.
`.trim();

/**
 * Everything Zee is allowed to know. Kept in one place so the assistant
 * never contradicts the site: update here when the practice changes.
 */
const KNOWLEDGE = `
IDENTITY
Name: ${siteConfig.name}. Based in ${siteConfig.location}, working globally.
Roles: Customer Experience & Client Success Leader; professional coach; workshop facilitator; advisory consultant; writer.
Tagline: ${siteConfig.tagline}
Philosophy: ${siteConfig.philosophy}
Signature: ${siteConfig.signature}
Promise: ${siteConfig.promise}
Principles: ${siteConfig.principles}
Contact: ${siteConfig.links.email} · ${siteConfig.phone} · ${siteConfig.links.linkedin}
She normally replies within one working day.

PROFESSIONAL RECORD
${PROFILE}

PATHWAYS
1. Personal Growth — coaching, identity, purpose, intentional living, productivity, confidence and accountability.
2. Professional Impact — customer experience, client success, leadership, learning & development, facilitation and organisation development.

OFFERINGS
- Coaching: one-to-one and group coaching for leaders navigating growth, transition or a step up in scope.
- Facilitation: workshops and offsites designed to move a group from alignment to action.
- Advisory: short, focused engagements to diagnose a problem, design a fix and support implementation.
- Capability building: practical training for frontline and leadership teams.
- Writing: essays and reflections on leadership, customer experience and intentional living, published under Insights on the site.
- The Intentional Collective and The Intentional Impact Collective: community programmes for personal development and for leadership / CX practitioners.

ENQUIRY TYPES
coaching, consulting, speaking, writing, other.

TONE
Warm, precise, unhurried, professional. British spelling. Never invent prices, dates or availability.
If asked something you don't know (fees, exact dates, personal matters), say so plainly and offer to pass the question to Adesua — and ask for their email if you don't have it.
Keep answers to 2-4 short sentences unless the visitor asks for depth. Never claim to be human; you are Zee, her assistant.
`.trim();

export interface ZeeVisitor {
  name: string | null;
  email: string | null;
}

function systemPrompt(visitor: ZeeVisitor): string {
  const now = new Date();
  const hour = now.getHours();
  const working = now.getDay() >= 1 && now.getDay() <= 5 && hour >= 9 && hour < 17;

  const known = [
    visitor.name ? `their name is ${visitor.name}` : null,
    visitor.email ? `their email is ${visitor.email}` : null,
  ].filter(Boolean);

  const visitorSection = known.length
    ? `You already know ${known.join(" and ")}. Never ask for it again — use it.`
    : "You do not have their name or email yet.";

  /**
   * Asking for the visitor's details is not conditional on the topic — it is a
   * standing obligation for every reply until both are known. Zee used to only
   * ask once the conversation turned to something Adesua had to answer, so a
   * visitor who opened with "hello" was helped and sent away with nothing on
   * file. The studio had no name to greet them by and no address to write to.
   */
  const askFor =
    known.length === 2
      ? ""
      : `ALWAYS COLLECT THEIR DETAILS
You do not yet have ${[
          visitor.name ? null : "their name",
          visitor.email ? null : "their email address",
        ]
          .filter(Boolean)
          .join(" or ")}. Every reply you send — including a greeting, and including a reply that answers a question well — must end with one short, natural question asking for the missing detail. One question at a time, folded into what you just said, never as a form or a list.
${
  visitor.name
    ? "Ask for their email address, and say why: so Adesua can write to them personally."
    : visitor.email
      ? "Ask what to call them, so you can address them properly."
      : "Ask their name first, in this reply. Do not ask for the email in the same breath — wait for the name, then ask for the email in your next reply."
}
Phrase it like a person would, for example: "Before I go further — what should I call you?" Never say you are collecting data, and never make it sound like a sign-up.`;

  return `You are Zee, the assistant for ${siteConfig.name}'s practice website.

${KNOWLEDGE}

VISITOR
${visitorSection}
${askFor}

Current context: it is ${now.toUTCString()}; the studio is currently ${working ? "open" : "closed"}. ${
    working
      ? "You can say Adesua is likely to see a note today."
      : "Tell visitors Adesua is away from the desk and will reply on the next working day — and that you've noted their message."
  }`;
}

/* ── Gemini transport with a free-model fallback chain ─────────────── */

interface ModelReply {
  text: string;
  model: string;
}

interface CallModelInput {
  apiKey: string;
  system: string;
  contents: { role: "user" | "model"; parts: { text: string }[] }[];
  temperature: number;
  maxOutputTokens: number;
}

class ModelError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ModelError";
  }
}

async function callModel(model: string, input: CallModelInput): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": input.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.system }] },
        contents: input.contents,
        generationConfig: {
          temperature: input.temperature,
          maxOutputTokens: input.maxOutputTokens,
        },
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ModelError(response.status, `responded ${response.status} ${detail.slice(0, 200)}`.trim());
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

/**
 * Ask Gemini, walking the free-model chain until one answers.
 *
 * A rate limit, a retired model or a bad gateway on one model is not a reason
 * to fail the visitor — the next free model takes over. Only when every model
 * in the chain has failed does this throw.
 */
async function askGemini(
  system: string,
  contents: CallModelInput["contents"],
  options: { temperature?: number; maxOutputTokens?: number } = {},
): Promise<ModelReply> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error("AI assistant is not configured");

  const input: CallModelInput = {
    apiKey,
    system,
    contents,
    temperature: options.temperature ?? Number(process.env.AI_TEMPERATURE ?? 0.6),
    maxOutputTokens: options.maxOutputTokens ?? Number(process.env.AI_MAX_TOKENS ?? 400),
  };

  const failures: string[] = [];

  for (const model of modelChain()) {
    try {
      const text = await callModel(model, input);
      if (text) return { text, model };
      failures.push(`${model}: empty reply`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${model}: ${reason}`);
      console.warn(`[zee] ${model} unavailable — trying the next free model (${reason})`);
    }
  }

  throw new Error(`No Gemini model answered — ${failures.join("; ")}`);
}

/* ── Chat ──────────────────────────────────────────────────────────── */

export interface ZeeReplyInput {
  conversationKey: string;
  message: string;
  history: ZeeTurn[];
}

export interface ZeeReplyResult {
  reply: string;
  capturedEmail: string | null;
  capturedName: string | null;
  /** What Zee now knows about the visitor, so the widget can show it. */
  visitor: ZeeVisitor;
}

interface ConversationHandle {
  conversationId: string | undefined;
  name: string | null;
  email: string | null;
  enquiryId: string | null;
}

const EMPTY_CONVERSATION: ConversationHandle = {
  conversationId: undefined,
  name: null,
  email: null,
  enquiryId: null,
};

/**
 * Best-effort persistence — chat must still answer if the database is down.
 *
 * The row is the visitor's memory: name, email and the enquiry it produced
 * all live here, keyed by the token their browser keeps. A returning visitor
 * is recognised from it, so Zee never asks for the same detail twice.
 */
async function ensureConversation(
  conversationKey: string,
  details: { name?: string | null; email?: string | null },
): Promise<ConversationHandle> {
  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("chatbot_conversations")
      .select("id, email, name, enquiry_id")
      .eq("visitor_key", conversationKey)
      .maybeSingle();

    if (existing) {
      const name = (existing.name as string | null) ?? details.name ?? null;
      const email = (existing.email as string | null) ?? details.email ?? null;

      const patch: Record<string, unknown> = { last_message_at: new Date().toISOString() };
      if (details.name && !existing.name) patch.name = details.name;
      if (details.email && !existing.email) {
        patch.email = details.email;
        patch.consent_contact = true;
      }

      await supabase.from("chatbot_conversations").update(patch).eq("id", existing.id);

      return {
        conversationId: existing.id as string,
        name,
        email,
        enquiryId: (existing.enquiry_id as string | null) ?? null,
      };
    }

    const { data: created } = await supabase
      .from("chatbot_conversations")
      .insert({
        visitor_key: conversationKey,
        name: details.name ?? null,
        email: details.email ?? null,
        status: "active",
        consent_contact: Boolean(details.email),
      })
      .select("id")
      .single();

    return {
      conversationId: created?.id as string | undefined,
      name: details.name ?? null,
      email: details.email ?? null,
      enquiryId: null,
    };
  } catch (error) {
    console.error("[zee] conversation store unavailable", error);
    return { ...EMPTY_CONVERSATION, ...details };
  }
}

async function logTurn(
  conversationId: string | undefined,
  role: "user" | "assistant",
  content: string,
) {
  if (!conversationId) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("chatbot_messages").insert({
      conversation_id: conversationId,
      role,
      content,
    });
  } catch {
    // Logging is not worth failing a conversation over.
  }
}

async function askModel(
  history: ZeeTurn[],
  message: string,
  visitor: ZeeVisitor,
): Promise<ModelReply> {
  const contents: CallModelInput["contents"] = [
    ...history.slice(-8).map((turn) => ({
      role: turn.role === "assistant" ? ("model" as const) : ("user" as const),
      parts: [{ text: turn.content }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  return askGemini(systemPrompt(visitor), contents);
}

/* ── What we can learn from a turn ─────────────────────────────────── */

/**
 * Words that start a sentence like "I'm interested in…" but are never a
 * person's name. Without this, "I'm looking for coaching" would be stored as
 * a visitor called "looking for coaching".
 */
const NOT_A_NAME = new Set([
  "a", "an", "the", "not", "no", "just", "here", "there", "so", "very", "really",
  "currently", "based", "available", "happy", "glad", "sorry", "wondering", "hoping",
  "planning", "considering", "thinking", "keen", "eager", "ready", "new", "still",
  "also", "interested", "looking", "trying", "working", "writing", "reaching",
  "getting", "in", "on", "at", "from", "with", "about", "curious", "excited",
  "worried", "struggling", "dealing", "running", "building", "leading", "managing",
  "afraid", "unable", "quite", "kind", "sort", "bit", "little", "big", "small",
]);

const NAME_PATTERNS = [
  /\bmy name(?:'s| is)\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)?)/iu,
  /\byou can call me\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)?)/iu,
  /\bcall me\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)?)/iu,
  /\bthis is\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)?)/iu,
  /\bi(?:'m| am)\s+([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*)?)/iu,
];

/** Pull a visitor's name out of what they typed, or null if it isn't there. */
export function extractName(message: string): string | null {
  for (const pattern of NAME_PATTERNS) {
    const match = message.match(pattern);
    const candidate = match?.[1]?.trim();
    if (!candidate) continue;

    const words = candidate.split(/\s+/);
    if (words.length === 0 || words.length > 2) continue;
    if (NOT_A_NAME.has(words[0].toLowerCase())) continue;
    if (candidate.length > 60) continue;

    // Names read in title case or all caps; anything else is probably prose.
    if (!/^[\p{Lu}]/u.test(words[0]) && !/^[\p{Lu}]{2,}$/u.test(words[0])) continue;

    return candidate
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return null;
}

/**
 * Words that answer a different question than the one Zee just asked. Without
 * this, "Coaching" in reply to "what should I call you?" would be filed as the
 * visitor's name.
 */
const OFFERING_WORDS = new Set([
  "coaching", "consulting", "speaking", "writing", "training", "facilitation",
  "advisory", "workshop", "workshops", "yes", "no", "okay", "ok", "sure", "thanks",
  "thank", "hello", "hi", "hey", "none", "maybe", "later", "today", "tomorrow",
]);

/** Did the last thing Zee said ask for a name? */
function askedForName(history: ZeeTurn[]): boolean {
  const last = [...history].reverse().find((turn) => turn.role === "assistant");
  return Boolean(last && /\b(call you|your name|what should i call)\b/i.test(last.content));
}

/**
 * A name given as a bare answer — "Prince", "Adaeze Nwosu" — rather than in a
 * sentence. Zee asks for the name directly, so the natural reply is just the
 * name, and `extractName` (which needs "I'm…" or "my name is…") would miss it.
 */
export function bareNameReply(history: ZeeTurn[], message: string): string | null {
  if (!askedForName(history)) return null;

  const cleaned = message
    .trim()
    .replace(/^(hi|hello|hey)[,!\s]+/i, "")
    .replace(/^(i'm|i am|it's|its|this is|my name's|my name is)\s+/i, "")
    .replace(/[.!?]+$/, "")
    .trim();

  if (!cleaned || cleaned.includes("@") || cleaned.includes("http")) return null;

  const words = cleaned.split(/\s+/);
  if (words.length > 3) return null;
  if (!/^\p{Lu}[\p{L}'-]*(\s+\p{Lu}[\p{L}'-]*){0,2}$/u.test(cleaned)) return null;
  if (OFFERING_WORDS.has(words[0].toLowerCase())) return null;

  return cleaned;
}

/* ── History, so a returning visitor picks up where they left off ──── */

export interface ZeeHistoryTurn {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ZeeHistory {
  messages: ZeeHistoryTurn[];
  visitor: ZeeVisitor;
}

const EMPTY_HISTORY: ZeeHistory = { messages: [], visitor: { name: null, email: null } };

/** Load a visitor's saved conversation, keyed by the token in their browser. */
export async function loadConversation(conversationKey: string): Promise<ZeeHistory> {
  try {
    const supabase = createAdminClient();
    const { data: conversation } = await supabase
      .from("chatbot_conversations")
      .select("id, name, email")
      .eq("visitor_key", conversationKey)
      .maybeSingle();

    if (!conversation) return EMPTY_HISTORY;

    const { data: rows } = await supabase
      .from("chatbot_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
      .limit(60);

    return {
      messages: (rows ?? []).map((row) => ({
        role: row.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: String(row.content ?? ""),
        createdAt: String(row.created_at ?? ""),
      })),
      visitor: {
        name: (conversation.name as string | null) ?? null,
        email: (conversation.email as string | null) ?? null,
      },
    };
  } catch (error) {
    console.error("[zee] history unavailable", error);
    return EMPTY_HISTORY;
  }
}

/* ── Email drafting ────────────────────────────────────────────────── */

export interface EmailDraftInput {
  name: string;
  email?: string | null;
  subject?: string | null;
  message: string;
  category?: string | null;
  /**
   * `acknowledgement` is the instant auto-reply; `reply` is a considered
   * answer drafted in the studio for Adesua to review before sending.
   */
  kind?: "acknowledgement" | "reply";
}

export interface EmailDraft {
  body: string;
  model: string | null;
}

function fallbackDraft(input: EmailDraftInput): string {
  const firstName = input.name.split(" ")[0] || "there";

  if (input.kind === "reply") {
    return `Thank you for your note, ${firstName} — it is good to hear from you.

I have read what you shared and would like to give it a proper answer rather than a quick one. I will come back to you within one working day with my thoughts and the next step.

If anything is urgent in the meantime, you can reach me on ${siteConfig.phone}.`;
  }

  return `Thank you for writing — your message has reached me safely. I read every note personally and will come back to you within one working day.`;
}

/**
 * Draft an email body in Adesua's voice, grounded in her own record.
 *
 * Returns paragraphs only: the greeting and sign-off are added by the email
 * shell, so the same draft works for the auto-reply and the studio composer.
 * Falls back to a hand-written template if every model is unavailable — an
 * enquiry must never go unanswered because a model was rate-limited.
 */
export async function draftEmailReply(input: EmailDraftInput): Promise<EmailDraft> {
  const firstName = input.name.split(" ")[0] || "there";
  const kind = input.kind ?? "acknowledgement";

  const instruction = `You are Zee, writing email on behalf of ${siteConfig.name}.

${KNOWLEDGE}

TASK
Draft the body of a ${kind === "reply" ? "considered reply" : "short acknowledgement"} from Adesua to ${firstName}${
    input.email ? ` (${input.email})` : ""
  }.

WHAT THEY WROTE
${input.subject ? `Subject: ${input.subject}\n` : ""}${input.message.slice(0, 4000)}

RULES
- Write in the first person as Adesua, warm, precise and unhurried. British spelling.
- ${
    kind === "reply"
      ? "Answer what they actually asked, in 2 to 4 short paragraphs. Offer a concrete next step."
      : "Two or three short sentences. Acknowledge the note, say when she will reply, and offer the phone number if it is urgent."
  }
- Do NOT include a greeting line, a sign-off, a signature, a subject line or a bullet list. Those are added automatically.
- Never invent prices, dates, availability, or commitments she has not made. If specifics are needed, say she will confirm them.
- Plain text only. Separate paragraphs with a blank line. No markdown.`;

  try {
    const { text, model } = await askGemini(
      instruction,
      [{ role: "user", parts: [{ text: "Draft the email body now." }] }],
      { temperature: kind === "reply" ? 0.5 : 0.4, maxOutputTokens: kind === "reply" ? 500 : 220 },
    );

    // Models sometimes add a greeting or sign-off despite the instruction.
    const cleaned = text
      .replace(/^(dear|hello|hi)\b[^\n]*\n+/i, "")
      .replace(/\n+(warmly|warm regards|kind regards|best regards|regards|yours)[,\s]*\n*adesua[^\n]*$/i, "")
      .trim();

    return { body: cleaned || fallbackDraft(input), model };
  } catch (error) {
    console.error("[zee] email draft unavailable — using the template", error);
    return { body: fallbackDraft(input), model: null };
  }
}

/* ── The chat turn ─────────────────────────────────────────────────── */

export async function replyAsZee({
  conversationKey,
  message,
  history,
}: ZeeReplyInput): Promise<ZeeReplyResult> {
  const capturedEmail = message.match(EMAIL_PATTERN)?.[0]?.toLowerCase() ?? null;
  // A name either arrives inside a sentence, or — because Zee now asks — as a
  // bare answer to the question.
  const capturedName = extractName(message) ?? bareNameReply(history, message);

  const conversation = await ensureConversation(conversationKey, {
    name: capturedName,
    email: capturedEmail,
  });

  const visitor: ZeeVisitor = { name: conversation.name, email: conversation.email };

  await logTurn(conversation.conversationId, "user", message);

  let reply: string;
  try {
    const { text } = await askModel(history, message, visitor);
    reply = text;
  } catch (error) {
    console.error("[zee] model unavailable", error);
    reply = capturedEmail
      ? `Thank you — I've noted ${capturedEmail} and passed your message to Adesua. She replies personally within one working day. If it is urgent, you can also reach her on ${siteConfig.phone}.`
      : `I'm having trouble reaching the studio right now, but your message is noted. Leave your email here and Adesua will reply within one working day, or write to ${siteConfig.links.email} directly.`;
  }

  await logTurn(conversation.conversationId, "assistant", reply);

  // The whole exchange, not just the last line — the studio should open on
  // the conversation, not a fragment of it.
  const transcript = [
    ...history.slice(-6).map((turn) => `${turn.role === "user" ? "Visitor" : "Zee"}: ${turn.content}`),
    `Visitor: ${message}`,
  ].join("\n");

  // Once we have an email the conversation becomes a real enquiry — once,
  // not on every turn. A name arriving later fills it in.
  if (visitor.email && !conversation.enquiryId) {
    try {
      const supabase = createAdminClient();
      const name = visitor.name ?? "Website visitor";

      const { data: enquiry } = await supabase
        .from("enquiries")
        .insert({
          name,
          email: visitor.email,
          message: transcript,
          category: "other",
          source: "zee-assistant",
          status: "new",
        })
        .select("id")
        .single();

      if (enquiry?.id && conversation.conversationId) {
        await supabase
          .from("chatbot_conversations")
          .update({ enquiry_id: enquiry.id })
          .eq("id", conversation.conversationId);
      }

      // A dedicated email draft, not the chat reply: the visitor should get a
      // proper note from Adesua, not a transcript of the widget.
      const draft = await draftEmailReply({
        name: visitor.name ?? "there",
        email: visitor.email,
        message: transcript,
        kind: "acknowledgement",
      });

      await sendAutoReply({
        name: visitor.name ?? "there",
        email: visitor.email,
        message: transcript,
        reply: draft.body,
      });

      await sendOwnerAlert({
        title: "Zee captured a new enquiry",
        body: `${visitor.name ?? "A visitor"} (${visitor.email}) via the chat widget: "${message.slice(0, 160)}"`,
        link: enquiry?.id ? `/admin/enquiries/${enquiry.id}` : "/admin/enquiries",
      });
    } catch (error) {
      console.error("[zee] enquiry capture failed", error);
    }
  } else if (visitor.email && conversation.enquiryId && capturedName) {
    // They introduced themselves after the enquiry was filed.
    try {
      const supabase = createAdminClient();
      await supabase
        .from("enquiries")
        .update({ name: capturedName })
        .eq("id", conversation.enquiryId)
        .eq("name", "Website visitor");
    } catch (error) {
      console.error("[zee] enquiry name update failed", error);
    }
  }

  return { reply, capturedEmail, capturedName, visitor };
}
