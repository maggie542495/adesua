import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Server-only client using the secret (service-role) key.
 * Bypasses RLS — use exclusively in trusted server code
 * (API route handlers, services, seed scripts).
 * Never import from client components.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase admin client missing SUPABASE_URL or SUPABASE_SECRET_KEY",
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
