import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Client access",
  robots: { index: false, follow: false },
};

/**
 * Split-screen shell for every auth screen.
 *
 * Left: the author's own portrait, held still behind an invariant plum wash so
 * it reads the same in light and dark. Right: the form, on the page surface.
 * Below `lg` the portrait collapses to a short banner and the form takes the
 * full width — a phone should never scroll past a full-height photo to reach
 * a password field.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
      <aside className="relative flex min-h-[13rem] flex-col justify-between overflow-hidden bg-band px-6 py-7 text-on-band sm:px-9 lg:min-h-dvh lg:px-12 lg:py-12">
        <Image
          src={siteConfig.ogImage}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 48vw, 100vw"
          className="object-cover object-[50%_16%] opacity-50 sm:opacity-55"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-band/85 via-band/65 to-band/95"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-band to-transparent"
        />

        <div className="relative flex items-center gap-3">
          <Image
            src="/brand/icon.png"
            alt=""
            width={40}
            height={40}
            priority
            className="size-10 shrink-0 rounded-full ring-1 ring-gold-400/60"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-xl leading-tight">{siteConfig.name}</p>
            <p className="truncate text-[0.6rem] uppercase tracking-[0.2em] text-gold-300">
              {siteConfig.disciplines}
            </p>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <p className="max-w-sm font-display text-[clamp(1.9rem,2.5vw,2.75rem)] leading-[1.15]">
            {siteConfig.signature}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-on-band/75">
            {siteConfig.promise}
          </p>
        </div>

        <p className="relative mt-6 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-gold-300/90 lg:mt-0">
          <ShieldCheck className="size-3.5 shrink-0" aria-hidden />
          Private workspace
        </p>
      </aside>

      <main className="flex flex-col justify-center bg-ivory-200 px-5 py-10 sm:px-8 lg:px-14 lg:py-12">
        <div className="mx-auto w-full max-w-md">{children}</div>

        <p className="mx-auto mt-10 w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground transition hover:text-plum-600"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to the website
          </Link>
        </p>
      </main>
    </div>
  );
}
