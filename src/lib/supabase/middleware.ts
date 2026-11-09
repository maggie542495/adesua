import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and gates the admin area.
 *
 * Only public + auth routes are matched (see `config.matcher` in
 * `src/middleware.ts`), so a missing Supabase configuration can never take the
 * marketing site down with it.
 */
export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // No configuration → nothing to refresh. Let the request through untouched.
  if (!url || !key) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Must run between createServerClient and the redirect logic — do not
  // insert other code here that could desync the cookie refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const isAuthRoute = path.startsWith("/auth");

  /**
   * Never redirect a server action.
   *
   * Actions POST to the URL they were dispatched from, and `NextResponse
   * .redirect` answers a POST with 307 — which replays the whole request,
   * action id included, at a different path. The action then runs against a
   * page it was not dispatched from and the browser receives HTML where React
   * expects an action payload, which surfaces as "An unexpected response was
   * received from the server."
   *
   * This is the sign-in path exactly: a POST to /auth/login that still carries
   * a session cookie was being bounced to /admin mid-flight, so the visitor was
   * signed in (a refresh showed the dashboard) but was shown a runtime error
   * instead of the dashboard.
   *
   * Letting POSTs through is safe: `signIn` redirects to /admin itself, and
   * `requireAdmin` redirects to the login screen from inside the page render.
   */
  const isNavigation = request.method === "GET" || request.method === "HEAD";

  if (isNavigation && isAdminRoute && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  // Signed in and visiting the login screen → straight to the dashboard.
  if (isNavigation && isAuthRoute && path === "/auth/login" && user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
