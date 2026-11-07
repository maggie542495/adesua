"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionEntry {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionEntry[];
  mode?: "single" | "multiple";
  defaultOpen?: string[];
  className?: string;
}

export function Accordion({ items, mode = "single", defaultOpen = [], className }: AccordionProps) {
  const baseId = useId();
  const reduceMotion = useReducedMotion();
  const [open, setOpen] = useState<string[]>(defaultOpen);

  function toggle(id: string) {
    setOpen((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return mode === "single" ? [id] : [...current, id];
    });
  }

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;

        return (
          <div
            key={item.id}
            className={cn(
              "overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300",
              isOpen && "border-gold-300 shadow-lg shadow-plum-700/10",
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(item.id)}
                className="flex min-h-14 w-full items-center gap-4 p-4 text-left text-base font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-5 sm:text-lg"
              >
                {item.icon}
                <span className="flex-1">{item.title}</span>
                <ChevronDown
                  className={cn(
                    "size-5 shrink-0 text-plum-500 transition-transform duration-500",
                    isOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-5 sm:text-base">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
