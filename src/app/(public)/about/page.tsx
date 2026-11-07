import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Compass,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  MapPin,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import {
  getPublishedPage,
  getPublishedPageSections,
  getPublicSiteSettings,
  parseJsonObject,
  type PublicPageSection,
} from "@/repositories/page-repository";
import { resolveImageUrl } from "@/lib/media/resolve-image";

export const metadata: Metadata = {
  title: "About",
  description:
    "Meet Adesua Oriaifo — Customer Experience and Client Success leader, coach and facilitator building human-centred service operations.",
};

const DEFAULT_HERO_IMAGE = "/brand/portrait-black-blazer.jpg";

const focusAreas = [
  {
    icon: HeartHandshake,
    title: "Customer experience",
    body: "Strategy, journey mapping and service design that connect what customers feel to how the business operates.",
  },
  {
    icon: Briefcase,
    title: "Client success",
    body: "Operating models and renewal motions that make retention a managed outcome, not a hopeful one.",
  },
  {
    icon: Users,
    title: "Coaching",
    body: "One-to-one and group coaching for leaders navigating growth, transition, or a step up in scope.",
  },
  {
    icon: Sparkles,
    title: "Facilitation",
    body: "Workshops and offsites designed to move a group from alignment to action — with clear outputs.",
  },
  {
    icon: Lightbulb,
    title: "Advisory",
    body: "Short, focused engagements to diagnose a problem, design a fix, and support implementation.",
  },
  {
    icon: GraduationCap,
    title: "Capability building",
    body: "Practical training for frontline and leadership teams, grounded in real scenarios.",
  },
] as const;

function paragraphsFrom(body: string | null | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function sectionConfig(section: PublicPageSection | undefined): Record<string, unknown> {
  return section?.config ?? {};
}

function sectionMedia(section: PublicPageSection | undefined): Record<string, unknown> {
  return section?.media ?? {};
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

type StatItem = { value: string; label: string };

function parseStats(section: PublicPageSection | undefined): StatItem[] {
  const raw = sectionConfig(section).stats;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const rec = asRecord(item);
      const value = typeof rec.value === "string" ? rec.value : null;
      const label = typeof rec.label === "string" ? rec.label : null;
      return value && label ? { value, label } : null;
    })
    .filter((s): s is StatItem => s !== null)
    .slice(0, 4);
}

type TestimonialItem = {
  id: string;
  quote: string;
  author?: string;
  role?: string;
};

