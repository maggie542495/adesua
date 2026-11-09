import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import { Linkedin } from "@/components/ui/brand-icons";
import { siteConfig } from "@/config/site";

const explore = [
  { href: "/work-with-me", label: "Work with me" },
  { href: "/about", label: "About" },
  { href: "/insights", label: "Insights" },
  { href: "/references", label: "References" },
  { href: "/contact", label: "Contact" },
] as const;

const pathways = [
  { href: "/work-with-me#personal-growth", label: "Personal growth" },
  { href: "/work-with-me#professional-impact", label: "Professional impact" },
  { href: "/insights", label: "Latest insights" },
] as const;

export function Footer() {
  const year = "2026";

  return (
    <footer className="relative overflow-hidden border-t border-border bg-gradient-to-b from-band via-band-2 to-band-3 text-on-band">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-gold-400/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -right-16 size-56 rounded-full bg-mauve-400/15 blur-3xl"
      />

      <div className="container-site relative grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/icon.png"
              alt="Adesua Oriaifo logo"
              width={44}
              height={44}
              className="size-11 rounded-full object-cover ring-1 ring-gold-400/60"
            />
            <div>
              <p className="font-display text-2xl font-medium leading-tight">Adesua Oriaifo</p>
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-gold-300">
                {siteConfig.disciplines}
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-sm text-sm leading-relaxed text-on-band-muted">
            {siteConfig.philosophy}
          </p>
          <p className="text-signature mt-5 text-xl text-gold-300">{siteConfig.signature}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${siteConfig.links.email}`}
              className="inline-flex items-center gap-2 rounded-full border border-on-band/25 px-4 py-2 text-xs font-medium text-on-band transition hover:border-gold-300 hover:text-gold-300"
            >
              <Mail className="size-4" aria-hidden />
              {siteConfig.links.email}
            </a>
            <a
              href={siteConfig.links.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-10 items-center justify-center rounded-full border border-on-band/25 text-on-band transition hover:border-gold-300 hover:text-gold-300"
              aria-label="Adesua Oriaifo on LinkedIn"
            >
              <Linkedin className="size-4" aria-hidden />
            </a>
            <span className="inline-flex items-center gap-1.5 text-xs text-on-band/70">
              <MapPin className="size-4" aria-hidden />
              {siteConfig.location}
            </span>
          </div>
        </div>

        <nav aria-label="Explore">
          <p className="text-eyebrow text-gold-300">Explore</p>
          <ul className="mt-4 space-y-3 text-sm">
            {explore.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group inline-flex items-center gap-1 text-on-band/85 transition hover:text-gold-300"
                >
                  <span className="relative">
                    {item.label}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-300 transition-transform duration-300 group-hover:scale-x-100"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Pathways">
          <p className="text-eyebrow text-gold-300">Pathways</p>
          <ul className="mt-4 space-y-3 text-sm">
            {pathways.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="group inline-flex items-center gap-1 text-on-band/85 transition hover:text-gold-300"
                >
                  <span className="relative">{item.label}</span>
                  <ArrowUpRight className="size-3.5 opacity-0 transition group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs leading-relaxed text-on-band/60">
            {siteConfig.principles}
          </p>
        </nav>
      </div>

      <div className="relative border-t border-on-band/15">
        <div className="container-site flex flex-col gap-2 py-5 text-xs text-on-band/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}
          </p>
          <p>{siteConfig.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
