import type { Metadata } from "next";
import Link from "next/link";

// Dynamic article pages should not be statically prerendered
export const instant = false;
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { getPublishedArticles } from "@/repositories/article-repository";
import { PageHero } from "@/components/public/page-hero";
import { Section, SectionHeading } from "@/components/public/section";
import { Badge } from "@/components/ui/badge";
import { resolveImageUrl } from "@/lib/media/resolve-image";

type Props = { params: Promise<{ slug: string }> };

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const articles = await getPublishedArticles(100);
  const article = articles.find((a) => a.slug === slug);

  if (!article) return { title: "Not Found" };

  return {
    title: article.title,
    description: article.excerpt || `Article on ${article.category?.name || "various topics"}`,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const articles = await getPublishedArticles(100);
  const article = articles.find((a) => a.slug === slug);

  if (!article) notFound();

  const related = articles
    .filter(
      (a) =>
        a.id !== article.id &&
        a.category?.slug === article.category?.slug
    )
    .slice(0, 2);

  return (
    <>
      <PageHero
        eyebrow={article.category?.name}
        title={article.title}
        description={article.excerpt || undefined}
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          <div className="text-sm text-muted-foreground">
            {article.published_at && (
              <span className="mr-4 inline-flex items-center gap-1">
                <Calendar className="size-4" />
                {formatDate(article.published_at)}
              </span>
            )}
            {article.reading_time_minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" />
                {article.reading_time_minutes} min read
              </span>
            )}
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl text-body-editorial space-y-6">
          <p className="text-lead">{article.excerpt}</p>
          <p>
            This article would contain the full body content. For now, this is
            a placeholder layout.
          </p>
        </div>
      </Section>

      <Section tone="tint">
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            eyebrow="Continue reading"
            title="Related insights"
            align="left"
          />
          <div className="grid gap-6 md:grid-cols-2">
            {related.length > 0 ? (
              related.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/insights/${relatedArticle.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl hover:shadow-plum-700/12"
                >
                  <h3 className="font-display text-xl font-medium leading-snug text-plum-500">
                    {relatedArticle.title}
                  </h3>
                  {relatedArticle.excerpt && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {relatedArticle.excerpt}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-gold-700">
                    Read
                    <ArrowRight className="size-3.5" />
                  </span>
                </Link>
              ))
            ) : (
              <p className="text-muted-foreground">
                No related articles at the moment.
              </p>
            )}
          </div>
        </div>
      </Section>

      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href="/insights"
            className="inline-flex items-center gap-2 font-semibold text-plum-500 hover:text-gold-700"
          >
            <ArrowLeft className="size-4" />
            Back to all insights
          </Link>
        </div>
      </Section>
    </>
  );
}
