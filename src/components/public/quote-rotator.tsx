"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Quote } from "lucide-react";
import type { Recommendation } from "@/content/recommendations";
import { cn } from "@/lib/utils";

type Tone = "light" | "dark";

interface QuoteRotatorProps {
  quotes: readonly Recommendation[];
  /** Milliseconds each quote stays on screen. */
  interval?: number;
  /** "dark" for the invariant band surface, "light" for ivory/card surfaces. */
  tone?: Tone;
  className?: string;
}

const styles: Record<
  Tone,
  {
    mark: string;
    quote: string;
    author: string;
    meta: string;
    control: string;
    dotActive: string;
    dotIdle: string;
  }
> = {
  light: {
    mark: "text-gold-500",
    quote: "text-charcoal-800",
    author: "text-plum-500",
    meta: "text-caption",
    control:
      "border-border bg-card text-plum-500 hover:border-plum-500 hover:bg-plum-500 hover:text-ivory-200",
    dotActive: "bg-gold-500",
    dotIdle: "bg-plum-500/25 hover:bg-plum-500/50",
  },
  dark: {
    mark: "text-gold-300",
    quote: "text-on-band",
    author: "text-gold-300",
    meta: "text-xs text-on-band/70",
    control:
      "border-on-band/25 text-on-band hover:border-gold-300 hover:text-gold-300",
    dotActive: "bg-gold-300",
    dotIdle: "bg-on-band/25 hover:bg-on-band/50",
  },
};

/**
 * Rotating testimonial band.
 *
 * Every quote is rendered into the same grid cell, so the band is always as
 * tall as the longest quote and nothing shifts as it rotates. Inactive slides
 * are `aria-hidden`; the live region announces the current one.
 *
 * Auto-advance pauses while the pointer or keyboard focus is inside the band.
 * With reduced motion the quotes still rotate, just without the fade.
 */
export function QuoteRotator({
  quotes,
  interval = 7000,
  tone = "light",
  className,
}: QuoteRotatorProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const s = styles[tone];

  const count = quotes.length;

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, interval);
    return () => window.clearInterval(timer);
  }, [paused, count, interval]);

  if (count === 0) return null;

  const active = quotes[index];

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="group"
      aria-roledescription="carousel"
      aria-label="Recommendations"
    >
      <div className="grid">
        {quotes.map((quote, quoteIndex) => {
          const isActive = quoteIndex === index;
          return (
            <motion.figure
              key={`${quote.author}-${quote.date}`}
              className="col-start-1 row-start-1 flex flex-col items-center justify-center text-center"
              initial={false}
              animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
              aria-hidden={!isActive}
              style={{ pointerEvents: isActive ? "auto" : "none" }}
            >
              <Quote className={cn("size-7", s.mark)} aria-hidden />
              <blockquote
                className={cn(
                  "mt-5 max-w-3xl font-display text-xl leading-snug sm:text-2xl md:text-[1.75rem]",
                  s.quote,
                )}
              >
                “{quote.quote}”
              </blockquote>
              <figcaption className="mt-6">
                <p className={cn("text-sm font-semibold", s.author)}>{quote.author}</p>
                <p className={cn("mt-0.5", s.meta)}>{quote.role}</p>
                <p className={cn("mt-0.5", s.meta)}>{quote.relationship}</p>
              </figcaption>
            </motion.figure>
          );
        })}
      </div>

      {/* Screen-reader text: the current quote, announced politely. */}
      <p className="sr-only" aria-live="polite">
        {`Recommendation ${index + 1} of ${count}, from ${active.author}: ${active.quote}`}
      </p>

      {count > 1 && (
        <div className="mt-12 flex items-center justify-center gap-4 sm:mt-14">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full border transition",
              s.control,
            )}
            aria-label="Previous recommendation"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </button>

          <div className="flex items-center gap-2">
            {quotes.map((quote, dotIndex) => (
              <button
                key={`${quote.author}-${quote.date}`}
                type="button"
                onClick={() => go(dotIndex)}
                aria-label={`Show recommendation from ${quote.author}`}
                aria-current={dotIndex === index ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  dotIndex === index ? cn("w-6", s.dotActive) : cn("w-1.5", s.dotIdle),
                )}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => go(index + 1)}
            className={cn(
              "inline-flex size-9 items-center justify-center rounded-full border transition",
              s.control,
            )}
            aria-label="Next recommendation"
          >
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
