/**
 * A deliberately small Markdown renderer for article bodies.
 *
 * Supports what a writer actually uses in a blog post — headings, emphasis,
 * links, images, lists, quotes, rules, inline code and fenced blocks — and
 * escapes everything else. No raw HTML passes through, so an article body can
 * never inject markup into the page.
 */
import { resolveImageUrl } from "@/lib/media/resolve-image";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inline(text: string): string {
  let out = escapeHtml(text);

  // Images before links: ![alt](src). A bare storage path — what the editor
  // uploads, e.g. media/articles/cover/x.jpg — is turned into a public URL,
  // so a writer never has to paste the Supabase host into the body.
  out = out.replace(
    /!\[([^\]]*)\]\(([^)\s]+)\)/g,
    (_match, alt: string, src: string) => {
      const resolved = resolveImageUrl(src) ?? src;
      return `<img src="${resolved}" alt="${alt}" loading="lazy" class="my-8 w-full rounded-xl border border-border object-cover" />`;
    },
  );

  out = out.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    (_match, label: string, href: string) =>
      `<a href="${href}" class="font-medium text-gold-700 underline decoration-gold-400/60 underline-offset-4 transition hover:text-plum-600">${label}</a>`,
  );

  out = out.replace(/`([^`]+)`/g, '<code class="rounded bg-ivory-300 px-1.5 py-0.5 text-[0.9em]">$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>");

  return out;
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];

  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let inCode = false;
  let codeLines: string[] = [];
  let quote: string[] = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  const flushQuote = () => {
    if (!quote.length) return;
    html.push(`<blockquote>${inline(quote.join(" "))}</blockquote>`);
    quote = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.trim().startsWith("```")) {
      if (inCode) {
        html.push(
          `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`,
        );
        codeLines = [];
        inCode = false;
      } else {
        flushParagraph();
        flushList();
        flushQuote();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      flushQuote();
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      flushQuote();
      const level = Math.min(heading[1].length + 1, 5);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushParagraph();
      flushList();
      flushQuote();
      html.push("<hr />");
      continue;
    }

    const quoteMatch = /^>\s?(.*)$/.exec(line);
    if (quoteMatch) {
      flushParagraph();
      flushList();
      quote.push(quoteMatch[1]);
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushQuote();
      if (listType !== "ul") {
        flushList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    const ordered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listType !== "ol") {
        flushList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inline(ordered[1])}</li>`);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(line.trim());
  }

  if (inCode && codeLines.length) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  flushParagraph();
  flushList();
  flushQuote();

  return html.join("\n");
}

/** Rough reading time for a body, in whole minutes (min 1). */
export function readingTime(source: string): number {
  const words = source.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
