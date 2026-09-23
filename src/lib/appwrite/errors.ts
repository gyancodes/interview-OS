/**
 * Maps Appwrite / network failures onto messages a candidate can act on.
 * Kept in one place so sign up, sign in and sign out stay consistent.
 */

import { AppwriteException } from "node-appwrite";

import { AppwriteNotConfiguredError } from "@/lib/appwrite/server";

const GENERIC_FAILURE = "We could not sign you in right now. Please try again in a moment.";
const NETWORK_FAILURE =
  "Could not reach the authentication service. Check your connection and try again.";

/** Appwrite error types we translate explicitly. */
const TYPE_MESSAGES: Record<string, string> = {
  user_already_exists: "An account with this email already exists. Try signing in instead.",
  user_invalid_credentials: "Incorrect email or password.",
  user_password_recently_used: "That password was used recently. Choose a different one.",
  user_password_personal_data:
    "Your password cannot contain personal details from your profile.",
  user_blocked: "This account has been blocked. Contact support if this looks wrong.",
  password_personal_data: "Your password cannot contain personal details from your profile.",
  general_argument_invalid:
    "Those details are not valid. Check the email format and make sure your password has at least 8 characters.",
  general_rate_limit_exceeded: "Too many attempts. Wait a minute and try again.",
  project_not_found:
    "Appwrite could not find this project. Double-check NEXT_PUBLIC_APPWRITE_PROJECT_ID.",
  general_unauthorized_scope:
    "The Appwrite API key is missing a required scope. It needs users.write and sessions.write.",
};

const CODE_MESSAGES: Record<number, string> = {
  400: "Those details are not valid. Check the email format and make sure your password has at least 8 characters.",
  401: "Incorrect email or password.",
  403: "The Appwrite API key is missing a required scope. It needs users.write and sessions.write.",
  404: "Appwrite could not find this project. Double-check NEXT_PUBLIC_APPWRITE_PROJECT_ID.",
  409: "An account with this email already exists. Try signing in instead.",
  429: "Too many attempts. Wait a minute and try again.",
  501: "Email and password sign-in is disabled for this Appwrite project.",
  503: "The authentication service is temporarily unavailable. Try again in a moment.",
};

export function mapAuthError(error: unknown): string {
  if (error instanceof AppwriteNotConfiguredError) return error.message;

  if (error instanceof AppwriteException) {
    const byType = error.type ? TYPE_MESSAGES[error.type] : undefined;
    if (byType) return byType;

    const byCode = typeof error.code === "number" ? CODE_MESSAGES[error.code] : undefined;
    if (byCode) return byCode;

    return error.message?.trim() || GENERIC_FAILURE;
  }

  if (error instanceof TypeError) return NETWORK_FAILURE;

  return GENERIC_FAILURE;
}
