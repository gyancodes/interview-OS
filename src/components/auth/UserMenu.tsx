"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { displayNameFor, initialsFor } from "@/lib/appwrite/display";
import { signOutAction } from "@/lib/appwrite/actions";
import { setStorageScope } from "@/lib/storage";
import { cn } from "@/lib/utils";

import type { AuthUser } from "@/lib/appwrite/types";

const MENU_LINKS = [
  { href: "/dashboard", label: "Dashboard", hint: "Progress and weak areas" },
  { href: "/practice", label: "Practice", hint: "Live AI questions" },
  { href: "/profile", label: "Account", hint: "Profile and local data" },
] as const;

/** Avatar button with an account dropdown and sign out action. */
export function UserMenu({ user, className }: { user: AuthUser; className?: string }) {
  const [open, setOpen] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleSignOut() {
    setOpen(false);
    startSignOut(async () => {
      try {
        await signOutAction();
      } finally {
        // Drop the per-user storage namespace and reload so the server
        // re-renders an anonymous session.
        setStorageScope(null);
        window.location.assign("/");
      }
    });
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayNameFor(user)}`}
        className="flex items-center gap-2 rounded-full border border-border bg-surface p-1 pr-2.5 shadow-2xs transition-colors hover:border-border-strong hover:bg-surface-2"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fg font-mono text-[11px] font-bold text-canvas">
          {initialsFor(user)}
        </span>
        <span className="hidden max-w-[9rem] truncate text-xs font-medium text-fg sm:inline">
          {displayNameFor(user)}
        </span>
        <svg
          aria-hidden
          className={cn("h-3 w-3 text-faint transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="animate-rise absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/5"
        >
          <div className="border-b border-border-subtle bg-surface-2/60 px-3.5 py-3">
            <p className="truncate text-xs font-semibold text-fg">{displayNameFor(user)}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
            <p className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-faint">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Appwrite session
            </p>
          </div>

          <ul className="p-1">
            {MENU_LINKS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-surface-2"
                >
                  <span className="text-xs font-medium text-fg">{item.label}</span>
                  <span className="text-[10px] text-faint">{item.hint}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-border-subtle p-1">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-weak-soft disabled:opacity-60"
            >
              <span className="text-xs font-medium text-weak">
                {signingOut ? "Signing out…" : "Sign out"}
              </span>
              <svg
                aria-hidden
                className="h-3.5 w-3.5 text-weak/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
                />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
