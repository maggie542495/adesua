"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}

/** Drifts toward the mouse. Mouse only — touch sees a normal button. */
export function Magnetic({ children, className, strength = 0.22 }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const element = ref.current;
    if (!element || event.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = element.getBoundingClientRect();
    const dx = (event.clientX - rect.left - rect.width / 2) * strength;
    const dy = (event.clientY - rect.top - rect.height / 2) * strength * 1.15;
    element.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function reset() {
    if (ref.current) ref.current.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      className={cn("transition-transform duration-200 ease-out", className)}
    >
      {children}
    </div>
  );
}
