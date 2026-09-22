import Link from "next/link";

import { TOPIC_MAP } from "@/data/topics";

import type { WeakArea } from "@/lib/types";
import { pluralize } from "@/lib/utils";

/** Severity dot: score 0–0.34 red, 0.34–0.67 yellow, above green-ish. */
function severityDot(score: number, attempts: number): string {
  if (score <= 0.34 || attempts === 0) return "🔴";
  if (score <= 0.67) return "🟡";
  return "🟢";
}

export function WeakAreaCard({ area }: { area: WeakArea }) {
  const topic = TOPIC_MAP[area.topic];
  if (!topic) return null;

  return (
    <Link
      href={`/practice?topic=${area.topic}&category=${encodeURIComponent(area.category)}`}
      className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden>{severityDot(area.score, area.weak + area.partial)}</span>
        <div className="min-w-0">
          <p className="truncate text-sm text-fg">
            {topic.name} — {area.category}
          </p>
          <p className="text-xs text-faint">
            {area.weak + area.partial} of {area.attempts} {pluralize(area.attempts, "attempt")} weak
            or partial
          </p>
        </div>
      </div>
      <span className="shrink-0 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
        Practice →
      </span>
    </Link>
  );
}
