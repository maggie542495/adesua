import type { Metadata } from "next";
import { PageHero } from "@/components/public/page-hero";
import { Section } from "@/components/public/section";
import { Reveal } from "@/components/public/reveal";
import { GalleryGrid } from "@/components/public/gallery-grid";
import { CTABanner } from "@/components/public/cta-banner";
import { getGalleryItems } from "@/repositories/gallery-repository";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Gallery",
  description: `A visual record of ${siteConfig.name}'s coaching, facilitation and speaking work.`,
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const items = await getGalleryItems();

  return (
    <>
      <PageHero
        eyebrow="Visual journey"
        title="Gallery"
        description="A glimpse into the work, the people, and the moments that shape better experiences."
      />

      <Section>
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <GalleryGrid items={items} />
          </Reveal>
        </div>
      </Section>

      <CTABanner
        title="Bring this energy to your team"
        description="Workshops, offsites and coaching programmes designed around the people in the room."
        primary={{ label: "Start a conversation", href: "/contact" }}
        secondary={{ label: "See the pathways", href: "/work-with-me" }}
      />
    </>
  );
}
