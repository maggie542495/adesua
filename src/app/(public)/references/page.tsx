import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Quote } from "lucide-react";
import { Linkedin } from "@/components/ui/brand-icons";
import { PageHero } from "@/components/public/page-hero";
import { Reveal } from "@/components/public/reveal";
import {
  formatRecommendationDate,
  recommendations,
  recommendationsSource,
} from "@/content/recommendations";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "References",
  description:
    "Recommendations from the people I have led, worked alongside and served.",
  alternates: { canonical: "/references" },
};

export default function ReferencesPage() {
  return (
    <>
      <PageHero
        eyebrow="References"
        title="In their words"
        description={`All ${recommendations.length} recommendations — quoted verbatim, with the person, their role and how they know the work.`}
      >
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={siteConfig.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
          >
            <Linkedin className="size-4" aria-hidden />
            Connect
            <ArrowUpRight className="size-4" aria-hidden />
          </a>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-5 py-2.5 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to about
          </Link>
        </div>
      </PageHero>

      <section className="section-y">
        <div className="container-site max-w-4xl">
          <ol className="space-y-6">
            {recommendations.map((item, index) => (
              <li key={`${item.author}-${item.date}`}>
                <Reveal delay={Math.min(index, 5) * 0.04}>
                  <figure className="rounded-2xl border border-border bg-card p-7 md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <Quote className="size-5 shrink-0 text-gold-500" aria-hidden />
                      <time
                        dateTime={item.date}
                        className="text-caption whitespace-nowrap"
                      >
                        {formatRecommendationDate(item.date)}
                      </time>
                    </div>

                    <blockquote className="mt-4 text-[1.0625rem] leading-relaxed text-charcoal-700">
                      “{item.quote}”
                    </blockquote>

                    <figcaption className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-t border-border pt-5">
                      <div>
                        <p className="text-sm font-semibold text-plum-500">
                          {item.author}
                        </p>
                        <p className="mt-0.5 text-sm text-charcoal-700">{item.role}</p>
                        <p className="mt-0.5 text-caption">{item.relationship}</p>
                      </div>
                      <a
                        href={recommendationsSource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-plum-500 transition hover:text-gold-600"
                      >
                        <Linkedin className="size-3.5" aria-hidden />
                        View original
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    </figcaption>
                  </figure>
                </Reveal>
              </li>
            ))}
          </ol>

          <div className="mt-14 rounded-2xl border border-border bg-ivory-100 p-8 text-center md:p-10">
            <p className="font-display text-2xl text-plum-500">
              Want to talk to someone who has worked with me?
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
              References can be arranged on request. The people above are the
              fastest place to start.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
              >
                Get in touch
              </Link>
              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-5 py-2.5 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
              >
                <Linkedin className="size-4" aria-hidden />
                Connect
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
