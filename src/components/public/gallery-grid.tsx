"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryItem } from "@/repositories/gallery-repository";
import { cn } from "@/lib/utils";

export function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(items.map((item) => item.category)))],
    [items],
  );
  const [category, setCategory] = useState("All");
  const [active, setActive] = useState<number | null>(null);

  const visible = useMemo(
    () => (category === "All" ? items : items.filter((item) => item.category === category)),
    [items, category],
  );

  useEffect(() => {
    if (active === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActive(null);
      if (event.key === "ArrowRight") setActive((i) => (i === null ? i : (i + 1) % visible.length));
      if (event.key === "ArrowLeft")
        setActive((i) => (i === null ? i : (i - 1 + visible.length) % visible.length));
    };

    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active, visible.length]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-plum-500/25 bg-ivory-100 p-12 text-center">
        <p className="font-display text-2xl text-plum-500">The gallery is being curated.</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Photographs from coaching sessions, workshops and speaking engagements will
          appear here as they are published from the studio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setCategory(name)}
            aria-pressed={category === name}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
              category === name
                ? "border-plum-500 bg-plum-500 text-ivory-200"
                : "border-border bg-card text-charcoal-700 hover:border-gold-400 hover:text-plum-600",
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
        {visible.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(index)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition duration-500 hover:-translate-y-1 hover:border-gold-300 hover:shadow-xl"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={item.imageUrl}
                alt={item.alt_text || item.title}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
                className="object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
              />
            </div>
            {/* Invariant band scrim — over a photograph, so it must stay deep
                in both themes. --plum-900 inverts to near-white in dark mode. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-band-3/90 via-band-3/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 translate-y-3 p-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-300">
                {item.category}
              </p>
              <p className="mt-1 font-display text-lg text-on-band">{item.title}</p>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-on-band/85">{item.description}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {active !== null && visible[active] && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={visible[active].title}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-band-3/95 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close image"
            className="absolute right-5 top-5 flex size-10 items-center justify-center rounded-full bg-on-band/10 text-on-band transition hover:bg-on-band/20"
          >
            <X className="size-5" aria-hidden />
          </button>

          {visible.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((i) => (i === null ? i : (i - 1 + visible.length) % visible.length));
                }}
                className="absolute left-3 flex size-11 items-center justify-center rounded-full bg-on-band/10 text-on-band transition hover:bg-on-band/20 sm:left-6"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next image"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((i) => (i === null ? i : (i + 1) % visible.length));
                }}
                className="absolute right-3 flex size-11 items-center justify-center rounded-full bg-on-band/10 text-on-band transition hover:bg-on-band/20 sm:right-6"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}

          <figure
            className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-[4/3] bg-band-3">
              <Image
                src={visible[active].imageUrl}
                alt={visible[active].alt_text || visible[active].title}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            <figcaption className="p-5">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-700">
                {visible[active].category}
              </p>
              <p className="mt-1 font-display text-xl text-plum-600">
                {visible[active].title}
              </p>
              {visible[active].description && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {visible[active].description}
                </p>
              )}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
