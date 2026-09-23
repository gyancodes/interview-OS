import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-fg px-4 py-2 text-sm font-medium text-canvas shadow-xs transition-all duration-200 hover:bg-zinc-800 hover:shadow-sm active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  accent:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/20 transition-all duration-200 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-fg shadow-2xs transition-all duration-200 hover:border-border-strong hover:bg-surface-2 hover:shadow-xs active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-fg transition-all hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50",
} as const;

/* -------------------------------------------------------------------------- */
/* Badges                                                                     */
/* -------------------------------------------------------------------------- */

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "accent" | "strong" | "partial" | "weak" | "outline";
  className?: string;
}) {
  const variantStyles = {
    default: "bg-surface-2 text-muted border-border",
    accent: "bg-accent-soft text-accent border-accent/20 font-medium",
    strong: "bg-strong-soft text-strong border-strong/20 font-medium",
    partial: "bg-partial-soft text-partial border-partial/20 font-medium",
    weak: "bg-weak-soft text-weak border-weak/20 font-medium",
    outline: "bg-transparent text-fg border-border font-medium",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs tracking-tight",
        variantStyles,
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* ProgressBar                                                                 */
/* -------------------------------------------------------------------------- */

export function ProgressBar({
  percent,
  label,
  className,
}: {
  percent: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-border-subtle", className)}
    >
      <div
        className="bar-fill h-full rounded-full bg-gradient-to-r from-accent to-blue-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* State components                                                            */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: string | ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-surface-2/40 px-6 py-12 text-center">
      {icon ? (
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface shadow-2xs">
          {typeof icon === "string" ? (
            <span aria-hidden className="text-xl leading-none">
              {icon}
            </span>
          ) : (
            icon
          )}
        </div>
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted shadow-2xs">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </div>
      )}
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        <p className="max-w-sm text-xs leading-relaxed text-muted">{description}</p>
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2.5 text-xs font-medium text-muted">
      <span
        aria-hidden
        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-strong border-t-accent"
      />
      {label}
    </div>
  );
}

export function ErrorNote({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-4 rounded-lg border border-weak/30 bg-weak-soft/70 px-4 py-3 text-xs leading-relaxed text-weak"
    >
      <div className="flex items-center gap-2">
        <span aria-hidden className="font-semibold text-sm">!</span>
        <span>{message}</span>
      </div>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="shrink-0 font-semibold text-accent underline-offset-2 hover:underline"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  title,
  action,
  hint,
  eyebrow,
}: {
  title: string;
  action?: ReactNode;
  hint?: string;
  eyebrow?: string;
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-end">
      <div>
        {eyebrow ? (
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold tracking-tight text-fg">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className,
  hoverable = false,
}: {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface p-5 shadow-2xs",
        hoverable && "hover-lift cursor-pointer hover:border-border-strong",
        className,
      )}
    >
      {children}
    </div>
  );
}
