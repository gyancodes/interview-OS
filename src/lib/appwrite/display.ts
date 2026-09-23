/**
 * Presentation helpers for an Appwrite account.
 *
 * Lives outside `AuthProvider` (a client component) and outside
 * `lib/appwrite/server` (server-only) so both server components and client
 * components can import the same logic.
 */

import type { AuthUser } from "@/lib/appwrite/types";

/** Name, falling back to the email handle. */
export function displayNameFor(user: AuthUser | null): string {
  if (!user) return "";
  const name = user.name.trim();
  if (name) return name;
  const handle = user.email.split("@")[0];
  return handle ?? user.email;
}

/** First name only — used for greetings. */
export function firstNameFor(user: AuthUser | null): string {
  const name = displayNameFor(user).trim();
  if (!name) return "";
  return name.split(/\s+/)[0] ?? "";
}

/** One or two characters for avatars. */
export function initialsFor(user: AuthUser | null): string {
  if (!user) return "?";
  const source = user.name.trim() || user.email;
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1];
  return `${first[0]}${last?.[0] ?? ""}`.toUpperCase();
}

/** Time-based greeting for the dashboard header. */
export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
