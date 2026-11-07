"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { ArrowUp } from "lucide-react";

/** Appears after 600px of scroll; returns to the top. */
export function BackToTop() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => setVisible(latest > 600));

  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={scrollToTop}
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-plum-500 text-ivory-200 shadow-lg shadow-plum-500/40 transition-colors hover:bg-plum-600"
        >
          <ArrowUp className="size-5" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
