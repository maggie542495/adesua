"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/public/magnetic";
import { useContact } from "@/components/public/contact-provider";

export interface HeroAction {
  label: string;
  href: string;
}

interface HeroProps {
  eyebrow: string;
  headline: string;
  subheadline: string;
  body: string;
  primary: HeroAction;
  secondary: HeroAction;
  image: string;
  imageAlt: string;
}

const ease = [0.16, 1, 0.3, 1] as const;

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function Hero({
  eyebrow,
  headline,
  subheadline,
  body,
  primary,
  secondary,
  image,
  imageAlt,
}: HeroProps) {
  const reduceMotion = useReducedMotion();
  const contact = useContact();
  const words = splitWords(headline);

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.055, delayChildren: 0.15 } },
  };

  const word = {
    hidden: reduceMotion ? { y: 0, opacity: 1 } : { y: "110%", opacity: 0 },
    show: { y: 0, opacity: 1, transition: { duration: 0.9, ease } },
  };

  const fade = {
    hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } },
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_45%_at_12%_0%,rgba(242,230,233,0.75),transparent_65%),radial-gradient(ellipse_45%_40%_at_92%_15%,rgba(237,218,202,0.6),transparent_60%)]"
      />

      {/* Same rhythm as the About hero: copy left, portrait card right. */}
      <div className="container-site relative grid items-center gap-10 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="relative z-10 max-w-xl">
          <motion.p variants={fade} initial="hidden" animate="show" className="text-eyebrow">
            {eyebrow}
          </motion.p>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="text-h1 mt-3 text-plum-500"
          >
            {words.map((wordText, index) => (
              <span
                key={`${wordText}-${index}`}
                className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom"
              >
                <motion.span variants={word} className="inline-block">
                  {wordText}
                </motion.span>
              </span>
            ))}
          </motion.h1>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.55 }}
            className="mt-5 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold-700"
          >
            <span aria-hidden className="h-px w-10 shrink-0 bg-gold-500" />
            {subheadline}
          </motion.p>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.68 }}
            className="text-lead mt-4 max-w-lg whitespace-pre-line"
          >
            {body}
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.82 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Magnetic>
              <Button asChild size="lg" className="abf-shine h-12 px-8">
                <Link href={primary.href}>
                  {primary.label}
                  <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline" className="h-12 px-8">
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          </motion.div>

          {contact.location && (
            <motion.p
              variants={fade}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.95 }}
              className="mt-6 flex items-center gap-2 text-caption"
            >
              <MapPin className="size-4 text-gold-600" aria-hidden />
              {contact.location}
            </motion.p>
          )}
        </div>

        {/* Portrait card — inset, rounded, blush halo behind it, as on About. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div aria-hidden className="absolute inset-6 -z-10 rounded-full bg-blush-300/70" />

          <div className="relative overflow-hidden rounded-2xl shadow-[0_24px_60px_-30px_rgba(73,40,63,0.45)]">
            <Image
              src={image}
              alt={imageAlt}
              width={720}
              height={900}
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="aspect-[4/5] w-full object-cover object-top"
            />
            <div aria-hidden className="absolute inset-0 bg-gold-500/10 mix-blend-soft-light" />
          </div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.7, ease }}
            className="absolute -bottom-5 left-4 rounded-2xl border border-border bg-card px-5 py-3 shadow-xl shadow-plum-900/10 sm:left-6"
          >
            <p className="text-signature text-lg text-gold-600">Lead with Care.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
