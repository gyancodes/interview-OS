/**
 * Server-side Appwrite access.
 *
 * Marked `server-only` so it can never be imported into a client bundle — the
 * API key and the raw session secret must stay on the server.
 *
 * Two clients are created per request, never shared:
 * - an admin client (API key) for creating accounts/sessions
 * - a session client (session secret) for reading the current user
 */

import "server-only";

import { Account, Client } from "node-appwrite";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  APPWRITE_SETUP_HINT,
  getAppwriteAdminConfig,
  getAppwriteProjectConfig,
} from "@/lib/appwrite/config";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_MAX_AGE,
  SIGN_IN_ROUTE,
} from "@/lib/appwrite/constants";

import type { AuthUser } from "@/lib/appwrite/types";

/** Thrown when the Appwrite environment variables are missing. */
export class AppwriteNotConfiguredError extends Error {
  constructor() {
    super(APPWRITE_SETUP_HINT);
    this.name = "AppwriteNotConfiguredError";
  }
}

export interface AppwriteAdminClient {
  account: Account;
}

export interface AppwriteSessionClient {
  account: Account;
}

/** Admin client: bypasses rate limits and can create sessions for users. */
export function createAdminClient(): AppwriteAdminClient {
  const config = getAppwriteAdminConfig();
  if (!config) throw new AppwriteNotConfiguredError();

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);

  return {
    get account() {
      return new Account(client);
    },
  };
}

/** Session client: acts on behalf of the user in the session cookie. */
export async function createSessionClient(): Promise<AppwriteSessionClient> {
  const config = getAppwriteProjectConfig();
  if (!config) throw new AppwriteNotConfiguredError();

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) throw new Error("No Appwrite session cookie is present.");

  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setSession(session);

  return {
    get account() {
      return new Account(client);
    },
  };
}

function toAuthUser(user: {
  $id: string;
  email: string;
  name: string;
  $createdAt: string;
  emailVerification: boolean;
}): AuthUser {
  return {
    id: user.$id,
    email: user.email,
    name: user.name,
    createdAt: user.$createdAt,
    emailVerification: user.emailVerification,
  };
}

/**
 * Reads the Appwrite account for the current request, or `null` when the
 * visitor is anonymous / the session has expired. Never throws so it is safe
 * to call from any layout or page.
 */
export async function getLoggedInUser(): Promise<AuthUser | null> {
  try {
    const { account } = await createSessionClient();
    return toAuthUser(await account.get());
  } catch {
    return null;
  }
}

/** Same as {@link getLoggedInUser} but redirects anonymous visitors to sign in. */
export async function requireUser(nextPath?: string): Promise<AuthUser> {
  const user = await getLoggedInUser();
  if (!user) {
    redirect(nextPath ? `${SIGN_IN_ROUTE}?next=${encodeURIComponent(nextPath)}` : SIGN_IN_ROUTE);
  }
  return user;
}

/** Persists the Appwrite session secret in an HTTP-only cookie. */
export async function setSessionCookie(secret: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, secret, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });
}

/** Removes the session cookie (used by sign out and stale sessions). */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
