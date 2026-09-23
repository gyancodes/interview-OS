/**
 * Framework-free Appwrite auth shapes.
 *
 * Kept separate from `server.ts` (which is marked `server-only`) so client
 * components can import these types without pulling server code into the
 * browser bundle.
 */

/** The subset of an Appwrite account the UI needs. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  /** ISO timestamp of account creation. */
  createdAt: string;
  emailVerification: boolean;
}

/** State returned by the auth server actions and consumed by `useActionState`. */
export interface AuthActionState {
  status: "idle" | "error" | "success";
  /** Form-level error rendered above the submit button. */
  message?: string;
  /** Per-field errors keyed by input `name`. */
  fieldErrors?: Record<string, string>;
  /** Sanitised same-origin path to navigate to after a successful action. */
  redirectTo?: string;
}

export const INITIAL_AUTH_STATE: AuthActionState = { status: "idle" };
