import { NextResponse } from "next/server";
import { loadConversation, replyAsZee, type ZeeTurn } from "@/lib/zee/assistant";

// The Node.js runtime is the default; declaring `runtime` explicitly conflicts
// with `nextConfig.cacheComponents`, so it is deliberately omitted.

interface Body {
  message?: unknown;
  conversationKey?: unknown;
  history?: unknown;
}

function parseHistory(value: unknown): ZeeTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (turn): turn is ZeeTurn =>
        Boolean(turn) &&
        typeof turn === "object" &&
        (turn as ZeeTurn).role !== undefined &&
        typeof (turn as ZeeTurn).content === "string",
    )
    .slice(-10)
    .map((turn) => ({
      role: turn.role === "assistant" ? "assistant" : "user",
      content: String(turn.content).slice(0, 2000),
    }));
}

/**
 * The visitor's saved conversation, so reopening the widget picks up where
 * they left off. Keyed by the token their browser keeps — no login needed.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get("conversationKey")?.slice(0, 120);
  if (!key) {
    return NextResponse.json({ messages: [], visitor: { name: null, email: null } });
  }

  try {
    return NextResponse.json(await loadConversation(key));
  } catch (error) {
    console.error("[zee] history route failed", error);
    return NextResponse.json({ messages: [], visitor: { name: null, email: null } });
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const conversationKey =
    typeof body.conversationKey === "string" && body.conversationKey.length > 0
      ? body.conversationKey.slice(0, 120)
      : `anon-${Date.now()}`;

  if (!message) {
    return NextResponse.json({ error: "A message is required" }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json(
      { error: "That message is a little long — please shorten it." },
      { status: 413 },
    );
  }

  try {
    const result = await replyAsZee({
      conversationKey,
      message,
      history: parseHistory(body.history),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("[zee] route failed", error);
    return NextResponse.json(
      { error: "Zee is unavailable right now" },
      { status: 500 },
    );
  }
}
