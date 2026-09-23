/**
 * Edge-safe Appwrite constants.
 *
 * This module is imported by `src/middleware.ts`, which runs on the Edge
 * runtime, so it must never import `node-appwrite` or `next/headers`.
 */

/** HTTP-only cookie holding the Appwrite session secret. */
export const SESSION_COOKIE = "interviewos-session";

/** Appwrite's default session lifetime is one year; the cookie mirrors it. */
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Route prefixes that require an authenticated Appwrite session. */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/practice",
  "/learn",
  "/mock-interview",
  "/profile",
] as const;

/** Where a signed-in user lands by default. */
export const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard";

/** Where an anonymous visitor is sent when a protected route is requested. */
export const SIGN_IN_ROUTE = "/login";
