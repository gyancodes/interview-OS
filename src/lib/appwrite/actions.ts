"use server";

/**
 * Appwrite auth server actions.
 *
 * The browser never talks to Appwrite directly and never sees the API key —
 * these actions run on the server, exchange credentials for a session with the
 * Appwrite Node SDK, and persist the session secret in an HTTP-only cookie.
 *
 * They intentionally do *not* redirect on success: the client performs a full
 * navigation so the server re-renders the layout with the new user (and the
 * per-user LocalStorage scope is applied) in one deterministic step.
 */

import { ID } from "node-appwrite";

import { mapAuthError } from "@/lib/appwrite/errors";
import {
  AppwriteNotConfiguredError,
  clearSessionCookie,
  createAdminClient,
  createSessionClient,
  setSessionCookie,
} from "@/lib/appwrite/server";
import type { AuthActionState } from "@/lib/appwrite/types";

const MIN_PASSWORD_LENGTH = 8;
const MIN_NAME_LENGTH = 2;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const DEFAULT_POST_AUTH_ROUTE = "/dashboard";

/** Only same-origin, path-relative redirects are allowed after sign in/up. */
function sanitizeNextPath(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_POST_AUTH_ROUTE;
  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return DEFAULT_POST_AUTH_ROUTE;
  return trimmed;
}

function readString(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function validateCredentials(formData: FormData, includeName: boolean): {
  values: { email: string; password: string; name: string };
  fieldErrors: Record<string, string>;
} {
  const email = readString(formData, "email").toLowerCase();
  const password = readString(formData, "password");
  const name = readString(formData, "name");
  const fieldErrors: Record<string, string> = {};

  if (!email) {
    fieldErrors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    fieldErrors.email = "Enter a valid email address.";
  }

  if (!password) {
    fieldErrors.password = "Password is required.";
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    fieldErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (includeName && name.length > 0 && name.length < MIN_NAME_LENGTH) {
    fieldErrors.name = "Enter your name so we can personalise your dashboard.";
  } else if (includeName && !name) {
    fieldErrors.name = "Name is required.";
  }

  return { values: { email, password, name }, fieldErrors };
}

function hasErrors(fieldErrors: Record<string, string>): boolean {
  return Object.keys(fieldErrors).length > 0;
}

/**
 * Creates an Appwrite account and immediately starts a session so the user
 * lands on their dashboard without a second step.
 */
export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { values, fieldErrors } = validateCredentials(formData, true);
  if (hasErrors(fieldErrors)) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  try {
    const { account } = createAdminClient();

    try {
      await account.create({
        userId: ID.unique(),
        email: values.email,
        password: values.password,
        name: values.name,
      });
    } catch (createError) {
      return { status: "error", message: mapAuthError(createError) };
    }

    const session = await account.createEmailPasswordSession({
      email: values.email,
      password: values.password,
    });
    await setSessionCookie(session.secret);

    return { status: "success", redirectTo: sanitizeNextPath(formData.get("next")) };
  } catch (error) {
    if (error instanceof AppwriteNotConfiguredError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: mapAuthError(error) };
  }
}

/** Exchanges an email/password pair for an Appwrite session. */
export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const { values, fieldErrors } = validateCredentials(formData, false);
  if (hasErrors(fieldErrors)) {
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  try {
    const { account } = createAdminClient();
    const session = await account.createEmailPasswordSession({
      email: values.email,
      password: values.password,
    });
    await setSessionCookie(session.secret);
    return { status: "success", redirectTo: sanitizeNextPath(formData.get("next")) };
  } catch (error) {
    return { status: "error", message: mapAuthError(error) };
  }
}

/**
 * Revokes the Appwrite session (best effort) and always clears the cookie, so
 * signing out can never leave the browser in a half-authenticated state.
 */
export async function signOutAction(): Promise<void> {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession({ sessionId: "current" });
  } catch {
    // Session already revoked, expired, or Appwrite unreachable — the cookie
    // still has to go.
  }
  await clearSessionCookie();
}
