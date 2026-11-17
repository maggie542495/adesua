import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { BackToTop } from "@/components/ui/back-to-top";
import { ZeeWidget } from "@/components/public/zee-widget";
import { ContactProvider } from "@/components/public/contact-provider";
import { getContactDetails } from "@/lib/site/contact";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  /* Read once per request from `site_settings` and hand the same values to the
     whole public tree, so every surface shows what the dashboard says. */
  const contact = await getContactDetails();

  return (
    <ContactProvider value={contact}>
      <div className="flex min-h-full flex-col">
        <ScrollProgress />
        <Navbar />
        <main className="flex-1 pt-16">{children}</main>
        <Footer />
        <BackToTop />
        <ZeeWidget />
      </div>
    </ContactProvider>
  );
}
