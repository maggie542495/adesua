"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A statement that inks itself in as the reader scrolls through it.
 * Each word moves from faint to full ink on a scroll-linked progress value,
 * so the page reveals its argument at the reader's own pace.
 */
export function ScrollStory({
  text,
  signature,
}: {
  text: string;
  signature?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setProgress(1);
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const viewport = window.innerHeight;
      // 0 when the block enters the lower third, 1 when it reaches the upper third.
      const raw = (viewport * 0.85 - rect.top) / (viewport * 0.6);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const words = text.split(/\s+/).filter(Boolean);
  const lit = Math.round(progress * words.length);

  return (
    <div ref={ref} className="mx-auto max-w-3xl text-center">
      <p className="font-display text-3xl leading-[1.35] text-plum-500 sm:text-4xl md:text-[2.75rem]">
        {words.map((word, index) => (
          <span
            key={`${word}-${index}`}
            className="transition-colors duration-300"
            style={{
              color:
                index < lit
                  ? "var(--plum-500)"
                  : "color-mix(in srgb, var(--plum-500) 22%, transparent)",
            }}
          >
            {word}{" "}
          </span>
        ))}
      </p>
      {signature && (
        <p className="mt-8 font-display text-xl italic text-gold-600">{signature}</p>
      )}
    </div>
  );
}
