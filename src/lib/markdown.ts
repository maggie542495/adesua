/**
 * A deliberately small Markdown renderer for article bodies.
 *
 * Supports what a writer actually uses in a blog post — headings, emphasis,
 * links, images, lists, quotes, tables, rules, inline code and fenced blocks —
 * and escapes everything else. No raw HTML passes through, so an article body
 * can never inject markup into the page.
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

type TableAlign = "left" | "center" | "right";

/** Split a table row into cells, honouring `\|` escapes. */
function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|") && !trimmed.endsWith("\\|")) trimmed = trimmed.slice(0, -1);

  const cells: string[] = [];
  let current = "";

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (char === "\\" && trimmed[index + 1] === "|") {
      current += "|";
      index += 1;
      continue;
    }
    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

/** Returns the column alignments when `line` is a table delimiter row. */
function tableAlignments(line: string): TableAlign[] | null {
  if (!line.includes("|") || !line.includes("-")) return null;

  const cells = splitTableRow(line);
  if (cells.length === 0) return null;

  const aligns: TableAlign[] = [];
  for (const rawCell of cells) {
    const cell = rawCell.trim();
    if (!/^:?-{3,}:?$/.test(cell)) return null;
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    aligns.push(left && right ? "center" : right ? "right" : "left");
  }

  return aligns;
}

function isTableStart(lines: string[], index: number): boolean {
  const header = lines[index];
  const delimiter = lines[index + 1];
  if (!header?.includes("|") || !delimiter?.includes("|")) return false;
  return tableAlignments(delimiter) !== null;
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

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
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

    if (isTableStart(lines, index)) {
      flushParagraph();
      flushList();
      flushQuote();

      const headers = splitTableRow(line);
      const aligns = tableAlignments(lines[index + 1]) ?? [];
      const rows: string[][] = [];

      let cursor = index + 2;
      while (cursor < lines.length && lines[cursor].trim() && lines[cursor].includes("|")) {
        rows.push(splitTableRow(lines[cursor]));
        cursor += 1;
      }

      const cell = (tag: "th" | "td", value: string, column: number) =>
        `<${tag} style="text-align:${aligns[column] ?? "left"}">${inline(value)}</${tag}>`;

      const head = headers
        .map((header, column) => cell("th", header, column))
        .join("");
      const body = rows
        .map(
          (row) =>
            `<tr>${headers
              .map((_header, column) => cell("td", row[column] ?? "", column))
              .join("")}</tr>`,
        )
        .join("");

      html.push(
        `<div class="article-table"><table><thead><tr>${head}</tr></thead>${
          body ? `<tbody>${body}</tbody>` : ""
        }</table></div>`,
      );

      index = cursor - 1;
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
