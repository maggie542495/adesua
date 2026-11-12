"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CircleDashed,
  ImagePlus,
  Loader2,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import type { FieldDef } from "@/lib/admin/schema";
import type { SaveState } from "@/lib/admin/actions";
import { uploadGalleryImage } from "@/lib/admin/gallery-actions";
import { resolveImageUrl } from "@/lib/media/resolve-image";
import { cn } from "@/lib/utils";

/**
 * The gallery editor is bespoke rather than the generic record form because a
 * photograph is the record: it has to be dropped in, seen at the size the
 * public grid shows it, and checked against what is still missing before it
 * goes out. The generic form could only offer a text box for a file path.
 */

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";
const labelClass = "block text-sm font-medium text-foreground";

interface GalleryEditorProps {
  action: (prev: SaveState, formData: FormData) => Promise<SaveState>;
  deleteAction?: (formData: FormData) => Promise<void>;
  fields: readonly FieldDef[];
  item: Record<string, unknown> | null;
  title: string;
  listPath: string;
  isNew: boolean;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function SaveButton({ isNew }: { isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 shadow-sm transition hover:bg-plum-600 disabled:opacity-70"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {pending ? "Saving…" : isNew ? "Add to gallery" : "Save changes"}
    </button>
  );
}

export function GalleryEditor({
  action,
  deleteAction,
  fields,
  item,
  title,
  listPath,
  isNew,
}: GalleryEditorProps) {
  const [state, formAction] = useActionState(action, { status: "idle" });
  const reduceMotion = useReducedMotion();

  const [title_, setTitle] = useState(str(item?.title));
  const [imagePath, setImagePath] = useState(str(item?.image_path));
  const [altText, setAltText] = useState(str(item?.alt_text));
  const [description, setDescription] = useState(str(item?.description));
  const [category, setCategory] = useState(str(item?.category) || "Professional");
  const [status, setStatus] = useState(str(item?.status) || "draft");
  const [featured, setFeatured] = useState(Boolean(item?.is_featured));
  const [sortOrder, setSortOrder] = useState(str(item?.sort_order) || "0");

  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();

  const fileRef = useRef<HTMLInputElement>(null);

  const imageUrl = resolveImageUrl(imagePath);
  const categoryOptions = fields.find((field) => field.name === "category")?.options ?? [];
  const statusOptions = fields.find((field) => field.name === "status")?.options ?? ["draft"];

  function handleFile(file: File | undefined) {
    if (!file) return;
    setUploadError(null);
    setUploadNotice(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("That file is not an image. Use a JPG, PNG, WebP, AVIF or GIF.");
      return;
    }

    const data = new FormData();
    data.set("file", file);

    startUpload(async () => {
      const result = await uploadGalleryImage(data);
      if (result.ok && result.path) {
        setImagePath(result.path);
        setUploadNotice("Photograph stored. It saves with the item below.");
      } else {
        setUploadError(result.message ?? "The upload failed.");
      }
    });
  }

  const checklist = [
    { label: "Photograph attached", done: Boolean(imageUrl) },
    { label: "Alt text written", done: altText.trim().length > 3 },
    { label: "Category chosen", done: Boolean(category) },
    { label: "Published to the site", done: status === "published" },
  ];
  const ready = checklist.slice(0, 3).every((check) => check.done);

  const panels = [
    <SectionPanel key="photo" title="Photograph" description="Drop a file in, or point at one already stored.">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFile(event.dataTransfer.files?.[0]);
        }}
        className="relative"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />

