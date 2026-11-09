"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useActionState,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  Bold,
  CheckCircle2,
  Clock,
  ExternalLink,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Minus,
  Quote,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { SaveState } from "@/lib/admin/actions";
import type { UploadState } from "@/lib/admin/article-actions";
import { uploadArticleCover } from "@/lib/admin/article-actions";
import { slugify } from "@/lib/admin/slug";
import { readingTime, renderMarkdown } from "@/lib/markdown";
import { resolveImageUrl } from "@/lib/media/resolve-image";
import { cn } from "@/lib/utils";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 disabled:bg-ivory-200 disabled:text-muted-foreground";
const labelClass = "block text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground";

/** The body textarea the Markdown toolbar edits. */
const BODY_ID = "article-body";

const STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "unpublished", label: "Unpublished" },
];

export interface ArticleCategoryOption {
  id: string;
  name: string;
}

export interface ArticleEditorProps {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  deleteAction?: () => Promise<void>;
  article: Record<string, unknown> | null;
  categories: readonly ArticleCategoryOption[];
  isNew: boolean;
  listPath: string;
}

function str(value: unknown): string {
  return value === null || value === undefined ? "" : String(value);
}

function localDateTime(value: unknown): string {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : isNew ? "Create article" : "Save changes"}
    </button>
  );
}

