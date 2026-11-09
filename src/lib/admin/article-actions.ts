"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/session";
import { readingTime } from "@/lib/markdown";
import { slugify } from "@/lib/admin/slug";
import type { SaveState } from "@/lib/admin/actions";

/**
 * The article editor is bespoke rather than the generic record form, because
 * an article is the one record whose shape the writer actually works in: a
 * long Markdown body, a slug that follows the title, a cover image that has to
 * be seen before it is published, and a publish date that is bookkeeping they
 * should not have to stamp by hand.
 */

const CONTENT_STATUS = ["draft", "scheduled", "published", "unpublished"] as const;

/** Storage bucket the studio uploads into. Public, image-only, 10 MB cap. */
const MEDIA_BUCKET = "media";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

interface ArticleInput {
  title: string;
  slug: string;
  status: string;
  excerpt: string | null;
  body: string | null;
  category_id: string | null;
  cover_image_path: string | null;
  is_featured: boolean;
  reading_time_minutes: number | null;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_path: string | null;
}

function readInput(formData: FormData): ArticleInput {
  const body = text(formData, "body");
  const status = text(formData, "status");
  const publishedRaw = text(formData, "published_at");

  return {
    title: text(formData, "title"),
    slug: slugify(text(formData, "slug")) || slugify(text(formData, "title")),
    status: (CONTENT_STATUS as readonly string[]).includes(status) ? status : "draft",
    excerpt: text(formData, "excerpt") || null,
    body: body || null,
    category_id: text(formData, "category_id") || null,
    cover_image_path: text(formData, "cover_image_path") || null,
    is_featured: formData.get("is_featured") === "true" || formData.get("is_featured") === "on",
    // The writer can override, but the body normally decides this.
    reading_time_minutes: body ? readingTime(body) : null,
    published_at: publishedRaw ? new Date(publishedRaw).toISOString() : null,
    seo_title: text(formData, "seo_title") || null,
    seo_description: text(formData, "seo_description") || null,
    seo_image_path: text(formData, "seo_image_path") || null,
  };
}

function validate(input: ArticleInput): string | null {
  if (input.title.length < 2) return "Give the article a title.";
  if (!input.slug) return "The slug is empty — add a title or write one by hand.";
  if (input.seo_title && input.seo_title.length > 70)
    return "SEO titles are cut off after about 70 characters.";
  return null;
}

/** Publishing stamps the date; scheduling honours what was chosen. */
function withPublishing(input: ArticleInput): ArticleInput {
  if (input.status === "published" && !input.published_at) {
    input.published_at = new Date().toISOString();
  }
  return input;
}

/**
 * A slug is the public URL, so two articles cannot share one. In a fresh
 * article the slug comes from the title, which is often already taken — append
 * a counter rather than failing the save.
 */
async function uniqueSlug(slug: string, exceptId?: string): Promise<string> {
  const supabase = await createClient();
  const base = slug || "article";

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    let query = supabase.from("articles").select("id").eq("slug", candidate).limit(1);
    if (exceptId) query = query.neq("id", exceptId);
    const { data } = await query;

    if (!data || data.length === 0) return candidate;
  }

  return `${base}-${Date.now()}`;
}

/**
 * The public pages cache the article list under these tags. `updateTag` expires
 * them immediately rather than serving stale content first, so an editor sees
 * the article they just published the moment they look at the site.
 */
function revalidateArticles(id?: string) {
  updateTag("articles:published");
  updateTag("articles:categories");
  revalidatePath("/insights");
  revalidatePath("/admin/articles");
  if (id) revalidatePath(`/admin/articles/${id}`);
  revalidatePath("/", "layout");
}

export async function createArticle(
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin("editor");

  const input = withPublishing(readInput(formData));
  const problem = validate(input);
  if (problem) return { status: "error", message: problem };

  const slug = await uniqueSlug(input.slug);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .insert({ ...input, slug } as never)
    .select("id")
    .single();

  if (error) return { status: "error", message: error.message };

  revalidateArticles();
  redirect(`/admin/articles/${(data as { id: string }).id}?saved=1`);
}

export async function updateArticle(
  id: string,
  _previous: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin("editor");

  const input = withPublishing(readInput(formData));
  const problem = validate(input);
  if (problem) return { status: "error", message: problem };

  const slug = await uniqueSlug(input.slug, id);
  const supabase = await createClient();

  const { error } = await supabase
    .from("articles")
    .update({ ...input, slug } as never)
    .eq("id", id);

  if (error) return { status: "error", message: error.message };

  revalidateArticles(id);
  return { status: "saved", message: "Article saved." };
}

export async function deleteArticle(id: string) {
  await requireAdmin("administrator");
  const supabase = await createClient();
  await supabase.from("articles").delete().eq("id", id);

  revalidateArticles();
  redirect("/admin/articles");
}

export interface UploadState {
  ok: boolean;
  /** Stored value — what goes into `cover_image_path`. */
  path?: string;
  message?: string;
}

/**
 * Uploads a cover straight to the public `media` bucket and hands back the
 * storage path to save. Nothing is uploaded when the file is the wrong kind or
 * too large, so a bad pick cannot half-publish an article.
 */
export async function uploadArticleCover(
  _previous: UploadState,
  formData: FormData,
): Promise<UploadState> {
  await requireAdmin("editor");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Choose an image first." };
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, message: "Use a JPG, PNG, WebP, AVIF or GIF." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Images need to be under 10 MB." };
  }

  const extension = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const stem = slugify(file.name.replace(/\.[^.]+$/, "")) || "cover";
  const objectPath = `articles/cover/${stem}-${Date.now().toString(36)}.${extension}`;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(objectPath, file, { contentType: file.type, upsert: false });

    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The upload failed.",
    };
  }

  // Bucket name included, because that is what the public URL is built from.
  return { ok: true, path: `${MEDIA_BUCKET}/${objectPath}` };
}
