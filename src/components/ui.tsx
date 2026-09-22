import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Buttons                                                                     */
/* -------------------------------------------------------------------------- */

export const buttonStyles = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-md border border-accent/60 bg-accent/15 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "inline-flex items-center justify-center gap-2 rounded-md border border-border-strong bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition-colors hover:border-border-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:cursor-not-allowed disabled:opacity-50",
} as const;

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
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}
    >
      <div
        className="bar-fill h-full rounded-full bg-accent"
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
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      {icon ? <span aria-hidden className="text-2xl">{icon}</span> : null}
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="max-w-sm text-sm text-muted">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-muted">
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
      className="flex items-start justify-between gap-4 rounded-md border border-weak/40 bg-weak/10 px-4 py-3 text-sm"
    >
      <p className="text-fg">{message}</p>
      {retry ? (
        <button type="button" onClick={retry} className="shrink-0 font-medium text-accent hover:underline">
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
}: {
  title: string;
  action?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-faint">{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface", className)}>{children}</div>
  );
}
