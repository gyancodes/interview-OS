"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useState } from "react";

import { buttonStyles } from "@/components/ui";
import { signInAction, signUpAction } from "@/lib/appwrite/actions";
import { INITIAL_AUTH_STATE } from "@/lib/appwrite/types";
import { cn } from "@/lib/utils";

import type { AuthActionState } from "@/lib/appwrite/types";

export type AuthMode = "signin" | "signup";

interface AuthFormProps {
  mode: AuthMode;
  /** Same-origin path to return to after a successful sign in. */
  next?: string;
}

const COPY: Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    submit: string;
    pending: string;
    switchText: string;
    switchHref: string;
    switchLabel: string;
  }
> = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to pick up your readiness score, weak areas and saved sessions.",
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "New to InterviewOS?",
    switchHref: "/signup",
    switchLabel: "Create an account",
  },
  signup: {
    title: "Create your account",
    subtitle: "Your progress, weak areas and mock interview history stay tied to your account.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchHref: "/login",
    switchLabel: "Sign in",
  },
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-[11px] font-medium text-weak">
      {message}
    </p>
  );
}

export function AuthForm({ mode, next }: AuthFormProps) {
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    action,
    INITIAL_AUTH_STATE,
  );
  const copy = COPY[mode];
  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();
  const [showPassword, setShowPassword] = useState(false);

  // A successful action has already set the session cookie. A full navigation
  // (rather than router.push) guarantees the server re-renders the layout with
  // the new user before any page reads per-user LocalStorage.
  useEffect(() => {
    if (state.status !== "success") return;
    window.location.assign(state.redirectTo ?? "/dashboard");
  }, [state.status, state.redirectTo]);

  const fieldErrors = state.fieldErrors ?? {};
  const inputClass =
    "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg shadow-2xs transition-colors placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15 disabled:opacity-60";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{copy.title}</h1>
        <p className="text-xs leading-relaxed text-muted">{copy.subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {next ? <input type="hidden" name="next" value={next} /> : null}

        {mode === "signup" ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={nameId} className="text-xs font-medium text-fg">
              Full name
            </label>
            <input
              id={nameId}
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Ada Lovelace"
              aria-invalid={Boolean(fieldErrors.name)}
              className={cn(inputClass, fieldErrors.name && "border-weak/60")}
              disabled={pending}
            />
            <FieldError message={fieldErrors.name} />
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-xs font-medium text-fg">
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            aria-invalid={Boolean(fieldErrors.email)}
            className={cn(inputClass, fieldErrors.email && "border-weak/60")}
            disabled={pending}
          />
          <FieldError message={fieldErrors.email} />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={passwordId} className="text-xs font-medium text-fg">
              Password
            </label>
            {mode === "signup" ? (
              <span className="font-mono text-[10px] text-faint">min 8 characters</span>
            ) : null}
          </div>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              placeholder="••••••••"
              aria-invalid={Boolean(fieldErrors.password)}
              className={cn(inputClass, "pr-16", fieldErrors.password && "border-weak/60")}
              disabled={pending}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          <FieldError message={fieldErrors.password} />
        </div>

        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-weak/30 bg-weak-soft/70 px-3 py-2.5 text-xs leading-relaxed text-weak"
          >
            <span aria-hidden className="font-semibold">
              !
            </span>
            <span>{state.message}</span>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending || state.status === "success"}
          className={cn(buttonStyles.accent, "mt-1 h-10 w-full")}
        >
          {pending || state.status === "success" ? (
            <>
              <span
                aria-hidden
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              {copy.pending}
            </>
          ) : (
            <>
              {copy.submit}
              <span aria-hidden>→</span>
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-muted">
        {copy.switchText}{" "}
        <Link href={copy.switchHref} className="font-semibold text-accent hover:underline">
          {copy.switchLabel}
        </Link>
      </p>

      <p className="text-center text-[11px] leading-relaxed text-faint">
        Sessions are issued by Appwrite and stored in an HTTP-only cookie. We never store your
        password.
      </p>
    </div>
  );
}

