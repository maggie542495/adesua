import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type HomepageContent = {
  hero_eyebrow: string | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  hero_body: string | null;
  hero_cta_primary_label: string | null;
  hero_cta_primary_href: string | null;
  hero_cta_secondary_label: string | null;
  hero_cta_secondary_href: string | null;
  featured_image_path: string | null;
  sections: unknown[];
};

export async function getHomepageContent(): Promise<HomepageContent | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("homepage:content");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("homepage_content")
    .select(
      "hero_eyebrow, hero_headline, hero_subheadline, hero_body, hero_cta_primary_label, hero_cta_primary_href, hero_cta_secondary_label, hero_cta_secondary_href, featured_image_path, sections"
    )
    .maybeSingle();

  if (error || !data) return null;
  return data as HomepageContent;
}
