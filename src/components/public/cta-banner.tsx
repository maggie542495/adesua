import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/public/section";
import { Magnetic } from "@/components/public/magnetic";
import { Reveal } from "@/components/public/reveal";

interface CTALink {
  label: string;
  href: string;
}

interface CTABannerProps {
  title: string;
  description?: string;
  primary: CTALink;
  secondary?: CTALink;
}

/** Deep-plum gradient band used at the bottom of inner pages. */
export function CTABanner({ title, description, primary, secondary }: CTABannerProps) {
  return (
    <Section tone="dark" width="prose">
      <div
        aria-hidden
        className="abf-float absolute -right-16 -top-16 size-64 rounded-full bg-gold-300/25 blur-3xl"
      />
      <div
        aria-hidden
        className="abf-float absolute -bottom-20 -left-16 size-64 rounded-full bg-mauve-400/25 blur-3xl"
        style={{ animationDelay: "2s" }}
      />
      <Reveal className="relative text-center">
        <h2 className="text-h2 text-on-band">{title}</h2>
        {description && (
          <p className="mt-4 text-base leading-relaxed text-on-band/85 md:text-lg">
            {description}
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Magnetic className="block sm:inline-block">
            <Button
              asChild
              size="lg"
              variant="onDark"
              className="abf-shine h-12 w-full px-8 sm:w-auto"
            >
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight className="transition-transform duration-300 group-hover/btn:translate-x-1" />
              </Link>
            </Button>
          </Magnetic>
          {secondary && (
            <Button
              asChild
              size="lg"
              variant="outlineOnDark"
              className="h-12 w-full px-8 sm:w-auto"
            >
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          )}
        </div>
      </Reveal>
    </Section>
  );
}
