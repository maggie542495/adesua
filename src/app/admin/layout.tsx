import type { Metadata } from "next";
import { connection } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { notificationFeed } from "@/lib/admin/data";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The admin frame is per-session and must never be prerendered. Without this
  // the auth client reads the clock (token expiry) during prerender, which
  // Next.js rejects as an unstable value.
  await connection();

  const { user, profile } = await requireAdmin("editor");

  // Read here, on the server: the shell is a client component and must not
  // reach for `next/headers` itself.
  const notifications = await notificationFeed(user.id);

  return (
    <AdminShell
      email={user.email ?? ""}
      role={ROLE_LABELS[profile.role]}
      name={profile.full_name ?? ""}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
