"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/public/section";
import { Reveal } from "@/components/public/reveal";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_15%_0%,rgba(242,230,233,0.9),transparent_65%),radial-gradient(ellipse_50%_45%_at_95%_20%,rgba(237,218,202,0.75),transparent_60%)]"
      />

      <Section className="!py-28 flex items-center justify-center">
        <div className="text-center">
          <Reveal>
            <h1 className="text-display text-8xl text-plum-500">404</h1>
            <p className="text-h2 mt-6 text-plum-500">Page not found</p>
            <p className="text-lead mx-auto mt-4 max-w-md text-muted-foreground">
              The page you are looking for may have been moved, deleted, or does
              not exist.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/">
                  Go home
                  <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/contact">Contact us</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
