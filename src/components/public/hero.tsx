"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/public/magnetic";

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
    <section className="relative -mt-16 overflow-hidden border-b border-border">
      {/* ambient wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_15%_0%,rgba(242,230,233,0.9),transparent_65%),radial-gradient(ellipse_50%_45%_at_95%_20%,rgba(237,218,202,0.75),transparent_60%)]"
      />
      <div
        aria-hidden
        className="abf-float pointer-events-none absolute -left-24 top-1/3 -z-10 size-72 rounded-full bg-mauve-200/45 blur-3xl"
      />

      <div className="container-site grid items-center gap-12 pb-16 pt-28 md:pb-24 md:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-28 lg:pt-40">
        {/* ── Copy ── */}
        <div className="max-w-xl">
          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            className="text-eyebrow"
          >
            {eyebrow}
          </motion.p>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="text-display mt-4 text-[clamp(2.75rem,6vw,4.75rem)] text-plum-500"
          >
            {words.map((wordText, index) => (
              <span
                key={`${wordText}-${index}`}
                className="mr-[0.28em] inline-block overflow-hidden pb-[0.08em] align-bottom"
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
            className="mt-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold-700"
          >
            <span aria-hidden className="h-px w-10 bg-gold-500" />
            {subheadline}
          </motion.p>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.68 }}
            className="mt-5 max-w-lg text-lg leading-relaxed text-charcoal-700 md:text-xl"
          >
            {body}
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 0.82 }}
            className="mt-9 flex flex-wrap items-center gap-3"
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

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            transition={{ delay: 1 }}
            className="mt-14 hidden items-center gap-3 text-caption md:flex"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-plum-500/25 text-plum-500">
              <ArrowDown className="abf-bob size-4" aria-hidden />
            </span>
            Scroll to explore
          </motion.div>
        </div>

        {/* ── Portrait ── */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className="relative mx-auto w-full max-w-sm lg:max-w-none"
        >
          <div
            aria-hidden
            className="absolute inset-x-6 bottom-4 top-10 -z-10 rounded-[2.5rem] bg-gradient-to-br from-blush-300 via-ivory-100 to-gold-100"
          />
          <div
            aria-hidden
            className="abf-float absolute -right-5 -top-5 -z-10 size-28 rounded-full border border-gold-400/60"
          />
          <div
            aria-hidden
            className="abf-float absolute -bottom-6 -left-6 -z-10 size-20 rounded-full bg-plum-500/10"
            style={{ animationDelay: "3s" }}
          />

          <div className="abf-float relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-[0_40px_80px_-45px_rgba(73,40,63,0.55)]">
            <Image
              src={image}
              alt={imageAlt}
              width={720}
              height={900}
              priority
              className="aspect-[4/5] w-full object-cover object-top"
            />
          </div>

          {/* signature chip */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.7, ease }}
            className="absolute -bottom-5 left-4 rounded-2xl border border-border bg-card px-5 py-3 shadow-xl shadow-plum-900/10 sm:left-8"
          >
            <p className="text-signature text-lg text-gold-600">Lead with Care.</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
