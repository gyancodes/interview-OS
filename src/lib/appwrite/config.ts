/**
 * Appwrite environment configuration.
 *
 * Two levels of configuration are supported so the app degrades gracefully:
 *
 * - Project config (endpoint + project ID) is enough to *read* an existing
 *   session, so protected pages can render for already signed-in users.
 * - Admin config additionally needs an API key with `users.write` and
 *   `sessions.write` scopes, which is required to create accounts and
 *   sessions from the server.
 */

import "server-only";

export interface AppwriteProjectConfig {
  endpoint: string;
  projectId: string;
}

export interface AppwriteAdminConfig extends AppwriteProjectConfig {
  apiKey: string;
}

const DEFAULT_ENDPOINT = "https://cloud.appwrite.io/v1";

function read(value: string | undefined): string {
  return (value ?? "").trim();
}

export function getAppwriteEndpoint(): string {
  return read(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) || DEFAULT_ENDPOINT;
}

export function getAppwriteProjectId(): string {
  return read(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);
}

/** Project-only config — enough to validate a session cookie. */
export function getAppwriteProjectConfig(): AppwriteProjectConfig | null {
  const projectId = getAppwriteProjectId();
  if (!projectId) return null;
  return { endpoint: getAppwriteEndpoint(), projectId };
}

/** Admin config — required to sign users up or in. */
export function getAppwriteAdminConfig(): AppwriteAdminConfig | null {
  const project = getAppwriteProjectConfig();
  const apiKey = read(process.env.APPWRITE_API_KEY);
  if (!project || !apiKey) return null;
  return { ...project, apiKey };
}

/** True when accounts and sessions can be created server-side. */
export function isAppwriteAuthConfigured(): boolean {
  return getAppwriteAdminConfig() !== null;
}

export const APPWRITE_SETUP_HINT =
  "Appwrite is not configured yet. Add NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY to .env.local (see .env.example), then restart the dev server.";
