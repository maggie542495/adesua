"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { Section } from "@/components/public/section";
import { Reveal } from "@/components/public/reveal";
import { Button } from "@/components/ui/button";
import { Linkedin as LinkedinIcon } from "@/components/ui/brand-icons";
import { siteConfig } from "@/config/site";
import { submitEnquiry, type EnquiryState } from "./actions";

const inputClass =
  "mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2.5 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500";

const initialState: EnquiryState = { status: "idle" };

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState<EnquiryState, FormData>(
    submitEnquiry,
    initialState,
  );
  const [sent, setSent] = useState(false);

  // A successful submit swaps the form for a receipt; "send another" brings it back.
  const showReceipt = state.status === "success" && !sent && Boolean(state.message);

  return (
    <>
      <PageHero
        eyebrow="Let's talk"
        title="Get in touch"
        description="Tell me what you are working on. A short note is enough to start."
      />

      <Section>
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Details */}
          <Reveal>
            <div className="space-y-8">
              <div>
                <p className="text-eyebrow">Direct lines</p>
                <h2 className="mt-3 font-display text-3xl text-plum-500">
                  Prefer to reach out yourself?
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Email is the fastest route. Phone calls are by appointment,
                  Monday to Friday.
                </p>
              </div>

              <ul className="space-y-4">
                <li>
                  <a
                    href={`mailto:${siteConfig.links.email}`}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-md"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blush-300 text-plum-500">
                      <Mail className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-plum-600">Email</span>
                      <span className="block break-all text-sm text-charcoal-700">
                        {siteConfig.links.email}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Typically answered within one working day.
                      </span>
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href={`tel:${siteConfig.phoneHref}`}
                    className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-md"
                  >
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blush-300 text-plum-500">
                      <Phone className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-plum-600">Phone</span>
                      <span className="block text-sm text-charcoal-700">
                        {siteConfig.phone}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Calls by appointment, Mon–Fri, 9:00–17:00.
                      </span>
                    </span>
                  </a>
                </li>

                <li className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blush-300 text-plum-500">
                    <MapPin className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-plum-600">Studio</span>
                    <span className="block text-sm text-charcoal-700">
                      {siteConfig.locationLong}
                    </span>
                  </span>
                </li>

                <li className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blush-300 text-plum-500">
                    <Clock className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-plum-600">Hours</span>
                    <span className="block text-sm text-charcoal-700">
                      Monday to Friday, 9:00–17:00 (WAT)
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Out of hours? Zee, the site assistant, will take your details
                      and I will reply on the next working day.
                    </span>
                  </span>
                </li>
              </ul>

              <a
                href={siteConfig.links.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-plum-600 transition hover:text-gold-700"
              >
                <LinkedinIcon className="size-4" aria-hidden />
                Connect
                <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              {showReceipt ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto size-12 text-gold-600" aria-hidden />
                  <h2 className="mt-4 font-display text-3xl text-plum-500">
                    Message received
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-charcoal-700">
                    {state.message}
                  </p>
                  {state.reference && (
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      Reference {state.reference.slice(0, 8)}
                    </p>
                  )}
                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    <Button variant="outline" onClick={() => setSent(true)}>
                      Send another message
                    </Button>
                    <Button asChild>
                      <Link href="/insights">
                        Read the writing
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <form action={formAction} className="space-y-5" noValidate>
                  <div>
                    <h2 className="font-display text-2xl text-plum-500">
                      Send a note
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Every field marked is enough to start a conversation.
                    </p>
                  </div>

                  {state.status === "error" && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300"
                    >
                      {state.message}
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-foreground">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        autoComplete="name"
                        defaultValue={state.values?.name ?? ""}
                        className={inputClass}
                        placeholder="Your name"
                      />
                      {state.fieldErrors?.name && (
                        <p className="mt-1 text-xs text-red-600">{state.fieldErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-foreground">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        autoComplete="email"
                        defaultValue={state.values?.email ?? ""}
                        className={inputClass}
                        placeholder="your@email.com"
                      />
                      {state.fieldErrors?.email && (
                        <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                        Phone <span className="text-muted-foreground">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        autoComplete="tel"
                        defaultValue={state.values?.phone ?? ""}
                        className={inputClass}
                        placeholder="+234…"
                      />
                    </div>
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-foreground">
                        What brings you here?
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        defaultValue={state.values?.category ?? ""}
                        className={inputClass}
                      >
                        <option value="">Select an option</option>
                        {siteConfig.enquiryTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {state.fieldErrors?.category && (
                        <p className="mt-1 text-xs text-red-600">
                          {state.fieldErrors.category}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground">
                      Subject <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      defaultValue={state.values?.subject ?? ""}
                      className={inputClass}
                      placeholder="A brief subject line"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      defaultValue={state.values?.message ?? ""}
                      className={inputClass}
                      placeholder="Tell me what you are working on…"
                    />
                    {state.fieldErrors?.message && (
                      <p className="mt-1 text-xs text-red-600">{state.fieldErrors.message}</p>
                    )}
                  </div>

                  {/* Honeypot */}
                  <div className="hidden" aria-hidden>
                    <label htmlFor="company">Company</label>
                    <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" size="lg" disabled={isPending}>
                      {isPending ? "Sending…" : "Send message"}
                      {!isPending && <ArrowRight />}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      You will receive a confirmation email.
                    </span>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
