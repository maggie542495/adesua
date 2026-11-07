import type { Metadata } from "next";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/public/page-hero";
import { Section } from "@/components/public/section";
import { Reveal } from "@/components/public/reveal";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch to discuss coaching, facilitation, or advisory work. A short message is enough to start.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Let's talk"
        title="Get in touch"
        description="Tell me what you are working on. A short note is enough to start."
      />

      <Section>
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="font-display text-2xl font-medium text-plum-500">
                Start a conversation
              </h2>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-charcoal-700">
                Whether you are exploring coaching, a workshop, or a
                consulting project, I would be glad to hear what you are working
                on.
              </p>

              <div className="mt-8 space-y-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-blush-300 text-plum-500">
                    <Mail className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-plum-600">Email</p>
                    <p className="text-sm text-muted-foreground">
                      Send a message and I will respond within one working day.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-blush-300 text-plum-500">
                    <Phone className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-plum-600">Phone</p>
                    <p className="text-sm text-muted-foreground">
                      Available for calls by appointment.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-blush-300 text-plum-500">
                    <MapPin className="size-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-plum-600">Location</p>
                    <p className="text-sm text-muted-foreground">
                      Based in Lagos, available globally.
                    </p>
                  </div>
                </div>
              </div>

              <form
                action="https://formsubmit.co/example@email.com"
                method="POST"
                className="mt-8 space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-foreground"
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-foreground"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium text-foreground"
                  >
                    What brings you here?
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                  >
                    <option value="">Select an option</option>
                    <option value="coaching">Coaching engagement</option>
                    <option value="workshop">Workshop / Facilitation</option>
                    <option value="advisory">Advisory</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-foreground"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="mt-1.5 w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
                    placeholder="Tell me what you are working on..."
                  />
                </div>

                <input type="hidden" name="_captcha" value="false" />
                <input type="hidden" name="_next" value="https://adesua.com/thank-you" />

                <div className="flex items-center gap-3">
                  <Button type="submit" size="lg">
                    Send message
                    <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    I typically respond within one working day.
                  </span>
                </div>
              </form>
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
