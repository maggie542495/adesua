import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  /**
   * Only the portal needs a session. The marketing pages must never depend on
   * Supabase being reachable — an earlier matcher covered every route, so a
   * misconfigured client took the entire public site down with a 500.
   */
  matcher: ["/admin/:path*", "/auth/:path*"],
};
