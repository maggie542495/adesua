import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

export type PublishedService = {
  id: string;
  slug: string;
  pathway: "personal-growth" | "professional-impact";
  title: string;
  summary: string | null;
  body: string | null;
  icon: string | null;
  sort_order: number;
};

export async function getPublishedServices(): Promise<PublishedService[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("services:published");

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, slug, pathway, title, summary, body, icon, sort_order")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return data as PublishedService[];
}
