"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import type { ArticleCategory, PublishedArticle } from "@/repositories/article-repository";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/public/reveal";
import { Badge } from "@/components/ui/badge";
import { resolveImageUrl } from "@/lib/media/resolve-image";
import { cn } from "@/lib/utils";

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function Cover({
  article,
  priority = false,
  sizes,
}: {
  article: PublishedArticle;
  priority?: boolean;
  sizes: string;
}) {
  const src = resolveImageUrl(article.cover_image_path);

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-ivory-200">
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
        />
      ) : (
        <div
          aria-hidden
          className="flex h-full items-center justify-center bg-gradient-to-br from-plum-500/12 via-ivory-200 to-gold-400/20"
        >
          <span className="font-display text-lg tracking-tight text-plum-500/45">
            {article.title}
          </span>
        </div>
      )}
    </div>
  );
}

function Meta({ article }: { article: PublishedArticle }) {
  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      {article.published_at && (
        <span className="flex items-center gap-1.5">
          <Calendar className="size-3.5" aria-hidden />
          {formatDate(article.published_at)}
        </span>
      )}
      {article.reading_time_minutes && (
        <span className="flex items-center gap-1.5">
          <Clock className="size-3.5" aria-hidden />
          {article.reading_time_minutes} min read
        </span>
      )}
    </div>
  );
}

export function InsightsList({
  articles,
  categories,
}: {
  articles: PublishedArticle[];
  categories: ArticleCategory[];
}) {
  const [active, setActive] = useState<string>("all");

  /**
   * Only categories that actually have a published article are offered — an
   * empty filter is a dead end for a reader.
   */
  const filters = useMemo(() => {
    const used = new Set(
      articles.map((article) => article.category?.slug).filter(Boolean) as string[],
    );
    return categories.filter((category) => used.has(category.slug));
  }, [articles, categories]);

  const visible = useMemo(
    () =>
      active === "all"
        ? articles
        : articles.filter((article) => article.category?.slug === active),
    [articles, active],
  );

  const featured = active === "all" ? visible.find((article) => article.is_featured) : undefined;
  const rest = featured ? visible.filter((article) => article.id !== featured.id) : visible;

  return (
    <div className="space-y-10">
      {filters.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActive("all")}
            aria-pressed={active === "all"}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
              active === "all"
                ? "border-plum-500 bg-plum-500 text-ivory-200"
                : "border-border bg-card text-charcoal-700 hover:border-gold-400 hover:text-plum-600",
            )}
          >
            All writing
          </button>
          {filters.map((category) => (
            <button
              key={category.slug}
              type="button"
              onClick={() => setActive(category.slug)}
              aria-pressed={active === category.slug}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
                active === category.slug
                  ? "border-plum-500 bg-plum-500 text-ivory-200"
                  : "border-border bg-card text-charcoal-700 hover:border-gold-400 hover:text-plum-600",
              )}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {featured && (
        <Reveal>
          <Link
            href={`/insights/${featured.slug}`}
            className="group grid overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl hover:shadow-plum-700/12 md:grid-cols-2"
          >
            <Cover article={featured} priority sizes="(min-width: 768px) 45vw, 100vw" />
            <div className="flex flex-col justify-center p-7">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="soft">Featured</Badge>
                {featured.category && <Badge variant="secondary">{featured.category.name}</Badge>}
              </div>
              <h2 className="mt-4 font-display text-2xl leading-snug text-plum-500 sm:text-3xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="mt-3 line-clamp-3 leading-relaxed text-charcoal-700">
                  {featured.excerpt}
                </p>
              )}
              <div className="mt-5">
                <Meta article={featured} />
              </div>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gold-700">
                Read article
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        </Reveal>
      )}

      {rest.length > 0 ? (
        <StaggerGroup className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
          {rest.map((article) => (
            <StaggerItem key={article.id} className="h-full">
              <Link
                href={`/insights/${article.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl hover:shadow-plum-700/12"
              >
                <Cover
                  article={article}
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 92vw"
                />
                <div className="flex flex-1 flex-col p-6">
                  {article.category && (
                    <Badge variant="secondary">{article.category.name}</Badge>
                  )}
                  <h3 className="mt-3 font-display text-xl leading-snug text-plum-500">
                    {article.title}
                  </h3>
                  {article.excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {article.excerpt}
                    </p>
                  )}
                  <div className="mt-auto pt-5">
                    <Meta article={article} />
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      ) : (
        !featured && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nothing published in this category yet.
          </p>
        )
      )}
    </div>
  );
}
