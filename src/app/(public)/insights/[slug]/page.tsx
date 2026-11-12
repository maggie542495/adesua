import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock } from "lucide-react";
import { getArticleBySlug, getPublishedArticles } from "@/repositories/article-repository";
import { Section, SectionHeading } from "@/components/public/section";
import { Reveal } from "@/components/public/reveal";
import { Badge } from "@/components/ui/badge";
import { CTABanner } from "@/components/public/cta-banner";
import { ShareMenu } from "@/components/public/share-menu";
import { resolveImageUrl } from "@/lib/media/resolve-image";
import { readingTime, renderMarkdown } from "@/lib/markdown";
import { siteConfig } from "@/config/site";

// Article pages read the live database behind the public client.
export const instant = false;

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
  const article = await getArticleBySlug(slug);

  if (!article) return { title: "Not found" };

  const image = resolveImageUrl(article.seo_image_path ?? article.cover_image_path);
  const description =
    article.seo_description ?? article.excerpt ?? `An article by ${siteConfig.name}.`;

  return {
    title: article.seo_title ?? article.title,
    description,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.seo_title ?? article.title,
      description,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: article.seo_title ?? article.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const others = await getPublishedArticles(6);
  const related = others
    .filter(
      (candidate) =>
        candidate.id !== article.id &&
        (!article.category || candidate.category?.slug === article.category.slug),
    )
    .slice(0, 2);
  const fallbackRelated = others.filter((candidate) => candidate.id !== article.id).slice(0, 2);
  const suggestions = related.length ? related : fallbackRelated;

  const cover = resolveImageUrl(article.cover_image_path);
  const minutes = article.reading_time_minutes ?? readingTime(article.body ?? article.excerpt ?? "");
  const bodyHtml = renderMarkdown(article.body ?? article.excerpt ?? "");

  return (
    <article>
      {/* Masthead */}
      <header className="relative overflow-hidden border-b border-border bg-ivory-100 pb-14 pt-28 sm:pt-32">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold-200/40 blur-3xl"
        />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <Link
            href="/insights"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-700 transition hover:text-plum-600"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            All insights
          </Link>

          {article.category && (
            <div className="mt-6">
              <Badge variant="secondary">{article.category.name}</Badge>
            </div>
          )}

          <h1 className="mt-4 font-display text-4xl leading-[1.1] text-plum-500 sm:text-5xl">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="mt-5 text-lg leading-relaxed text-charcoal-700">
              {article.excerpt}
            </p>
          )}

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden />
              {formatDate(article.published_at)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden />
              {minutes} min read
            </span>
            <span>By {siteConfig.name}</span>
          </div>
        </div>
      </header>

      {cover && (
        <div className="relative mx-auto -mt-10 max-w-5xl px-4 sm:px-6">
          <Reveal>
            <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-border shadow-[0_40px_90px_-50px_rgba(73,40,63,0.65)] sm:aspect-[16/10]">
              <Image
                src={cover}
                alt={article.title}
                fill
                priority
                sizes="(min-width: 1024px) 64rem, 100vw"
                className="object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
              />
              {/* The fade lets the article open on top of the photograph. */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/70 to-transparent"
              />
            </div>
          </Reveal>
        </div>
      )}

      <Section className={cover ? "-mt-16 sm:-mt-24" : undefined}>
        <div className="mx-auto max-w-3xl">
          <div
            className="article-body text-[1.0625rem] leading-[1.85] text-charcoal-700"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="text-sm text-muted-foreground">
              Written by <span className="font-medium text-plum-600">{siteConfig.name}</span>
            </p>
            <ShareMenu title={article.title} url={`${siteConfig.url}/insights/${article.slug}`} />
          </div>
        </div>
      </Section>

      {suggestions.length > 0 && (
        <Section tone="tint">
          <div className="mx-auto max-w-4xl">
            <SectionHeading eyebrow="Continue reading" title="Related insights" align="left" />
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {suggestions.map((suggestion) => (
                <Reveal key={suggestion.id}>
                  <Link
                    href={`/insights/${suggestion.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl"
                  >
                    {resolveImageUrl(suggestion.cover_image_path) && (
                      <div className="relative aspect-[16/9] overflow-hidden bg-ivory-200">
                        <Image
                          src={resolveImageUrl(suggestion.cover_image_path) as string}
                          alt=""
                          fill
                          sizes="(min-width: 768px) 30rem, 100vw"
                          className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      {suggestion.category && (
                        <Badge variant="secondary">{suggestion.category.name}</Badge>
                      )}
                      <h3 className="mt-3 font-display text-xl leading-snug text-plum-500">
                        {suggestion.title}
                      </h3>
                      {suggestion.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {suggestion.excerpt}
                        </p>
                      )}
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-xs font-semibold uppercase tracking-wider text-gold-700">
                        Read
                        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      )}

      <CTABanner
        title="Work with me"
        description="Coaching, facilitation and advisory for people and teams who want growth that lasts."
        primary={{ label: "Start a conversation", href: "/contact" }}
        secondary={{ label: "Explore the pathways", href: "/work-with-me" }}
      />
    </article>
  );
}
