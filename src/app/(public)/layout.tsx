import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { BackToTop } from "@/components/ui/back-to-top";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <ScrollProgress />
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
      <BackToTop />
    </div>
  );
}
