"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { displayNameFor, initialsFor } from "@/lib/appwrite/display";
import { ErrorNote, buttonStyles } from "@/components/ui";
import { signOutAction } from "@/lib/appwrite/actions";
import { clearAllLocalData, getLocalDataSummary, setStorageScope } from "@/lib/storage";

import type { AuthUser } from "@/lib/appwrite/types";
import type { LocalDataSummary } from "@/lib/storage";
import { formatDateTime } from "@/lib/utils";

const DATA_ROWS: { key: keyof LocalDataSummary; label: string; hint: string }[] = [
  { key: "attempts", label: "Practice attempts", hint: "Answered questions and confidence ratings" },
  { key: "recentQuestions", label: "Recent questions", hint: "Questions shown in your last sessions" },
  { key: "savedQuestions", label: "Saved questions", hint: "Questions you starred for later" },
  { key: "mockInterviews", label: "Mock interviews", hint: "Completed simulations and verdicts" },
  { key: "learningMaterials", label: "Cached study guides", hint: "Generated guides stored offline" },
];

/**
 * Client half of the account page: local data controls and sign out.
 * Account fields come from the server as props.
 */
export function AccountPanel({ user }: { user: AuthUser }) {
  const router = useRouter();
  const [summary, setSummary] = useState<LocalDataSummary | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, startSignOut] = useTransition();
  const [resetting, startReset] = useTransition();

  useEffect(() => {
    setSummary(getLocalDataSummary());
  }, []);

  function handleReset() {
    startReset(() => {
      clearAllLocalData();
      setSummary(getLocalDataSummary());
      setConfirmingReset(false);
      router.refresh();
    });
  }

  function handleSignOut() {
    startSignOut(async () => {
      try {
        await signOutAction();
      } catch {
        setError("Sign out failed. Please try again.");
      } finally {
        setStorageScope(null);
        window.location.assign("/");
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {error ? <ErrorNote message={error} /> : null}

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-fg font-mono text-sm font-bold text-canvas">
            {initialsFor(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-fg">{displayNameFor(user)}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
        </div>

        <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3">
          <div className="flex flex-col gap-1 bg-surface p-4">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Account ID
            </dt>
            <dd className="truncate font-mono text-xs text-fg">{user.id}</dd>
          </div>
          <div className="flex flex-col gap-1 bg-surface p-4">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">Joined</dt>
            <dd className="text-xs text-fg">{formatDateTime(user.createdAt) || "—"}</dd>
          </div>
          <div className="flex flex-col gap-1 bg-surface p-4">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Email verified
            </dt>
            <dd className="flex items-center gap-2 text-xs text-fg">
              <span
                className={`h-1.5 w-1.5 rounded-full ${user.emailVerification ? "bg-strong" : "bg-partial"}`}
              />
              {user.emailVerification ? "Verified" : "Not verified yet"}
            </dd>
          </div>
        </dl>

        <p className="text-[11px] leading-relaxed text-faint">
          Identity and sessions are managed by Appwrite. InterviewOS stores no passwords and only
          reads your name, email and account metadata.
        </p>
      </section>


      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-fg">Local progress data</h2>
          <p className="text-xs text-muted">
            Stored in this browser and namespaced to your account, so switching accounts never mixes
            data.
          </p>
        </div>

        <ul className="flex flex-col divide-y divide-border-subtle overflow-hidden rounded-xl border border-border bg-surface">
          {DATA_ROWS.map((row) => (
            <li key={row.key} className="flex items-center justify-between gap-4 px-4 py-3">
              <span className="flex flex-col">
                <span className="text-xs font-medium text-fg">{row.label}</span>
                <span className="text-[11px] text-faint">{row.hint}</span>
              </span>
              <span className="font-mono text-sm font-semibold text-fg">
                {summary ? summary[row.key] : "—"}
              </span>
            </li>
          ))}
        </ul>

        {confirmingReset ? (
          <div className="flex flex-col gap-3 rounded-xl border border-weak/30 bg-weak-soft/60 p-4">
            <p className="text-xs leading-relaxed text-weak">
              Delete all practice attempts, saved questions, study guide cache and mock interview
              history for this account? This cannot be undone. Your Appwrite account stays active.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={resetting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-weak px-3.5 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {resetting ? "Deleting…" : "Yes, delete my progress"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingReset(false)}
                className={buttonStyles.secondary}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setConfirmingReset(true)}
              className={buttonStyles.outline}
            >
              Reset local progress
            </button>
            <Link href="/practice" className={buttonStyles.ghost}>
              Back to practice →
            </Link>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-sm font-semibold text-fg">Session</h2>
        <p className="text-xs text-muted">
          Signing out revokes the Appwrite session and clears the session cookie on this device.
        </p>
        <div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className={buttonStyles.secondary}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </section>
    </div>
  );
}
