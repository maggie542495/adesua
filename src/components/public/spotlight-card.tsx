"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A card that leans toward the pointer and carries a soft gold spotlight
 * under it. Pure CSS variables + one pointer handler — no animation library,
 * no layout thrash, and it degrades to a plain card on touch.
 */
export function SpotlightCard({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    const node = ref.current;
    if (!node || event.pointerType === "touch") return;
    const rect = node.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    node.style.setProperty("--spot-x", `${x}px`);
    node.style.setProperty("--spot-y", `${y}px`);
    node.style.setProperty("--tilt-x", `${((y / rect.height) - 0.5) * -4}deg`);
    node.style.setProperty("--tilt-y", `${((x / rect.width) - 0.5) * 4}deg`);
  }

  function handlePointerLeave() {
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
  }

  return (
    <Tag
      ref={ref as never}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-border bg-card",
        "transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:border-gold-300 hover:shadow-[0_28px_60px_-32px_rgba(73,40,63,0.45)]",
        className,
      )}
      style={{
        transform: "perspective(900px) rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--spot-x,50%) var(--spot-y,50%), color-mix(in srgb, var(--gold-500) 22%, transparent), transparent 65%)",
        }}
      />
      <div className="relative">{children}</div>
    </Tag>
  );
}
