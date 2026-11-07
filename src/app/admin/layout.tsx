import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { AdminSidebar } from "@/components/admin/sidebar";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { signOut } from "@/lib/admin/actions";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireAdmin("editor");

  return (
    <div className="flex min-h-screen bg-ivory-100">
      <AdminSidebar email={user.email} role={ROLE_LABELS[profile.role]} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-ivory-200/90 px-4 py-3 pl-16 backdrop-blur-md lg:px-8 lg:pl-8">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-plum-600">
              {profile.full_name || user.email}
            </p>
            <p className="text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground">
              {ROLE_LABELS[profile.role]}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-plum-600 transition hover:border-gold-400 hover:text-gold-700 sm:inline-flex"
            >
              View site
              <ExternalLink className="size-3.5" aria-hidden />
            </Link>
            <ThemeToggle />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-plum-600 transition hover:border-destructive/50 hover:text-destructive"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
