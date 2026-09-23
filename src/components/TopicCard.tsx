import Link from "next/link";

import { ProgressBar } from "@/components/ui";
import { TOPIC_MAP } from "@/data/topics";

import type { TopicProgress } from "@/lib/types";
import { pluralize } from "@/lib/utils";

const TOPIC_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  javascript: { label: "JS", bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700" },
  typescript: { label: "TS", bg: "bg-blue-50 border-blue-200/60", text: "text-blue-700" },
  nodejs: { label: "NODE", bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700" },
  express: { label: "EX", bg: "bg-zinc-100 border-zinc-300/60", text: "text-zinc-800" },
  backend: { label: "API", bg: "bg-indigo-50 border-indigo-200/60", text: "text-indigo-700" },
  react: { label: "RCT", bg: "bg-cyan-50 border-cyan-200/60", text: "text-cyan-700" },
  nextjs: { label: "NXT", bg: "bg-zinc-900 border-zinc-800", text: "text-zinc-100" },
  fullstack: { label: "FULL", bg: "bg-purple-50 border-purple-200/60", text: "text-purple-700" },
  devops: { label: "OPS", bg: "bg-orange-50 border-orange-200/60", text: "text-orange-700" },
  "system-design": { label: "SYS", bg: "bg-sky-50 border-sky-200/60", text: "text-sky-700" },
};

export function TopicCard({ progress }: { progress: TopicProgress }) {
  const topic = TOPIC_MAP[progress.topic];
  if (!topic) return null;

  const badge = TOPIC_BADGES[topic.id] || {
    label: topic.name.slice(0, 3).toUpperCase(),
    bg: "bg-surface-2 border-border",
    text: "text-muted",
  };

  return (
    <Link
      href={`/practice?topic=${topic.id}`}
      className="group relative flex flex-col justify-between gap-4 rounded-xl border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md hover:shadow-accent/5"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-[11px] font-bold tracking-tight shadow-2xs ${badge.bg} ${badge.text}`}
            >
              {badge.label}
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-fg group-hover:text-accent transition-colors">
                {topic.name}
              </h3>
              <p className="line-clamp-1 text-xs text-muted">{topic.tagline}</p>
            </div>
          </div>

          {progress.weak > 0 ? (
            <span className="shrink-0 rounded-full border border-weak/25 bg-weak-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-weak">
              {progress.weak} weak
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">
            {progress.attempted > 0
              ? `${progress.attempted} ${pluralize(progress.attempted, "question")} done`
              : "Not started"}
          </span>
          <span className="font-mono font-medium text-fg">{progress.percent}%</span>
        </div>

        <ProgressBar percent={progress.percent} label={`${topic.name} mastery`} />

        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="font-mono text-faint uppercase tracking-wider">{topic.track}</span>
          <span className="inline-flex items-center gap-1 font-medium text-accent transition-transform duration-150 group-hover:translate-x-0.5">
            {progress.attempted > 0 ? "Continue" : "Start"}
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
