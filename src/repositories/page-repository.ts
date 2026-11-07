import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type PublicPage = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_image_path: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_path: string | null;
};

export type PublicPageSection = {
  id: string;
  section_key: string;
  sort_order: number;
  title: string | null;
  body: string | null;
  media: Record<string, unknown>;
  config: Record<string, unknown>;
};

export async function getPublishedPage(slug: string): Promise<PublicPage | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`page:${slug}`);

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("pages")
    .select(
      "id, slug, title, description, hero_image_path, seo_title, seo_description, seo_image_path"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicPage;
}

export async function getPublishedPageSections(
  pageId: string
): Promise<PublicPageSection[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag(`page:${pageId}:sections`);

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("page_sections")
    .select("id, section_key, sort_order, title, body, media, config")
    .eq("page_id", pageId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as PublicPageSection[];
}

export async function getPublicSiteSettings(): Promise<Record<string, string>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("site_settings:public");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .eq("is_public", true);

  if (error || !data) return {};

  const settings: Record<string, string> = {};
  for (const row of data as { key: string; value: unknown }[]) {
    const value = row.value;
    if (typeof value === "string") {
      settings[row.key] = value;
    } else if (value == null) {
      settings[row.key] = "";
    } else {
      settings[row.key] = JSON.stringify(value);
    }
  }
  return settings;
}

export function parseJsonObject(raw: string | undefined | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}
