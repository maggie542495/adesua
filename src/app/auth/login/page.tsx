import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

// Reads `?next=` / `?denied=` per request.
export const instant = false;

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ next?: string; denied?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next, denied } = await searchParams;

  return (
    <div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-gold-700">
        Admin &amp; client portal
      </p>
      <h1 className="mt-3 font-display text-4xl font-medium leading-tight text-plum-600">
        Welcome back
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Sign in to manage enquiries, content, email and the rest of the site.
      </p>

      {denied && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          That account does not have access to the admin area. Ask an owner to invite
          you, or sign in with a different account.
        </p>
      )}

      <LoginForm next={next ?? ""} />

      <p className="mt-6 border-t border-border pt-5 text-xs text-muted-foreground">
        Setting the site up for the first time?{" "}
        <Link href="/auth/setup" className="font-semibold text-plum-500 hover:text-gold-700">
          Create the owner account
        </Link>
      </p>
    </div>
  );
}