        <AnimatePresence mode="wait" initial={false}>
          {imageUrl ? (
            <motion.div
              key="preview"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "group relative aspect-[4/3] overflow-hidden rounded-xl border bg-ivory-200 transition",
                dragging ? "border-gold-500 ring-2 ring-gold-500/40" : "border-border",
              )}
            >
              <Image
                src={imageUrl}
                alt={altText || title_ || "Gallery photograph"}
                fill
                sizes="(min-width: 1280px) 40rem, 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-plum-900/80 to-transparent px-3 pb-3 pt-10">
                <p className="truncate text-[0.68rem] font-medium text-ivory-100/90">
                  {dragging ? "Drop to replace" : imagePath.split("/").pop()}
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="rounded-md bg-ivory-200/95 px-2.5 py-1.5 text-[0.68rem] font-semibold text-plum-600 transition hover:bg-ivory-100"
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImagePath("");
                      setUploadNotice(null);
                    }}
                    aria-label="Remove photograph"
                    className="rounded-md bg-ivory-200/95 p-1.5 text-destructive transition hover:bg-ivory-100"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="empty"
              type="button"
              onClick={() => fileRef.current?.click()}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              whileHover={reduceMotion ? undefined : { scale: 1.005 }}
              className={cn(
                "flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 text-center transition",
                dragging
                  ? "border-gold-500 bg-gold-500/10 ring-2 ring-gold-500/40"
                  : "border-plum-500/25 bg-ivory-100 hover:border-gold-400 hover:bg-gold-500/5",
              )}
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full bg-card text-gold-700 shadow-sm transition",
                  dragging && "scale-110",
                )}
              >
                {dragging ? (
                  <UploadCloud className="size-5" aria-hidden />
                ) : (
                  <ImagePlus className="size-5" aria-hidden />
                )}
              </span>
              <span className="font-display text-lg text-plum-600">
                {dragging ? "Drop it here" : "Drop a photograph"}
              </span>
              <span className="text-xs leading-relaxed text-muted-foreground">
                or click to browse · JPG, PNG, WebP, AVIF or GIF · up to 10 MB
              </span>
            </motion.button>
          )}
        </AnimatePresence>

        {uploading && (
          <div
            role="status"
            className="absolute inset-x-3 bottom-3 overflow-hidden rounded-full bg-plum-900/70 px-3 py-1.5"
          >
            <motion.span
              className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gold-400/80"
              animate={reduceMotion ? undefined : { x: ["-110%", "330%"] }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-ivory-100">
              Uploading…
            </span>
          </div>
        )}
      </div>

      {uploadError && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {uploadError}
        </p>
      )}
      {uploadNotice && (
        <p role="status" className="mt-2 text-xs text-gold-800">
          {uploadNotice}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <div>
          <label htmlFor="gallery-alt" className={labelClass}>
            Alt text
          </label>
          <input
            id="gallery-alt"
            name="alt_text"
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder="Adesua speaking to a room of customer experience leaders"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            What a screen reader says instead of the photograph. Falls back to the title.
          </p>
        </div>

        <div>
          <label htmlFor="gallery-caption" className={labelClass}>
            Caption
          </label>
          <textarea
            id="gallery-caption"
            name="description"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="A line of context shown under the photograph."
            className={inputClass}
          />
        </div>
      </div>

      <details className="mt-4 rounded-lg border border-border bg-ivory-100 px-3 py-2">
        <summary className="cursor-pointer text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Use a stored path or URL instead
        </summary>
        <input
          id="gallery-path"
          value={imagePath}
          onChange={(event) => setImagePath(event.target.value)}
          placeholder="media/gallery/workshop-2025.jpg or /brand/portrait.jpg"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Uploading stores a media path. The public URL is resolved automatically, so do not paste one
          here.
        </p>
      </details>
    </SectionPanel>,

    <SectionPanel
      key="details"
      title="Details"
      description="Where it sits in the public gallery, and who sees it."
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="gallery-title" className={labelClass}>
            Title <span className="text-destructive">*</span>
          </label>
          <input
            id="gallery-title"
            name="title"
            required
            value={title_}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Facilitating a leadership offsite"
            className={inputClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gallery-category" className={labelClass}>
              Category
            </label>
            <select
              id="gallery-category"
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={inputClass}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Drives the filter chips on the public gallery.
            </p>
          </div>

          <div>
            <label htmlFor="gallery-status" className={labelClass}>
              Status
            </label>
            <select
              id="gallery-status"
              name="status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={inputClass}
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Only published photographs appear on the site.
            </p>
          </div>

          <div>
            <label htmlFor="gallery-order" className={labelClass}>
              Order
            </label>
            <input
              id="gallery-order"
              name="sort_order"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-muted-foreground">Lower numbers appear first.</p>
          </div>

          <div>
            <span className={labelClass}>Featured</span>
            <input type="hidden" name="is_featured" value={featured ? "true" : "false"} />
            <button
              type="button"
              onClick={() => setFeatured((value) => !value)}
              aria-pressed={featured}
              className={cn(
                "mt-1.5 flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm transition",
                featured
                  ? "border-gold-500 bg-gold-500/10 text-gold-800"
                  : "border-border bg-card text-muted-foreground hover:text-plum-600",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <Star className={cn("size-4", featured && "fill-gold-500 text-gold-600")} aria-hidden />
                {featured ? "Leads the grid" : "Not featured"}
              </span>
              <span
                aria-hidden
                className={cn(
                  "relative h-4 w-7 rounded-full transition",
                  featured ? "bg-gold-500" : "bg-plum-500/20",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 size-3 rounded-full bg-card shadow transition-all",
                    featured ? "left-3.5" : "left-0.5",
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </div>
    </SectionPanel>,
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={listPath}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold-700 hover:text-gold-600"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to gallery
          </Link>
          <h1 className="mt-2 font-display text-3xl font-medium text-plum-600">{title}</h1>
        </div>

        {deleteAction && (
          <form action={deleteAction}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          </form>
        )}
      </div>

      {state.status === "saved" && (
        <p className="flex items-center gap-2 rounded-lg border border-gold-400/50 bg-gold-500/10 px-4 py-3 text-sm text-gold-800">
          <Check className="size-4" aria-hidden />
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

      <form action={formAction} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <input type="hidden" name="image_path" value={imagePath} />

        <div className="space-y-6">
          {panels.map((panel, index) => (
            <motion.div
              key={index}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              {panel}
            </motion.div>
          ))}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold-700">
                <Sparkles className="size-3.5" aria-hidden />
                Public preview
              </div>

              <article className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="relative aspect-[4/3] bg-ivory-200">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      sizes="21rem"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No photograph yet
                    </div>
                  )}

                  {category && (
                    <span className="absolute left-2 top-2 rounded-full bg-plum-500/90 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-ivory-100">
                      {category}
                    </span>
                  )}
                  {featured && (
                    <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-gold-500 text-ink">
                      <Star className="size-3 fill-current" aria-hidden />
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <p className="font-display text-sm leading-snug text-plum-600">
                    {title_ || "Untitled photograph"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[0.7rem] leading-relaxed text-muted-foreground">
                    {description || altText || "No caption yet."}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
                    <span>{status}</span>
                    <span>#{sortOrder || "0"}</span>
                  </div>
                </div>
              </article>

              <p className="mt-3 text-[0.65rem] leading-relaxed text-muted-foreground">
                How this photograph appears on the public gallery. Featured items lead the grid.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-gold-700">
              Before it goes out
            </p>
            <ul className="mt-3 space-y-2">
              {checklist.map((check) => (
                <li key={check.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                      check.done
                        ? "border-gold-500 bg-gold-500 text-ink"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {check.done ? (
                      <Check className="size-2.5" aria-hidden />
                    ) : (
                      <CircleDashed className="size-2.5" aria-hidden />
                    )}
                  </span>
                  <span className={check.done ? "text-charcoal-700" : "text-muted-foreground"}>
                    {check.label}
                  </span>
                </li>
              ))}
            </ul>
            <p
              className={cn(
                "mt-3 rounded-md px-2.5 py-2 text-[0.65rem] leading-relaxed",
                ready
                  ? "bg-gold-500/10 text-gold-800"
                  : "bg-ivory-100 text-muted-foreground",
              )}
            >
              {ready
                ? "Ready to save. Set the status to published when you want it live."
                : "A photograph, alt text and a category are what make an item publishable."}
            </p>
          </motion.div>
        </aside>

        <div className="flex items-center gap-3 border-t border-border pt-5 xl:col-span-2">
          <SaveButton isNew={isNew} />
          <Link href={listPath} className="text-sm text-muted-foreground hover:text-plum-600">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function SectionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-display text-base font-medium text-plum-600">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
