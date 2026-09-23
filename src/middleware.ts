import { NextResponse, type NextRequest } from "next/server";

import {
  PROTECTED_ROUTE_PREFIXES,
  SESSION_COOKIE,
  SIGN_IN_ROUTE,
} from "@/lib/appwrite/constants";

/**
 * Route protection for the app area.
 *
 * Middleware runs on the Edge runtime, so it only checks that a session cookie
 * exists — an intentionally cheap check that avoids a network round trip on
 * every navigation. The cookie is fully verified against Appwrite inside the
 * `(app)` layout via `requireUser()`.
 *
 * Auth pages are deliberately *not* redirected here: with a stale cookie,
 * `/login` would bounce to the dashboard whose layout bounces back — an
 * infinite redirect loop. They validate the session themselves instead.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSessionCookie && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = SIGN_IN_ROUTE;
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export const config = {
  // Must stay a literal array: Next.js statically analyses `config.matcher`.
  matcher: [
    "/dashboard/:path*",
    "/practice/:path*",
    "/learn/:path*",
    "/mock-interview/:path*",
    "/profile/:path*",
  ],
};
