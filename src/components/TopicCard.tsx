import Link from "next/link";

import { ProgressBar } from "@/components/ui";
import { TOPIC_MAP } from "@/data/topics";

import type { TopicProgress } from "@/lib/types";
import { pluralize } from "@/lib/utils";

export function TopicCard({ progress }: { progress: TopicProgress }) {
  const topic = TOPIC_MAP[progress.topic];
  if (!topic) return null;

  return (
    <Link
      href={`/practice?topic=${topic.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all hover:border-border-strong hover:shadow-[0_2px_12px_rgba(11,13,18,0.06)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-fg">{topic.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-faint">{topic.tagline}</p>
        </div>
        {progress.weak > 0 ? (
          <span className="shrink-0 rounded-full border border-weak/40 bg-weak/10 px-2 py-0.5 text-[11px] font-medium text-weak">
            {progress.weak} weak
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          {progress.attempted > 0
            ? `${progress.attempted} ${pluralize(progress.attempted, "question")} practiced`
            : "Nothing practiced yet"}
        </span>
        <span className="font-mono">{progress.percent}% mastery</span>
      </div>

      <ProgressBar percent={progress.percent} label={`${topic.name} mastery`} />

      <span className="mt-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
        {progress.attempted > 0 ? "Continue" : "Start"} →
      </span>
    </Link>
  );
}
