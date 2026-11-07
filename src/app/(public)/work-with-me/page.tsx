import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Calendar } from "lucide-react";
import { siteConfig, pathways } from "@/config/site";
import { getPublishedServices } from "@/repositories/service-repository";
import { Section, SectionHeading } from "@/components/public/section";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/public/reveal";
import { FeatureCard, NumberedItem } from "@/components/public/feature-card";
import { CTABanner } from "@/components/public/cta-banner";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Work with me",
  description:
    "Coaching, facilitation and advisory for leaders and teams building better customer and client experiences.",
};

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

const engagementSteps = [
  {
    title: "Discovery",
    description:
      "A short conversation to understand what you are working on, what success looks like, and whether we should proceed.",
  },
  {
    title: "Proposal",
    description:
      "A concise outline of the work, milestones, and investment. No hidden costs.",
  },
  {
    title: "Delivery",
    description:
      "Focused sessions, clear outputs, and a handoff that leaves you and your team set up to continue.",
  },
] as const;

export default async function WorkWithMePage() {
  const services = await getPublishedServices();

  return (
    <>
      {/* ── Header ── */}
      <Section tone="tint">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="text-eyebrow">Engagements</p>
            <h1 className="text-h1 mt-3 text-plum-500">Work with me</h1>
            <p className="text-lead mt-5">
              Short, focused engagements. Clear outputs. No open-ended
              retainers.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
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
                About Adesua
              </Link>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Two pathways ── */}
      <Section>
        <SectionHeading
          eyebrow="Choose a pathway"
          title="Where do you want to start?"
          description="Personal growth and professional impact are separate entry points. Both meet in the same place: people doing better work for longer."
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {([pathways.personalGrowth, pathways.professionalImpact] as const).map((pathway) => {
            const allServices =
              pathway.slug === "personal-growth"
                ? services.filter((s) => s.pathway === "personal-growth")
                : services.filter((s) => s.pathway === "professional-impact");

            return (
              <div
                key={pathway.slug}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-plum-500 text-ivory-200">
                    <span className="font-display text-lg">
                      {pathway.slug === "personal-growth" ? "P" : "P"}
                    </span>
                  </span>
                  <div>
                    <h3 className="font-display text-2xl font-medium text-plum-500">
                      {pathway.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {pathway.summary}
                    </p>
                  </div>
                </div>

                {allServices.length > 0 && (
                  <div className="mt-6 space-y-3">
                    {allServices.map((service) => (
                      <div
                        key={service.id}
                        className="rounded-xl border border-border p-4 transition hover:border-gold-300"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-plum-500">
                              {service.title}
                            </h4>
                            {service.summary && (
                              <p className="mt-1 text-sm text-muted-foreground">
                                {service.summary}
                              </p>
                            )}
                          </div>
                          <Link
                            href={pathway.slug === "personal-growth" ? "/work-with-me#personal-growth" : "/work-with-me#professional-impact"}
                            className="ml-4 inline-flex items-center gap-1 text-sm font-semibold text-gold-700 transition-colors hover:text-gold-800"
                          >
                            Details
                            <ArrowUpRight className="size-4" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Link
                  href={pathway.slug === "personal-growth" ? "/work-with-me#personal-growth" : "/work-with-me#professional-impact"}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-plum-500 transition-colors hover:text-gold-700"
                >
                  See full details
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Personal Growth detailed ── */}
      <Section tone="muted">
        <div id="personal-growth" className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-plum-500 text-ivory-200">
              P
            </span>
            <h2 className="text-h2 text-plum-500">Personal Growth</h2>
          </div>

          <Reveal>
            <p className="text-lead">
              Coaching, identity, purpose, intentional living, productivity,
              confidence, and accountability. One-to-one work with leaders and
              individuals navigating change.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-medium text-plum-500">
                Common topics
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Identity & purpose",
                  "Transition coaching",
                  "Confidence & communication",
                  "Time & energy management",
                  "Executive presence",
                  "Accountability partnerships",
                ].map((topic) => (
                  <Badge key={topic} variant="soft">
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-eyebrow text-gold-700">Typical flow</p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Discovery call (30 min)",
                    "12-week coaching engagement",
                    "Fortnightly 60-min sessions",
                    "Asynchronous support between sessions",
                  ].map((step) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span className="text-sm text-charcoal-700">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-eyebrow text-gold-700">Who this is for</p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Leaders in transition",
                    "Individual contributors stepping up",
                    "Founders building sustainable habits",
                    "Anyone feeling stuck or stretched",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span className="text-sm text-charcoal-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── Professional Impact detailed ── */}
      <Section>
        <div id="professional-impact" className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-gold-500 text-charcoal-800">
              P
            </span>
            <h2 className="text-h2 text-plum-500">Professional Impact</h2>
          </div>

          <Reveal>
            <p className="text-lead">
              Customer experience, client success, leadership, learning and
              development, facilitation, and organisation development.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-eyebrow text-gold-700">Common offerings</p>
                <ul className="mt-4 space-y-3">
                  {[
                    "CX service design workshops",
                    "Client success operating model review",
                    "Leadership offsites",
                    "Team facilitation & coaching",
                    "Capability building programs",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span className="text-sm text-charcoal-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <p className="text-eyebrow text-gold-700">Engagement types</p>
                <ul className="mt-4 space-y-3">
                  {[
                    "Single-day workshops (6-8 hours)",
                    "2-3 session discovery & design sprint",
                    "3-6 month advisory & coaching",
                    "Capability building (custom length)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span className="text-sm text-charcoal-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ── How it works ── */}
      <Section tone="tint">
        <SectionHeading
          eyebrow="Process"
          title="How engagements work"
          description="Transparent, structured, and focused on getting to outcomes quickly."
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {engagementSteps.map((step, index) => (
            <NumberedItem
              key={step.title}
              number={index + 1}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section>
        <SectionHeading
          eyebrow="FAQ"
          title="Common questions"
          description="If your question is not here, reach out. I usually respond within one working day."
        />

        <Reveal>
          <Accordion
            items={[
              {
                id: "pricing",
                title: "What is your pricing?",
                content: (
                  <p className="text-sm leading-relaxed">
                    Workshops start at a fixed day rate. Coaching and advisory
                    work are priced per engagement based on scope and duration.
                    After a discovery conversation, I will send a written
                    proposal with the investment.
                  </p>
                ),
              },
              {
                id: "timeline",
                title: "What is your availability?",
                content: (
                  <p className="text-sm leading-relaxed">
                    I keep two to three client engagements active at any time to
                    maintain quality. Workshop dates are usually booked
                    4-6 weeks in advance. Coaching slots open with two weeks
                    notice.
                  </p>
                ),
              },
              {
                id: "remote",
                title: "Do you work remotely?",
                content: (
                  <p className="text-sm leading-relaxed">
                    Most advisory and coaching is conducted remotely. Workshops
                    can be delivered in-person or virtual, depending on the
                    brief.
                  </p>
                ),
              },
            ]}
          />
        </Reveal>
      </Section>

      {/* ── CTA ── */}
      <CTABanner
        title="Ready to begin?"
        description="Tell me what you are working on. A short note is enough to start."
        primary={{ label: "Get in touch", href: "/contact" }}
        secondary={{ label: "About Adesua", href: "/about" }}
      />
    </>
  );
}
