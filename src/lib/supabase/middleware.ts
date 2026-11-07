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

  if (isAdminRoute && !user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth/login";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  // Signed in and visiting the login screen → straight to the dashboard.
  if (isAuthRoute && path === "/auth/login" && user) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
