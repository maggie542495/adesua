"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useScroll } from "framer-motion";
import { Menu, X, ArrowRight, Mail } from "lucide-react";
import { Linkedin } from "@/components/ui/brand-icons";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/public/theme-toggle";

const nav = [
  { href: "/work-with-me", label: "Work with me" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    return scrollY.on("change", (latest) => setIsScrolled(latest > 12));
  }, [scrollY]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      {/*
        The header used to animate an inline `width` between 100% and a pixel
        value on a `fixed` flex child. Any rounding at that boundary pushed the
        bar past the viewport and made every page slide sideways. Width is now
        driven purely by max-width classes inside a full-width, hard-capped
        wrapper, so it cannot overflow.
      */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 w-full">
        <header
          className={cn(
            "pointer-events-auto mx-auto flex w-full items-center justify-between gap-2 border backdrop-blur-xl",
            "transition-[max-width,margin,border-radius,background-color,border-color,box-shadow,padding] duration-300 ease-out",
            isScrolled
              ? "mt-2 max-w-[min(calc(100%_-_1.5rem),68rem)] rounded-full border-border bg-ivory-200/90 px-3 py-2 shadow-xl shadow-plum-900/15 sm:px-4"
              : "mt-0 max-w-full rounded-none border-transparent bg-ivory-200/70 px-4 py-3.5 sm:px-6 lg:px-8",
          )}
        >
          <Link
            href="/"
            className="group flex min-w-0 shrink items-center gap-3"
            onClick={() => setMenuOpen(false)}
          >
            <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1 ring-gold-400/50">
              <Image
                src="/brand/icon.png"
                alt="Adesua Oriaifo logo"
                width={40}
                height={40}
                priority
                className="size-10 object-cover"
              />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-lg font-semibold tracking-tight text-plum-600 sm:text-xl">
                Adesua Oriaifo
              </span>
              <span className="hidden truncate text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold-700 sm:block">
                {siteConfig.tagline}
              </span>
            </span>
          </Link>

          <nav
            aria-label="Primary"
            className="hidden shrink-0 items-center gap-6 md:flex lg:gap-8"
          >
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative py-1 text-sm font-medium transition-colors",
                    active
                      ? "text-plum-600"
                      : "text-charcoal-700 hover:text-plum-600",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 -bottom-0.5 h-px origin-left bg-gold-500 transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/contact">
                Get in touch
                <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </Button>
            <button
              type="button"
              className="flex size-10 items-center justify-center rounded-full text-plum-500 transition hover:bg-blush-300 md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </header>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[55] flex flex-col overflow-y-auto bg-ivory-200 md:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
                <Image
                  src="/brand/icon.png"
                  alt="Adesua Oriaifo logo"
                  width={40}
                  height={40}
                  className="size-10 rounded-full object-cover ring-1 ring-gold-400/50"
                />
                <span className="font-display text-xl font-medium text-plum-600">
                  Adesua Oriaifo
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="flex size-10 items-center justify-center rounded-full text-plum-500 hover:bg-blush-300"
                onClick={() => setMenuOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <nav aria-label="Mobile" className="flex flex-1 flex-col gap-1 px-4 pb-10 pt-4">
              {[{ href: "/", label: "Home" }, ...nav].map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 + index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-4 py-4 font-display text-2xl text-plum-600 transition hover:bg-blush-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                    <ArrowRight className="size-5 text-gold-600" />
                  </Link>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="mt-6 space-y-3"
              >
                <Button asChild size="lg" className="w-full">
                  <Link href="/contact" onClick={() => setMenuOpen(false)}>
                    Start a conversation
                    <ArrowRight />
                  </Link>
                </Button>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-plum-500/5 p-4">
                  <span className="text-sm font-medium text-plum-700">
                    Prefer to write directly?
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`mailto:${siteConfig.links.email}`}
                      aria-label="Email Adesua"
                      className="flex size-9 items-center justify-center rounded-full border border-gold-500/40 text-gold-700 transition hover:bg-gold-500/15"
                    >
                      <Mail className="size-4" />
                    </a>
                    <a
                      href={siteConfig.links.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Adesua on LinkedIn"
                      className="flex size-9 items-center justify-center rounded-full border border-gold-500/40 text-gold-700 transition hover:bg-gold-500/15"
                    >
                      <Linkedin className="size-4" />
                    </a>
                  </div>
                </div>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
