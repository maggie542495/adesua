import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { getPublishedArticles, getArticleCategories } from "@/repositories/article-repository";
import { PageHero } from "@/components/public/page-hero";
import { Section, SectionHeading } from "@/components/public/section";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/public/reveal";
import { Badge } from "@/components/ui/badge";
import { CTABanner } from "@/components/public/cta-banner";
import { resolveImageUrl } from "@/lib/media/resolve-image";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Thoughts on leadership, customer experience, intentional living, and building better organizations.",
};

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function readingTime(minutes: number | null): string {
  if (!minutes) return "";
  return `${minutes} min read`;
}

export default async function InsightsPage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticles(12),
    getArticleCategories(),
  ]);

  const featured = articles.find((a) => a.is_featured);
  const others = articles.filter((a) => !a.is_featured);

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
                  About Adesua
                </Link>
              </div>
            </Reveal>
          </div>
        </Section>
      ) : (
        <>
          {featured && (
            <Section tone="tint">
              <div className="mx-auto max-w-4xl">
                <Reveal>
                  <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                    <div className="flex items-center gap-3">
                      <Badge variant="soft">Featured</Badge>
                      {featured.category && (
                        <Badge variant="secondary">{featured.category.name}</Badge>
                      )}
                    </div>
                    <h2 className="mt-4 font-display text-3xl font-medium text-plum-500">
                      {featured.title}
                    </h2>
                    {featured.excerpt && (
                      <p className="mt-4 text-lg leading-relaxed text-charcoal-700">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="mt-6 flex items-center gap-6 text-sm text-muted-foreground">
                      {featured.published_at && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-4" />
                          {formatDate(featured.published_at)}
                        </span>
                      )}
                      {featured.reading_time_minutes && (
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-4" />
                          {readingTime(featured.reading_time_minutes)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/insights/${featured.slug}`}
                      className="mt-6 inline-flex items-center gap-2 font-semibold text-plum-500 transition-colors hover:text-gold-700"
                    >
                      Read article
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </Reveal>
              </div>
            </Section>
          )}

          <Section>
            <SectionHeading
              eyebrow="All insights"
              title="Latest writings"
              description="Reflections on leadership, customer experience, and intentional living."
            />

            <StaggerGroup
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              stagger={0.12}
            >
              {others.map((article) => (
                <StaggerItem key={article.id}>
                  <Link
                    href={`/insights/${article.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl hover:shadow-plum-700/12"
                  >
                    {article.category && (
                      <Badge variant="secondary">{article.category.name}</Badge>
                    )}
                    <h3 className="mt-4 font-display text-xl font-medium leading-snug text-plum-500">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-auto pt-6 flex items-center gap-4 text-xs text-muted-foreground">
                      {article.published_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {formatDate(article.published_at)}
                        </span>
                      )}
                      {article.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="size-3.5" />
                          {readingTime(article.reading_time_minutes)}
                        </span>
                      )}
                    </div>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 opacity-0 transition-all duration-300 group-hover:opacity-100">
                      Read
                      <ArrowRight className="size-3.5" />
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
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
