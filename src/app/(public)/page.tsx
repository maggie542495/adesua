import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Compass,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Users,
} from "lucide-react";
import { siteConfig, pathways } from "@/config/site";
import { getHomepageContent } from "@/repositories/homepage-repository";
import { getPublishedArticles } from "@/repositories/article-repository";
import { resolveImageUrl } from "@/lib/media/resolve-image";
import { Hero } from "@/components/public/hero";
import { Marquee } from "@/components/public/marquee";
import { Section, SectionHeading } from "@/components/public/section";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/public/reveal";
import { FeatureCard } from "@/components/public/feature-card";
import { CTABanner } from "@/components/public/cta-banner";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  // The root layout template appends `— Adesua Oriaifo`; absolute avoids a doubled name.
  title: { absolute: `${siteConfig.tagline} — ${siteConfig.name}` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

const DEFAULT_IMAGE = "/brand/cutout-headshot.png";

const marqueeItems = [
  "Better People",
  "Better Experiences",
  "A Brighter Future",
  "Transform",
  "Transcend",
  "Become",
] as const;

const services = [
  {
    icon: HeartHandshake,
    title: "Customer experience",
    description:
      "Strategy, journey mapping and service design that connect what customers feel to how the business operates.",
  },
  {
    icon: Briefcase,
    title: "Client success",
    description:
      "Operating models and renewal motions that make retention a managed outcome, not a hopeful one.",
  },
  {
    icon: Users,
    title: "Coaching",
    description:
      "One-to-one and group coaching for leaders navigating growth, transition, or a step up in scope.",
  },
  {
    icon: Sparkles,
    title: "Facilitation",
    description:
      "Workshops and offsites designed to move a group from alignment to action — with clear outputs.",
  },
  {
    icon: Lightbulb,
    title: "Advisory",
    description:
      "Short, focused engagements to diagnose a problem, design a fix, and support implementation.",
  },
  {
    icon: GraduationCap,
    title: "Capability building",
    description:
      "Practical training for frontline and leadership teams, grounded in real scenarios.",
  },
] as const;

function topicList(summary: string): string[] {
  return summary
    .split(/,|·/)
    .map((part) => part.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export default async function HomePage() {
  const [homepage, articles] = await Promise.all([
    getHomepageContent(),
    getPublishedArticles(3),
  ]);

  const heroImage =
    resolveImageUrl(
      firstString(homepage?.featured_image_path, DEFAULT_IMAGE)
    ) ?? DEFAULT_IMAGE;

  const pathway = [
    {
      ...pathways.personalGrowth,
      href: "/work-with-me#personal-growth",
      icon: Compass,
      tint: "from-blush-200 via-blush-100 to-ivory-100",
    },
    {
      ...pathways.professionalImpact,
      href: "/work-with-me#professional-impact",
      icon: Briefcase,
      tint: "from-gold-100 via-ivory-100 to-blush-100",
    },
  ] as const;

  return (
    <>
      <Hero
        eyebrow={firstString(homepage?.hero_eyebrow) ?? siteConfig.tagline}
        headline={
          firstString(homepage?.hero_headline) ?? siteConfig.philosophy
        }
        subheadline={
          firstString(homepage?.hero_subheadline) ??
          "Customer Experience & Client Success Leader · Coach · Facilitator"
        }
        body={firstString(homepage?.hero_body) ?? siteConfig.promise}
        primary={{
          label: firstString(homepage?.hero_cta_primary_label) ?? "Work with me",
          href: firstString(homepage?.hero_cta_primary_href) ?? "/work-with-me",
        }}
        secondary={{
          label: firstString(homepage?.hero_cta_secondary_label) ?? "About Adesua",
          href: firstString(homepage?.hero_cta_secondary_href) ?? "/about",
        }}
        image={heroImage}
        imageAlt={siteConfig.name}
      />

      <Marquee items={marqueeItems} />

      {/* ── Positioning ── */}
      <Section>
        <div className="grid items-start gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <Reveal>
            <p className="text-eyebrow">The practice</p>
            <h2 className="text-h2 mt-3 text-plum-500">
              Meaningful growth, without losing yourself.
            </h2>
            <div className="text-body-editorial mt-6 space-y-5 text-[1.0625rem] text-charcoal-700">
              <p>
                I work with leaders and teams who want their customer and client
                experiences to be genuinely better — and with people who want to
                grow without performing a version of themselves that does not
                last.
              </p>
              <p>
                That means two things held together: rigorous work on how an
                organisation serves its customers, and honest work on how the
                people inside it lead, decide and sustain effort.
              </p>
            </div>
            <p className="text-signature mt-8 text-xl text-gold-600">
              {siteConfig.signature}
            </p>
          </Reveal>

          <Reveal delay={0.12}>
            <aside className="rounded-2xl border border-border bg-card p-7 shadow-sm">
              <h3 className="font-display text-2xl font-medium text-plum-500">
                Operating principles
              </h3>
              <ul className="mt-5 space-y-4">
                {siteConfig.principles.split("|").map((principle) => (
                  <li key={principle.trim()} className="flex items-start gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                    <span className="font-display text-lg text-charcoal-800">
                      {principle.trim()}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-t border-border pt-5 text-sm leading-relaxed text-muted-foreground">
                {siteConfig.description}
              </p>
            </aside>
          </Reveal>
        </div>
      </Section>

      {/* ── Two pathways ── */}
      <Section tone="muted">
        <SectionHeading
          eyebrow="Pathways"
          title="Two ways to work together"
          description="Personal growth and professional impact are separate entry points, but they meet in the same place: people doing better work for longer."
        />

        <StaggerGroup className="grid gap-6 lg:grid-cols-2" stagger={0.14}>
          {pathway.map((pathway) => {
            const Icon = pathway.icon;
            return (
              <StaggerItem key={pathway.slug}>
                <Link
                  href={pathway.href}
                  className={`group flex h-full flex-col rounded-2xl border border-border bg-gradient-to-br ${pathway.tint} p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-gold-300 hover:shadow-xl hover:shadow-plum-700/12`}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex size-14 items-center justify-center rounded-2xl bg-plum-500 text-ivory-200 shadow-lg shadow-plum-500/30 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <ArrowUpRight
                      className="size-6 text-gold-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      aria-hidden
                    />
                  </div>
                  <h3 className="mt-6 font-display text-3xl font-medium text-plum-500">
                    {pathway.title}
                  </h3>
                  <p className="mt-3 text-[0.975rem] leading-relaxed text-charcoal-700">
                    {pathway.summary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {topicList(pathway.summary).map((topic) => (
                      <Badge key={topic} variant="soft">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                  <span className="mt-auto inline-flex items-center gap-2 pt-7 text-sm font-semibold text-plum-500 transition-colors group-hover:text-gold-700">
                    Explore this pathway
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </Section>

      {/* ── What I do ── */}
      <Section>
        <SectionHeading
          eyebrow="Capabilities"
          title="What I do"
          description="Advisory, facilitation and coaching work — delivered as focused engagements, not open-ended retainers."
        />
        <StaggerGroup className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
          {services.map((service) => (
            <StaggerItem key={service.title}>
              <FeatureCard
                icon={service.icon}
                title={service.title}
                description={service.description}
                className="h-full"
              />
            </StaggerItem>
          ))}
        </StaggerGroup>
      </Section>

      {/* ── Philosophy band ── */}
      <Section tone="dark">
        <div
          aria-hidden
          className="abf-float absolute -right-20 -top-20 size-72 rounded-full bg-gold-300/20 blur-3xl"
        />
        <div
          aria-hidden
          className="abf-float absolute -bottom-24 -left-16 size-72 rounded-full bg-mauve-400/25 blur-3xl"
          style={{ animationDelay: "2.5s" }}
        />
        <div className="relative mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-eyebrow text-gold-300">Philosophy</p>
            <p className="mt-5 font-display text-3xl leading-snug text-on-band md:text-4xl">
              {siteConfig.philosophy}
            </p>
            <div className="mx-auto mt-8 h-px w-24 bg-gold-400/70" aria-hidden />
            <p className="text-signature mt-6 text-xl text-gold-300">
              {siteConfig.signature}
            </p>
          </Reveal>
        </div>
      </Section>

      {/* ── Insights ── */}
      <Section>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <p className="text-eyebrow">Insights</p>
            <h2 className="text-h2 mt-3 text-plum-500">Writing &amp; reflection</h2>
            <p className="text-lead mt-4 max-w-xl">
              Notes on leadership, customer experience, and living with
              intention.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 text-sm font-semibold text-plum-500 transition-colors hover:text-gold-700"
            >
              All insights
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>

        {articles.length > 0 ? (
          <StaggerGroup className="mt-10 grid gap-6 md:grid-cols-3" stagger={0.1}>
            {articles.map((article) => (
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
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-xs font-semibold uppercase tracking-wider text-gold-700">
                    Read
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </StaggerGroup>
        ) : (
          <Reveal delay={0.12}>
            <div className="mt-10 rounded-2xl border border-dashed border-plum-500/25 bg-ivory-100 p-8 text-center md:p-12">
              <Sparkles className="mx-auto size-6 text-gold-600" aria-hidden />
              <p className="mt-4 font-display text-2xl text-plum-500">
                The first pieces are being written.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Insights on leadership, customer experience and intentionality
                will appear here. In the meantime, the two pathways below are
                where the work happens.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/work-with-me"
                  className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-2.5 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
                >
                  Work with me
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-5 py-2.5 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
                >
                  About Adesua
                </Link>
              </div>
            </div>
          </Reveal>
        )}
      </Section>

      {/* ── Portrait closer ── */}
      <Section tone="tint">
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal direction="left">
            <div className="relative mx-auto max-w-sm">
              <div
                aria-hidden
                className="absolute inset-5 -z-10 rounded-full bg-gold-200/60 blur-2xl"
              />
              <Image
                src="/brand/portrait-green-dress-seated.jpg"
                alt={siteConfig.name}
                width={640}
                height={800}
                className="aspect-[4/5] w-full rounded-2xl border border-border object-cover object-top shadow-[0_30px_70px_-40px_rgba(73,40,63,0.5)]"
              />
            </div>
          </Reveal>
          <Reveal direction="right">
            <p className="text-eyebrow">A brighter future</p>
            <h2 className="text-h2 mt-3 text-plum-500">
              Better people. Better experiences.
            </h2>
            <div className="text-body-editorial mt-6 space-y-5 text-[1.0625rem] text-charcoal-700">
              <p>
                Whether the brief is a service redesign, a leadership offsite,
                or a season of personal change, the aim is the same: leave the
                system — and the people in it — better than you found them.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-6 py-3 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
              >
                Start a conversation
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-6 py-3 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
              >
                Read the full story
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      <CTABanner
        title="Ready to begin?"
        description="Tell me what you are working on. A short note is enough to start."
        primary={{ label: "Get in touch", href: "/contact" }}
        secondary={{ label: "See ways to work together", href: "/work-with-me" }}
      />
    </>
  );
}
