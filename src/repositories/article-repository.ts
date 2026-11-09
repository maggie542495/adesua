import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type PublishedArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  is_featured: boolean;
  category: { name: string; slug: string } | null;
};

export type ArticleCategory = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
};

type ArticleRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_path: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  is_featured: boolean;
  article_categories: { name: string; slug: string } | null;
};

export async function getPublishedArticles(
  limit = 12
): Promise<PublishedArticle[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("articles:published");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, cover_image_path, published_at, reading_time_minutes, is_featured, article_categories(name, slug)"
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return (data as unknown as ArticleRow[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    cover_image_path: row.cover_image_path,
    published_at: row.published_at,
    reading_time_minutes: row.reading_time_minutes,
    is_featured: row.is_featured,
    category: row.article_categories,
  }));
}

export type FullArticle = PublishedArticle & {
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_path: string | null;
  updated_at: string;
};

type FullArticleRow = ArticleRow & {
  body: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_path: string | null;
  updated_at: string;
};

/** One published article, body included, for the public reading page. */
export async function getArticleBySlug(slug: string): Promise<FullArticle | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, excerpt, body, cover_image_path, published_at, reading_time_minutes, is_featured, seo_title, seo_description, seo_image_path, updated_at, article_categories(name, slug)",
    )
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as FullArticleRow;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    cover_image_path: row.cover_image_path,
    published_at: row.published_at,
    reading_time_minutes: row.reading_time_minutes,
    is_featured: row.is_featured,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    seo_image_path: row.seo_image_path,
    updated_at: row.updated_at,
    category: row.article_categories,
  };
}

export async function getArticleCategories(): Promise<ArticleCategory[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("articles:categories");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("article_categories")
    .select("id, slug, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as ArticleCategory[];
}
