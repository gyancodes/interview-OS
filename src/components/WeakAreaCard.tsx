import Link from "next/link";

import { TOPIC_MAP } from "@/data/topics";
import type { WeakArea } from "@/lib/types";
import { pluralize } from "@/lib/utils";

function SeverityBadge({ score, attempts }: { score: number; attempts: number }) {
  if (score <= 0.34 || attempts === 0) {
    return (
      <span className="flex items-center gap-1.5 rounded-md border border-weak/25 bg-weak-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-weak">
        <span className="h-1.5 w-1.5 rounded-full bg-weak animate-pulse" />
        High Priority
      </span>
    );
  }
  if (score <= 0.67) {
    return (
      <span className="flex items-center gap-1.5 rounded-md border border-partial/25 bg-partial-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-partial">
        <span className="h-1.5 w-1.5 rounded-full bg-partial" />
        Review
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 rounded-md border border-accent/25 bg-accent-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Improving
    </span>
  );
}

export function WeakAreaCard({ area }: { area: WeakArea }) {
  const topic = TOPIC_MAP[area.topic];
  if (!topic) return null;

  return (
    <Link
      href={`/practice?topic=${area.topic}&category=${encodeURIComponent(area.category)}`}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xs"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-fg">
              {topic.name}
            </span>
            <span className="text-faint">/</span>
            <span className="truncate text-xs font-medium text-fg-muted">
              {area.category}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {area.weak + area.partial} of {area.attempts} {pluralize(area.attempts, "attempt")} marked weak or partial
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <SeverityBadge score={area.score} attempts={area.attempts} />
        <span className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-transform duration-150 group-hover:translate-x-0.5">
          Practice Now <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