function parseTestimonials(section: PublicPageSection | undefined): TestimonialItem[] {
  const fromConfig = sectionConfig(section).items;
  const source: unknown[] = Array.isArray(fromConfig)
    ? fromConfig
    : paragraphsFrom(section?.body).map((quote) => ({ quote }));

  const items: TestimonialItem[] = [];
  for (const [index, item] of source.entries()) {
    const rec = asRecord(item);
    const quote =
      typeof rec.quote === "string"
        ? rec.quote
        : typeof rec.body === "string"
          ? rec.body
          : null;
    if (!quote) continue;
    items.push({
      id: typeof rec.id === "string" ? rec.id : `t-${index}`,
      quote,
      author: typeof rec.author === "string" ? rec.author : undefined,
      role: typeof rec.role === "string" ? rec.role : undefined,
    });
  }
  return items;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export default async function AboutPage() {
  const [page, settings] = await Promise.all([
    getPublishedPage("about"),
    getPublicSiteSettings(),
  ]);

  const sections = page ? await getPublishedPageSections(page.id) : [];
  const byKey = new Map(sections.map((s) => [s.section_key, s]));

  const heroSection = byKey.get("hero");
  const introSection = byKey.get("intro");
  const journeySection = byKey.get("journey");
  const credentialsSection = byKey.get("credentials");
  const beliefsSection = byKey.get("beliefs");
  const focusSection = byKey.get("focus");
  const testimonialsSection = byKey.get("testimonials");
  const ctaSection = byKey.get("cta");

  const heroTitle =
    firstString(heroSection?.title, page?.title) ?? `About ${siteConfig.name}`;
  const heroSubtitle =
    firstString(
      heroSection?.body,
      page?.description,
      siteConfig.description
    ) ?? siteConfig.description;
  const seoImage =
    typeof parseJsonObject(settings.seo_defaults).image === "string"
      ? (parseJsonObject(settings.seo_defaults).image as string)
      : null;
  const heroImage =
    resolveImageUrl(
      firstString(
        sectionMedia(heroSection).image_path,
        page?.hero_image_path,
        seoImage,
        DEFAULT_HERO_IMAGE
      )
    ) ?? DEFAULT_HERO_IMAGE;

  const introHeading = firstString(introSection?.title) ?? "A practice built on service";
  const introBody =
    paragraphsFrom(introSection?.body).length > 0
      ? paragraphsFrom(introSection?.body)
      : [
          `${siteConfig.name} helps organisations design customer and client experiences that are clear, human and commercially sound — then coaches the people who deliver them to do their best work.`,
          siteConfig.promise,
        ];

  const stats = parseStats(byKey.get("stats"));
  const journeyParagraphs = paragraphsFrom(journeySection?.body);
  const journeyImage = resolveImageUrl(
    firstString(sectionMedia(journeySection).image_path)
  );
  const credentialsParagraphs = paragraphsFrom(credentialsSection?.body);
  const beliefsParagraphs = paragraphsFrom(beliefsSection?.body);
  const focusItems = (() => {
    const items = sectionConfig(focusSection).items;
    if (!Array.isArray(items) || items.length === 0) return focusAreas;
    return items.map((item, index) => {
      const rec = asRecord(item);
      return {
        icon: focusAreas[index % focusAreas.length].icon,
        title: firstString(rec.title) ?? focusAreas[index % focusAreas.length].title,
        body: firstString(rec.body) ?? focusAreas[index % focusAreas.length].body,
      };
    });
  })();
  const testimonials = parseTestimonials(testimonialsSection);
  const ctaHeading =
    firstString(ctaSection?.title) ?? "Ready to work together?";
  const ctaBody =
    firstString(ctaSection?.body) ??
    "If you are exploring a coaching engagement, a workshop, or a consulting project, I would be glad to hear what you are working on.";

  const linkedin = settings.social_linkedin;
  const location = firstString(sectionConfig(introSection).location);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-site grid items-center gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="text-eyebrow">{siteConfig.tagline}</p>
            <h1 className="text-h1 mt-3 text-plum-500">{heroTitle}</h1>
            <p className="text-lead mt-5 max-w-xl whitespace-pre-line">{heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/work-with-me"
                className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-5 py-3 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
              >
                Work with me
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-5 py-3 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
              >
                Get in touch
              </Link>
            </div>
            {location && (
              <p className="mt-6 flex items-center gap-2 text-caption">
                <MapPin className="size-4 text-gold-600" aria-hidden />
                {location}
              </p>
            )}
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="absolute inset-6 -z-10 rounded-full bg-blush-300/70" />
            <Image
              src={heroImage}
              alt={heroTitle}
              width={720}
              height={900}
              priority
              className="aspect-[4/5] w-full rounded-2xl object-cover object-top shadow-[0_24px_60px_-30px_rgba(73,40,63,0.45)]"
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      {stats.length > 0 && (
        <section className="border-b border-border bg-card">
          <div className="container-site grid grid-cols-2 gap-6 py-10 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-4xl font-medium text-plum-500">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Intro + focus */}
      <section className="section-y">
        <div className="container-site grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <p className="text-eyebrow">Introduction</p>
            <h2 className="text-h2 mt-2 text-plum-500">{introHeading}</h2>
            <div className="text-body-editorial mt-6 space-y-5 text-[1.0625rem] text-charcoal-700">
              {introBody.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
            <p className="text-signature mt-8 text-xl text-gold-600">
              {siteConfig.signature}
            </p>
          </div>

          <aside className="rounded-2xl border border-border bg-card p-8">
            <h3 className="font-display text-2xl font-medium text-plum-500">
              Areas of focus
            </h3>
            <ul className="mt-5 space-y-3">
              {stringList(sectionConfig(introSection).expertise).length > 0
                ? stringList(sectionConfig(introSection).expertise).map((area) => (
                    <li
                      key={area}
                      className="flex items-start gap-3 text-sm text-charcoal-700"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      {area}
                    </li>
                  ))
                : [
                    "Customer experience strategy",
                    "Client success operations",
                    "Service design & journey mapping",
                    "Team coaching & facilitation",
                    "Executive advisory",
                  ].map((area) => (
                    <li
                      key={area}
                      className="flex items-start gap-3 text-sm text-charcoal-700"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      {area}
                    </li>
                  ))}
            </ul>
          </aside>
        </div>
      </section>

      {/* Journey */}
      {(journeyParagraphs.length > 0 || journeyImage) && (
        <section className="border-y border-border bg-ivory-100 section-y">
          <div className="container-site grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-eyebrow">The path</p>
              <h2 className="text-h2 mt-2 text-plum-500">
                {firstString(journeySection?.title) ?? "The journey here"}
              </h2>
              <div className="text-body-editorial mt-6 space-y-5 text-[1.0625rem] text-charcoal-700">
                {journeyParagraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                ))}
              </div>
            </div>
            {journeyImage && (
              <Image
                src={journeyImage}
                alt=""
                width={800}
                height={1000}
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            )}
          </div>
        </section>
      )}

      {/* Credentials */}
      {credentialsParagraphs.length > 0 && (
        <section className="section-y">
          <div className="container-site max-w-3xl">
            <p className="text-eyebrow">Background</p>
            <h2 className="text-h2 mt-2 text-plum-500">
              {firstString(credentialsSection?.title) ?? "Experience & credentials"}
            </h2>
            <div className="text-body-editorial mt-6 space-y-5 text-[1.0625rem] text-charcoal-700">
              {credentialsParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Beliefs */}
      {beliefsParagraphs.length > 0 && (
        <section className="bg-gradient-to-br from-band via-band-2 to-band-3 py-16 text-on-band md:py-24">
          <div className="container-site max-w-3xl text-center">
            <p className="text-eyebrow text-gold-300">Convictions</p>
            <h2 className="text-h2 mt-2">
              {firstString(beliefsSection?.title) ?? "What I believe"}
            </h2>
            <div className="mt-8 space-y-6">
              {beliefsParagraphs.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="font-display text-2xl leading-snug text-on-band/95 md:text-3xl"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Focus / how I can help */}
      <section className="section-y">
        <div className="container-site">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-eyebrow">Collaboration</p>
            <h2 className="text-h2 mt-2 text-plum-500">
              {firstString(focusSection?.title) ?? "How I can help"}
            </h2>
            <p className="text-lead mt-4">
              {firstString(focusSection?.body) ??
                "Coaching, facilitation and advisory work for leaders and teams building better customer and client experiences."}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {focusItems.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="group rounded-2xl border border-border bg-card p-7 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(73,40,63,0.35)]"
                >
                  <span className="inline-flex size-12 items-center justify-center rounded-full bg-blush-300 text-plum-500">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-display text-xl font-medium text-plum-500">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
                    {item.body}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/work-with-me"
              className="inline-flex items-center gap-2 text-sm font-semibold text-plum-500 hover:text-gold-600"
            >
              See pathways in detail
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="border-y border-border bg-ivory-100 section-y">
          <div className="container-site">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-eyebrow">Kind words</p>
              <h2 className="text-h2 mt-2 text-plum-500">
                {firstString(testimonialsSection?.title) ?? "What people say"}
              </h2>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {testimonials.map((t) => (
                <figure
                  key={t.id}
                  className="rounded-2xl border border-border bg-card p-7"
                >
                  <Compass className="size-5 text-gold-500" aria-hidden />
                  <blockquote className="mt-4 text-[1.0625rem] leading-relaxed text-charcoal-700">
                    “{t.quote}”
                  </blockquote>
                  {(t.author || t.role) && (
                    <figcaption className="mt-5 border-t border-border pt-4">
                      {t.author && (
                        <p className="text-sm font-semibold text-plum-500">
                          {t.author}
                        </p>
                      )}
                      {t.role && (
                        <p className="mt-0.5 text-caption">{t.role}</p>
                      )}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="section-y">
        <div className="container-site max-w-3xl text-center">
          <Target className="mx-auto size-8 text-gold-600" aria-hidden />
          <h2 className="text-h2 mt-4 text-plum-500">{ctaHeading}</h2>
          <p className="text-lead mt-4">{ctaBody}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-md bg-plum-500 px-6 py-3 text-sm font-semibold text-ivory-200 transition hover:bg-plum-600"
            >
              Start a conversation
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/work-with-me"
              className="inline-flex items-center gap-2 rounded-md border border-plum-500/35 px-6 py-3 text-sm font-semibold text-plum-500 transition hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200"
            >
              Explore ways to work together
            </Link>
          </div>
          {linkedin && (
            <p className="mt-6 text-caption">
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-plum-500 hover:text-gold-600"
              >
                Connect on LinkedIn
              </a>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
