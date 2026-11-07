"use client";

import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme } from "@/providers/theme-provider";

/**
 * Two-state toggle. It flips whatever is currently on screen, so a click can
 * never be a no-op — the three-way "light → dark → system" cycle used to leave
 * people pressing it twice with nothing appearing to happen.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={isDark}
      className={
        className ??
        "group relative flex size-10 items-center justify-center overflow-hidden rounded-full border border-transparent text-plum-500 transition hover:border-plum-500/25 hover:bg-blush-300/70"
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "dark" : "light"}
          initial={{ opacity: 0, rotate: -90, scale: 0.4 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.4 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="size-5" aria-hidden />
          ) : (
            <Sun className="size-5" aria-hidden />
          )}
        </motion.span>
      </AnimatePresence>
      <span className="sr-only">Toggle colour theme</span>
    </button>
  );
}
