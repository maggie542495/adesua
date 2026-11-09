import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/providers/theme-provider";
import { Particles } from "@/components/public/particles";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // `public/favicon.ico` is the single source of truth for the tab icon.
  // Browsers cache `/favicon.ico` hard, so the file itself carries the
  // versioned content; the explicit list stops Next injecting its own.
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: 'any' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [{ url: siteConfig.ogImage, width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

/**
 * Runs before first paint so a dark-mode visitor never sees a white flash.
 * Mirrors `readStoredTheme` + `applyTheme` in the theme provider.
 */
const themeScript = `(function(){try{var s=localStorage.getItem("adesua-theme")||localStorage.getItem("theme")||"system";var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // The pre-paint script mutates <html>'s class/style before React hydrates.
      suppressHydrationWarning
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Particles />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
