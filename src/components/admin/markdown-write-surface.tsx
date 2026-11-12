"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A writing surface where the prose is what you see and the Markdown is not.
 *
 * The textarea's own text is transparent, and a mirror layer beneath it shows
 * the same characters with the syntax markers faded and blurred and the words
 * themselves styled — bold words look bold, headings look like headings. The
 * mirror emits every character it was given, markers included, so both layers
 * wrap identically and the caret never drifts from the text. Styling is
 * limited to what cannot change a glyph's width (weight, colour, underline);
 * a bigger heading font would re-wrap the mirror and break that alignment.
 */

type Kind =
  | "marker"
  | "plain"
  | "strong"
  | "em"
  | "code"
  | "strike"
  | "heading"
  | "quote"
  | "link"
  | "url";

interface Span {
  text: string;
  kind: Kind;
}

const kindClass: Record<Kind, string> = {
  marker: "select-none opacity-25 blur-[1.5px]",
  plain: "text-charcoal-700",
  strong: "font-bold text-plum-700",
  em: "italic text-charcoal-800",
  code: "rounded bg-gold-500/20 text-charcoal-800",
  strike: "line-through opacity-60",
  heading: "font-bold text-plum-600",
  quote: "italic text-mauve-700",
  link: "text-gold-800 underline decoration-gold-400 underline-offset-2",
  url: "select-none opacity-40 blur-[1px] text-gold-800",
};

const INLINE =
  /(\*\*[^\n]+?\*\*|__[^\n]+?__|~~[^\n]+?~~|`[^`\n]+`|!?\[[^\]\n]*\]\([^)\n]*\)|\*[^*\n]+?\*|_[^_\n]+?_)/g;

function pushPlain(out: Span[], text: string) {
  if (!text) return;
  // Loose markers (a half-typed `**`, a bullet run) fade too, so mid-sentence
  // syntax never pops out of the prose.
  for (const piece of text.split(/([*_`~]+)/)) {
    if (!piece) continue;
    out.push({ text: piece, kind: /^[*_`~]+$/.test(piece) ? "marker" : "plain" });
  }
}

function inlineSpans(text: string, base: Kind): Span[] {
  const out: Span[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) pushPlain(out, text.slice(last, match.index));
    out.push(...classify(match[0], base));
    last = match.index + match[0].length;
  }
  if (last < text.length) pushPlain(out, text.slice(last));

  return out;
}

function classify(raw: string, base: Kind): Span[] {
  const marker = (text: string): Span => ({ text, kind: "marker" });

  if (raw.startsWith("**") || raw.startsWith("__")) {
    const fence = raw.slice(0, 2);
    return [marker(fence), ...inlineSpans(raw.slice(2, -2), "strong"), marker(fence)];
  }

  if (raw.startsWith("~~")) {
    return [marker("~~"), ...inlineSpans(raw.slice(2, -2), "strike"), marker("~~")];
  }

  if (raw.startsWith("`")) {
    return [marker("`"), { text: raw.slice(1, -1), kind: "code" }, marker("`")];
  }

  const link = /^(!?)\[([^\]\n]*)\]\(([^)\n]*)\)$/.exec(raw);
  if (link) {
    const [, bang, label, url] = link;
    return [
      marker(bang ? "![" : "["),
      ...inlineSpans(label, "link"),
      marker("]("),
      { text: url, kind: "url" },
      marker(")"),
    ];
  }

  if (raw.startsWith("*") || raw.startsWith("_")) {
    const fence = raw[0];
    return [marker(fence), ...inlineSpans(raw.slice(1, -1), "em"), marker(fence)];
  }

  return [{ text: raw, kind: base }];
}

function lineSpans(line: string): Span[] {
  if (!line) return [];

  const heading = /^(#{1,6}\s+)/.exec(line);
  if (heading) {
    return [
      { text: heading[0], kind: "marker" },
      ...inlineSpans(line.slice(heading[0].length), "heading"),
    ];
  }

  if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
    return [{ text: line, kind: "marker" }];
  }

  const quote = /^(\s*>\s?)/.exec(line);
  if (quote) {
    return [
      { text: quote[0], kind: "marker" },
      ...inlineSpans(line.slice(quote[0].length), "quote"),
    ];
  }

  const bullet = /^(\s*[-*+]\s)/.exec(line);
  if (bullet) {
    return [
      { text: bullet[0], kind: "marker" },
      ...inlineSpans(line.slice(bullet[0].length), "plain"),
    ];
  }

  const ordered = /^(\s*\d+[.)]\s)/.exec(line);
  if (ordered) {
    return [
      { text: ordered[0], kind: "marker" },
      ...inlineSpans(line.slice(ordered[0].length), "plain"),
    ];
  }

  return inlineSpans(line, "plain");
}

function tokenize(markdown: string): Span[] {
  const spans: Span[] = [];

  markdown.split("\n").forEach((line, index) => {
    if (index > 0) spans.push({ text: "\n", kind: "plain" });
    spans.push(...lineSpans(line));
  });

  return spans;
}

interface MarkdownWriteSurfaceProps {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  hidden?: boolean;
  /** Off gives the plain textarea back, syntax and all. */
  styled?: boolean;
}

const shared =
  "w-full rounded-b-md border border-border px-4 py-4 font-mono text-[0.9rem] leading-[1.75] whitespace-pre-wrap break-words";

export function MarkdownWriteSurface({
  id,
  name,
  value,
  onChange,
  placeholder,
  rows = 22,
  hidden,
  styled = true,
}: MarkdownWriteSurfaceProps) {
  const mirror = useRef<HTMLDivElement>(null);
  const spans = useMemo(() => (styled ? tokenize(value) : []), [value, styled]);
  const showPlaceholder = styled && !value && placeholder;

  return (
    <div className={cn("relative", hidden && "hidden")}>
      {styled && (
        <div
          ref={mirror}
          aria-hidden
          className={cn(
            shared,
            "pointer-events-none absolute inset-0 overflow-hidden border-transparent",
          )}
        >
          {spans.map((span, index) => (
            <span key={index} className={kindClass[span.kind]}>
              {span.text}
            </span>
          ))}
          {showPlaceholder && (
            <span className="whitespace-pre-wrap text-muted-foreground/70">{placeholder}</span>
          )}
          {/* Keeps a trailing empty line from collapsing out of the mirror. */}
          {"​"}
        </div>
      )}

      <textarea
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (mirror.current) mirror.current.scrollTop = event.currentTarget.scrollTop;
        }}
        rows={rows}
        placeholder={styled ? undefined : placeholder}
        spellCheck
        className={cn(
          shared,
          "resize-y bg-card shadow-sm outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500",
          styled
            ? "relative block bg-transparent text-transparent caret-plum-600 [&::placeholder]:text-transparent [&::selection]:bg-gold-500/30"
            : "text-charcoal-700",
        )}
      />
    </div>
  );
}