function Panel({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn("rounded-2xl border border-border bg-card p-5 shadow-sm", className)}
    >
      <h2 className="font-display text-base font-medium text-plum-600">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ArticleEditor({
  action,
  deleteAction,
  article,
  categories,
  isNew,
  listPath,
}: ArticleEditorProps) {
  const [state, formAction] = useActionState(action, { status: "idle" });

  const [title, setTitle] = useState(str(article?.title));
  const [slug, setSlug] = useState(str(article?.slug));
  const [slugTouched, setSlugTouched] = useState(Boolean(article?.slug));
  const [status, setStatus] = useState(str(article?.status) || "draft");
  const [categoryId, setCategoryId] = useState(str(article?.category_id));
  const [excerpt, setExcerpt] = useState(str(article?.excerpt));
  const [body, setBody] = useState(str(article?.body));
  const [cover, setCover] = useState(str(article?.cover_image_path));
  const [coverError, setCoverError] = useState<string | null>(null);
  const [seoTitle, setSeoTitle] = useState(str(article?.seo_title));
  const [seoDescription, setSeoDescription] = useState(str(article?.seo_description));
  const [seoImage, setSeoImage] = useState(str(article?.seo_image_path));
  const [publishedAt, setPublishedAt] = useState(localDateTime(article?.published_at));
  const [featured, setFeatured] = useState(Boolean(article?.is_featured));

  const [tab, setTab] = useState<"write" | "preview">("write");
  const [insert, setInsert] = useState<"image" | "link" | null>(null);
  const [insertUrl, setInsertUrl] = useState("");
  const [insertAlt, setInsertAlt] = useState("");
  const [uploading, startUpload] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);

  const effectiveSlug = slugTouched ? slug : slugify(title);
  const minutes = useMemo(() => readingTime(body), [body]);
  const preview = useMemo(() => renderMarkdown(body), [body]);
  const coverUrl = resolveImageUrl(cover);
  const publicHref = effectiveSlug ? `/insights/${effectiveSlug}` : null;

  function handleTitle(next: string) {
    setTitle(next);
    if (!slugTouched) setSlug(slugify(next));
  }

  /**
   * Applies an edit to the body textarea, keeping the cursor where it was.
   *
   * The element is looked up by id at call time rather than held in a ref. The
   * toolbar buttons close over this function while rendering, and the React
   * compiler rejects a ref read reached from a value built during render —
   * correctly, since a ref read there is a value render cannot depend on.
   */
  function editBody(transform: (value: string, start: number, end: number) => {
    value: string;
    selectionStart: number;
    selectionEnd: number;
  }) {
    const element = document.getElementById(BODY_ID) as HTMLTextAreaElement | null;
    if (!element) return;

    const next = transform(element.value, element.selectionStart, element.selectionEnd);
    setBody(next.value);
    setTab("write");

    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(next.selectionStart, next.selectionEnd);
    });
  }

  function wrap(marker: string, placeholder: string) {
    editBody((value, start, end) => {
      const selected = value.slice(start, end) || placeholder;
      return {
        value: value.slice(0, start) + marker + selected + marker + value.slice(end),
        selectionStart: start + marker.length,
        selectionEnd: start + marker.length + selected.length,
      };
    });
  }

  /** Prefixes every line the selection touches — headings, lists, quotes. */
  function prefixLines(marker: string) {
    editBody((value, start, end) => {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const block = value.slice(lineStart, Math.max(end, lineStart)) || "";
      const lines = block.split("\n");
      const prefixed = lines
        .map((line, index) => {
          if (marker === "1. ") return `${index + 1}. ${line.replace(/^\d+\.\s*/, "")}`;
          return line.startsWith(marker) ? line.slice(marker.length) : marker + line;
        })
        .join("\n");

      return {
        value: value.slice(0, lineStart) + prefixed + value.slice(lineStart + block.length),
        selectionStart: lineStart,
        selectionEnd: lineStart + prefixed.length,
      };
    });
  }

  function insertSnippet(snippet: string, cursorOffset?: number) {
    editBody((value, start, end) => {
      const after = value.slice(end);
      const needsBreak = start > 0 && !value.slice(0, start).endsWith("\n\n");
      const prefix = needsBreak ? "\n\n" : "";
      const at = start + prefix.length + (cursorOffset ?? snippet.length);
      return {
        value: value.slice(0, start) + prefix + snippet + after,
        selectionStart: at,
        selectionEnd: at,
      };
    });
  }

  function applyInsert() {
    const url = insertUrl.trim();
    if (!url) return;

    if (insert === "image") {
      const alt = insertAlt.trim() || "Image";
      insertSnippet(`![${alt}](${url})`);
    } else {
      const label = insertAlt.trim() || "link";
      insertSnippet(`[${label}](${url})`);
    }

    setInsert(null);
    setInsertUrl("");
    setInsertAlt("");
  }

  function handleCoverFile(file: File) {
    setCoverError(null);
    const data = new FormData();
    data.set("file", file);

    startUpload(async () => {
      const result: UploadState = await uploadArticleCover({ ok: false }, data);
      if (result.ok && result.path) {
        setCover(result.path);
        if (!seoImage) setSeoImage(result.path);
      } else {
        setCoverError(result.message ?? "The upload failed.");
      }
    });
  }

  const toolbar: { label: string; icon: ReactNode; run: () => void }[] = [
    { label: "Bold", icon: <Bold className="size-4" />, run: () => wrap("**", "bold text") },
    { label: "Italic", icon: <Italic className="size-4" />, run: () => wrap("*", "italic text") },
    { label: "Heading", icon: <Heading2 className="size-4" />, run: () => prefixLines("## ") },
    { label: "Subheading", icon: <Heading3 className="size-4" />, run: () => prefixLines("### ") },
    { label: "Bulleted list", icon: <List className="size-4" />, run: () => prefixLines("- ") },
    {
      label: "Numbered list",
      icon: <ListOrdered className="size-4" />,
      run: () => prefixLines("1. "),
    },
    { label: "Quote", icon: <Quote className="size-4" />, run: () => prefixLines("> ") },
    {
      label: "Link",
      icon: <Link2 className="size-4" />,
      run: () => {
        setInsert("link");
        setInsertUrl("");
        setInsertAlt("");
      },
    },
    {
      label: "Image",
      icon: <ImagePlus className="size-4" />,
      run: () => {
        setInsert("image");
        setInsertUrl("");
        setInsertAlt("");
      },
    },
    {
      label: "Divider",
      icon: <Minus className="size-4" />,
      run: () => insertSnippet("---"),
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={listPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to insights
          </Link>
          <h1 className="mt-2 font-display text-3xl font-medium text-plum-600">
            {isNew ? "New article" : title || "Untitled article"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && publicHref && status === "published" && (
            <Link
              href={publicHref}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-charcoal-700 transition hover:border-gold-400 hover:text-plum-600"
            >
              <ExternalLink className="size-3.5" aria-hidden />
              View live
            </Link>
          )}
          {deleteAction && (
            <form action={deleteAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Delete
              </button>
            </form>
          )}
        </div>
      </div>

      {state.status === "saved" && (
        <p className="flex items-center gap-2 rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.message}
        </p>
      )}
      {state.status === "error" && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      )}

      <form action={formAction} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <input type="hidden" name="cover_image_path" value={cover} />
        <input
          type="hidden"
          name="status"
          value={status}
        />

        {/* ── Main column ─────────────────────────────────────────── */}
        <div className="space-y-6">
          <Panel title="Title & slug">
            <input
              name="title"
              value={title}
              onChange={(event) => handleTitle(event.target.value)}
              placeholder="The headline"
              required
              className="w-full rounded-md border border-transparent bg-transparent px-0 py-1 font-display text-2xl font-medium text-plum-600 outline-none placeholder:text-muted-foreground/60 focus:border-b-gold-400"
            />

            <div className="mt-4">
              <label htmlFor="article-slug" className={labelClass}>
                Slug
              </label>
              <div className="mt-1.5 flex items-stretch overflow-hidden rounded-md border border-border bg-card shadow-sm focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500">
                <span className="flex items-center bg-ivory-200 px-3 text-xs text-muted-foreground">
                  /insights/
                </span>
                <input
                  id="article-slug"
                  name="slug"
                  value={effectiveSlug}
                  onChange={(event) => {
                    const next = event.target.value;
                    // Clearing the box hands control back to the title.
                    setSlugTouched(next.trim().length > 0);
                    setSlug(slugify(next));
                  }}
                  placeholder="a-slower-practice"
                  className="w-full border-0 bg-transparent px-3 py-2 text-sm text-foreground outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {slugTouched
                  ? "Write the URL yourself, or clear it to follow the title again."
                  : "Following the title. Edit it to take over."}
              </p>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <label htmlFor="article-excerpt" className={labelClass}>
                  Excerpt
                </label>
                <span className="text-[0.7rem] text-muted-foreground">
                  {excerpt.length}/300
                </span>
              </div>
              <textarea
                id="article-excerpt"
                name="excerpt"
                rows={3}
                maxLength={300}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder="One or two sentences for the cards and search results."
                className={inputClass}
              />
            </div>
          </Panel>

          <Panel
            title="Body"
            description="Markdown — the toolbar writes it for you."
          >
            <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-border bg-ivory-100 px-2 py-1.5">
              {toolbar.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.run}
                  title={item.label}
                  aria-label={item.label}
                  className="flex size-8 items-center justify-center rounded text-charcoal-700 transition hover:bg-card hover:text-plum-600"
                >
                  {item.icon}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-1 rounded-full bg-card p-0.5">
                {(["write", "preview"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTab(mode)}
                    aria-pressed={tab === mode}
                    className={cn(
                      "rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.1em] transition",
                      tab === mode
                        ? "bg-plum-500 text-ivory-200"
                        : "text-muted-foreground hover:text-plum-600",
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {insert && (
              <div className="flex flex-wrap items-end gap-2 border border-b-0 border-border bg-gold-500/8 px-3 py-2.5">
                <div className="min-w-[14rem] flex-1">
                  <label htmlFor="insert-url" className={labelClass}>
                    {insert === "image" ? "Image URL" : "Link URL"}
                  </label>
                  <input
                    id="insert-url"
                    value={insertUrl}
                    onChange={(event) => setInsertUrl(event.target.value)}
                    placeholder="https://…"
                    autoFocus
                    className={inputClass}
                  />
                </div>
                <div className="min-w-[10rem] flex-1">
                  <label htmlFor="insert-alt" className={labelClass}>
                    {insert === "image" ? "Alt text" : "Link text"}
                  </label>
                  <input
                    id="insert-alt"
                    value={insertAlt}
                    onChange={(event) => setInsertAlt(event.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={applyInsert}
                  className="rounded-md bg-plum-500 px-4 py-2 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => setInsert(null)}
                  aria-label="Cancel"
                  className="rounded-md border border-border p-2 text-muted-foreground transition hover:text-plum-600"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>
            )}

            {/* The textarea stays mounted in preview so the toolbar can still
                read and move the cursor; only its visibility changes. */}
            <textarea
              id={BODY_ID}
              name="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={22}
              placeholder={"## Open with a thought\n\nThen let it breathe. Blank lines become paragraphs."}
              className={cn(
                "w-full resize-y rounded-b-md border border-border bg-card px-4 py-4 font-mono text-[0.9rem] leading-[1.75] text-charcoal-700 shadow-sm outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500",
                tab === "preview" && "hidden",
              )}
            />

            {tab === "preview" && (
              <div className="rounded-b-md border border-border bg-card px-5 py-5">
                {body.trim() ? (
                  <div
                    className="article-body text-[1rem] leading-[1.8] text-charcoal-700"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nothing written yet — switch to Write and start.
                  </p>
                )}
              </div>
            )}

            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden />
              {minutes} min read · {body.trim() ? body.trim().split(/\s+/).length : 0} words
            </p>
          </Panel>

          <Panel title="Search appearance" description="What Google and social cards show.">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="article-seo-title" className={labelClass}>
                    SEO title
                  </label>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {seoTitle.length}/70
                  </span>
                </div>
                <input
                  id="article-seo-title"
                  name="seo_title"
                  value={seoTitle}
                  maxLength={70}
                  onChange={(event) => setSeoTitle(event.target.value)}
                  placeholder={title || "Defaults to the article title"}
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="article-seo-description" className={labelClass}>
                    SEO description
                  </label>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {seoDescription.length}/160
                  </span>
                </div>
                <textarea
                  id="article-seo-description"
                  name="seo_description"
                  rows={3}
                  maxLength={160}
                  value={seoDescription}
                  onChange={(event) => setSeoDescription(event.target.value)}
                  placeholder={excerpt || "Defaults to the excerpt"}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="article-seo-image" className={labelClass}>
                  Social image
                </label>
                <input
                  id="article-seo-image"
                  name="seo_image_path"
                  value={seoImage}
                  onChange={(event) => setSeoImage(event.target.value)}
                  placeholder="Falls back to the cover image"
                  className={inputClass}
                />
              </div>
            </div>
          </Panel>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <div className="space-y-6 lg:sticky lg:top-6">
          <Panel title="Publishing">
            <div className="space-y-3">
              <div>
                <label htmlFor="article-status" className={labelClass}>
                  Status
                </label>
                <select
                  id="article-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className={inputClass}
                >
                  {STATUSES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="article-published" className={labelClass}>
                  Publish date
                </label>
                <input
                  id="article-published"
                  name="published_at"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(event) => setPublishedAt(event.target.value)}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Left empty, publishing stamps today.
                </p>
              </div>

              <div>
                <label htmlFor="article-category" className={labelClass}>
                  Category
                </label>
                <select
                  id="article-category"
                  name="category_id"
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className={inputClass}
                >
                  <option value="">No category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 pt-1 text-sm text-charcoal-700">
                <input
                  type="checkbox"
                  name="is_featured"
                  value="true"
                  checked={featured}
                  onChange={(event) => setFeatured(event.target.checked)}
                  className="size-4 rounded border-border text-plum-500 focus:ring-gold-500"
                />
                Feature on the Insights page
              </label>
            </div>
          </Panel>

          <Panel title="Cover image">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-ivory-200">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt="Cover preview"
                  fill
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                  <ImagePlus className="size-6" aria-hidden />
                  <span className="text-xs">No cover yet</span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-band-3/50">
                  <Loader2 className="size-6 animate-spin text-on-band" aria-hidden />
                </div>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleCoverFile(file);
                event.target.value = "";
              }}
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold text-charcoal-700 transition hover:border-gold-400 hover:text-plum-600 disabled:opacity-60"
              >
                <Upload className="size-3.5" aria-hidden />
                {cover ? "Replace" : "Upload"}
              </button>
              {cover && (
                <button
                  type="button"
                  onClick={() => setCover("")}
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:text-destructive"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              value={cover}
              onChange={(event) => setCover(event.target.value)}
              placeholder="…or paste a path or URL"
              className={inputClass}
            />

            {coverError && (
              <p role="alert" className="mt-1 text-xs text-destructive">
                {coverError}
              </p>
            )}
          </Panel>
        </div>

        {/* ── Save bar ────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm lg:col-span-2">
          <SaveButton isNew={isNew} />
          <Link href={listPath} className="text-sm text-muted-foreground hover:text-plum-600">
            Cancel
          </Link>
          <span className="ml-auto text-xs text-muted-foreground">
            {status === "published" ? "Live on the site once saved." : `Currently ${status}.`}
          </span>
        </div>
      </form>
    </div>
  );
}
