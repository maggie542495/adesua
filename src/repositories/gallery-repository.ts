import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { resolveImageUrl } from "@/lib/media/resolve-image";

export type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  alt_text: string | null;
  imageUrl: string;
  is_featured: boolean;
  sort_order: number;
};

type GalleryRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  alt_text: string | null;
  image_path: string;
  is_featured: boolean;
  sort_order: number;
};

/**
 * Published gallery items, newest-first by curation order. Images may live in
 * the repo (`/brand/…`) or in Supabase Storage (`gallery/…`) — `resolveImageUrl`
 * handles both, and rows whose path cannot be resolved are dropped rather
 * than rendered as broken frames.
 */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("gallery:published");

  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("gallery_items")
    .select(
      "id, title, description, category, alt_text, image_path, is_featured, sort_order",
    )
    .eq("status", "published")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return (data as GalleryRow[])
    .map((row) => {
      const imageUrl = resolveImageUrl(row.image_path);
      if (!imageUrl) return null;
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        category: row.category,
        alt_text: row.alt_text,
        imageUrl,
        is_featured: row.is_featured,
        sort_order: row.sort_order,
      } satisfies GalleryItem;
    })
    .filter((item): item is GalleryItem => item !== null);
}
