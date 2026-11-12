"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, Loader2, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME =
  "Hello, I'm Zee — Adesua's assistant. I can help you understand her coaching, facilitation and advisory work, point you to her writing, or take your details so she can reply personally. What would you like to know?";

const STORAGE_KEY = "adesua-zee-conversation";
const HISTORY_CACHE = "adesua-zee-history";

interface Visitor {
  name: string | null;
  email: string | null;
}

/** A local copy of the thread, so the widget opens instantly and offline. */
function readCachedHistory(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_CACHE);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { id: string; role: string; content: string; timestamp: string }[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-40).map((entry) => ({
      id: entry.id,
      role: entry.role === "user" ? "user" : "assistant",
      content: String(entry.content ?? ""),
      timestamp: new Date(entry.timestamp),
    }));
  } catch {
    return [];
  }
}

function writeCachedHistory(messages: Message[]) {
  try {
    window.localStorage.setItem(HISTORY_CACHE, JSON.stringify(messages.slice(-40)));
  } catch {
    // Private mode — the server copy is still there.
  }
}

function visitorKey(): string {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const key =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `zee-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(STORAGE_KEY, key);
  return key;
}

/**
 * Zee's own mark — a gold monogram on deep plum, deliberately distinct from
 * Adesua's portrait photography so the assistant never reads as her.
 * Colours are invariant (band/gold) so it holds up in both themes.
 */
function ZeeMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-band-3 ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 30% 22%, rgba(212,175,120,0.42), rgba(212,175,120,0) 62%)",
        }}
      />
      <span
        className="font-display leading-none text-gold-300"
        style={{ fontSize: size * 0.52, paddingTop: size * 0.06 }}
      >
        Z
      </span>
      <Sparkles
        className="absolute text-gold-400/90"
        style={{ width: size * 0.24, height: size * 0.24, top: size * 0.14, right: size * 0.16 }}
      />
    </span>
  );
}

export function ZeeWidget() {
  const [isOpen, setIsOpen] = useState(false);
  // The cached thread is the initial value, so a returning visitor sees their
  // conversation on the first paint rather than after a round trip.
  const [messages, setMessages] = useState<Message[]>(readCachedHistory);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [visitor, setVisitor] = useState<Visitor>({ name: null, email: null });
  const [welcome] = useState<Message>(() => ({
    id: "welcome",
    role: "assistant",
    content: WELCOME,
    /**
     * A fixed epoch rather than the current time: reading the clock while the
     * page renders counts as runtime data, which stops the page prerendering.
     * The greeting carries no time of its own anyway, so nothing is lost.
     */
    timestamp: new Date(0),
  }));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Then reconcile with the saved conversation on the server, which is the
  // source of truth across devices and after a cache clear.
  useEffect(() => {
    let cancelled = false;
    const key = visitorKey();
    if (!key) return;

    fetch(`/api/zee/chat?conversationKey=${encodeURIComponent(key)}`)
      .then((response) => response.json())
      .then(
        (data: {
          messages?: { role: string; content: string; createdAt: string }[];
          visitor?: Visitor;
        }) => {
          if (cancelled) return;
          if (data.visitor) setVisitor(data.visitor);
          if (data.messages?.length) {
            setMessages(
              data.messages.map((entry, index) => ({
                id: `history-${index}`,
                role: entry.role === "assistant" ? "assistant" : "user",
                content: entry.content,
                timestamp: entry.createdAt ? new Date(entry.createdAt) : new Date(),
              })),
            );
          }
        },
      )
      .catch(() => {
        // Offline or the store is down — the cached thread is enough.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Mirror the thread into the browser so it survives a reload.
  useEffect(() => {
    if (messages.length === 0) return;
    writeCachedHistory(messages);
  }, [messages]);

  const thread = messages.length > 0 ? messages : [welcome];

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/zee/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationKey: visitorKey(),
          history: [...messages, userMessage]
            .filter((message) => message.id !== "welcome")
            .slice(-10)
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = (await response.json()) as {
        reply?: string;
        error?: string;
        visitor?: Visitor;
      };

      if (data.visitor) setVisitor(data.visitor);

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ??
            `I couldn't reach the studio just now. You can write to Adesua directly at ${siteConfig.links.email} — she answers within one working day.`,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `I'm having trouble connecting. Please write to Adesua directly at ${siteConfig.links.email}.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat with Zee" : "Chat with Zee"}
        aria-expanded={isOpen}
        className="group fixed bottom-5 left-5 z-[60] flex size-14 items-center justify-center rounded-full border border-gold-400/70 bg-band text-on-band shadow-[0_18px_40px_-14px_rgba(35,17,30,0.8)] transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6 sm:left-6"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-gold-300/25"
        />
        {isOpen ? (
          <X className="size-5" aria-hidden />
        ) : (
          <>
            <ZeeMark size={40} className="ring-1 ring-gold-300/40" />
            <span className="absolute -right-0.5 -top-0.5 size-3 rounded-full border-2 border-band bg-emerald-400" />
          </>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat with Zee"
          className="fixed inset-x-3 bottom-24 z-[60] flex max-h-[min(34rem,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border border-gold-500/30 bg-card shadow-[0_30px_80px_-30px_rgba(20,8,16,0.85)] sm:inset-x-auto sm:left-6 sm:w-[24rem]"
        >
          {/* Header — invariant band colours so it stays deep in both themes */}
          <header className="relative overflow-hidden bg-band-2 px-4 py-3.5 text-on-band">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 140% at 88% -20%, rgba(212,175,120,0.30), rgba(212,175,120,0) 58%)",
              }}
            />
            <div className="relative flex items-center justify-between gap-3 mb-8">
              <div className="flex min-w-0 items-center gap-3">
                <ZeeMark size={40} className="ring-1 ring-gold-400/50" />
                <div className="min-w-0">
                  <p className="truncate font-display text-lg leading-tight tracking-wide">
                    Zee
                  </p>
                  <p className="flex items-center gap-1.5 text-[0.7rem] text-on-band-muted">
                    <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />
                    {visitor.name ? `Chatting as ${visitor.name}` : "Adesua's assistant"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-on-band/70 transition hover:bg-on-band/15 hover:text-on-band focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <span
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold-400/80 to-transparent"
            />
          </header>

          {/* Thread */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-ivory-50 px-4 py-4">
            {thread.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    message.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-band px-3.5 py-2.5 text-sm leading-relaxed text-on-band shadow-sm"
                      : "max-w-[88%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed text-charcoal-800 shadow-sm"
                  }
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp.getTime() > 0 && (
                    <p className="mt-1.5 text-[0.65rem] uppercase tracking-wide opacity-55">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <ZeeMark size={22} />
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5">
                  <Loader2 className="size-3.5 animate-spin text-gold-600" aria-hidden />
                  <span className="text-xs text-muted-foreground">Zee is writing…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <form onSubmit={handleSubmit} className="border-t border-border bg-card px-3 py-3">
            <label htmlFor="zee-input" className="sr-only">
              Your message to Zee
            </label>
            <div className="flex items-end gap-2">
              <input
                id="zee-input"
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask Zee anything…"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-full border border-input bg-ivory-100 px-4 py-2.5 text-sm text-charcoal-800 placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/25"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-band text-on-band transition hover:bg-band-2 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[0.65rem] text-muted-foreground">
              <Sparkles className="size-3 text-gold-600" aria-hidden />
              Share your email and Zee can have Adesua reply to you.
            </p>
          </form>
        </div>
      )}
    </>
  );
}
