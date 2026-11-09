import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPublishedArticles, getArticleCategories } from "@/repositories/article-repository";
import { PageHero } from "@/components/public/page-hero";
import { Section, SectionHeading } from "@/components/public/section";
import { Reveal } from "@/components/public/reveal";
import { InsightsList } from "@/components/public/insights-list";
import { CTABanner } from "@/components/public/cta-banner";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Thoughts on leadership, customer experience, intentional living, and building better organizations.",
  alternates: { canonical: "/insights" },
};

export default async function InsightsPage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(50),
    getArticleCategories(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Writing & reflection"
        title="Insights"
        description="Notes on leadership, customer experience, intentional living, and building better organizations."
      />

      {articles.length === 0 ? (
        <Section>
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="font-display text-3xl text-plum-500">
                Insights are being written.
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
                Thoughts on leadership, customer experience, and intentional
                living will appear here soon. In the meantime, explore the
                pathways below.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/work-with-me"
                  className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-6 py-3 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
                >
                  Work with me
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-6 py-3 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
                >
                  About me
                </Link>
              </div>
            </Reveal>
          </div>
        </Section>
      ) : (
        <>
          <Section tone="tint">
            <SectionHeading
              eyebrow="All insights"
              title="Latest writings"
              description="Reflections on leadership, customer experience, and intentional living."
            />
            <div className="mt-10">
              <InsightsList articles={articles} categories={categories} />
            </div>
          </Section>

          <CTABanner
            title="Want to collaborate?"
            description="Share your insights with the community through a guest post or joint workshop."
            primary={{ label: "Get in touch", href: "/contact" }}
            secondary={{ label: "About working together", href: "/work-with-me" }}
          />
        </>
      )}
    </>
  );
}
