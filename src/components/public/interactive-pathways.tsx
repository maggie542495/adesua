"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PathwayPanel {
  slug: string;
  title: string;
  summary: string;
  href: string;
  image: string;
  topics: string[];
  eyebrow: string;
}

/**
 * Two panels that trade width on hover/focus — the reader's attention decides
 * which pathway opens. On touch (and for keyboard users) the first panel is
 * open by default and tapping a panel opens it.
 */
export function InteractivePathways({ panels }: { panels: PathwayPanel[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4 lg:h-[30rem] lg:flex-row">
      {panels.map((panel, index) => {
        const isActive = active === index;
        return (
          <Link
            key={panel.slug}
            href={panel.href}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            onClick={() => setActive(index)}
            className={cn(
              "group relative flex min-h-[16rem] flex-col justify-end overflow-hidden rounded-2xl border border-border p-6 transition-[flex-grow,border-color,box-shadow] duration-700 ease-out sm:p-8",
              isActive
                ? "lg:grow-[2.1] border-gold-300 shadow-[0_30px_70px_-40px_rgba(73,40,63,0.6)]"
                : "lg:grow-[1] hover:border-gold-300/70",
            )}
          >
            <Image
              src={panel.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className={cn(
                "object-cover object-center transition-all duration-[1200ms]",
                isActive ? "scale-105 opacity-100" : "scale-100 opacity-80 grayscale-[35%]",
              )}
            />
            {/* The scrim sits over a photograph, so it must stay deep in both
                themes — the invariant --band-* tokens, never --plum-900, which
                inverts to near-white in dark mode and washes the text out. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-band-3/95 via-band-2/65 to-band-3/20"
            />
            <div
              aria-hidden
              className={cn(
                "absolute inset-x-0 top-0 h-1 bg-gold-400 transition-transform duration-700",
                isActive ? "scale-x-100" : "scale-x-0",
              )}
            />

            <div className="relative">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-gold-300">
                {panel.eyebrow}
              </p>
              <h3 className="mt-2 font-display text-3xl leading-tight text-on-band sm:text-4xl">
                {panel.title}
              </h3>

              <div
                className={cn(
                  "grid transition-all duration-700 ease-out",
                  isActive
                    ? "mt-3 grid-rows-[1fr] opacity-100"
                    : "mt-0 grid-rows-[0fr] opacity-0 lg:opacity-0",
                )}
              >
                <div className="overflow-hidden">
                  <p className="max-w-md text-sm leading-relaxed text-on-band/90">
                    {panel.summary}
                  </p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {panel.topics.slice(0, 6).map((topic) => (
                      <li
                        key={topic}
                        className="rounded-full border border-on-band/30 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-on-band/90"
                      >
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
                Explore
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
