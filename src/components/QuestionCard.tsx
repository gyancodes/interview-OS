import { DIFFICULTY_LABELS } from "@/lib/constants";
import { TOPIC_MAP } from "@/data/topics";

import type { Difficulty, TopicId } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuestionCard({
  topic,
  category,
  difficulty,
  question,
  progress,
  actions,
}: {
  topic: TopicId | string;
  category: string;
  difficulty: Difficulty;
  question: string;
  progress?: string;
  actions?: React.ReactNode;
}) {
  const topicName = topic in TOPIC_MAP ? TOPIC_MAP[topic as TopicId].name : topic;

  return (
    <section className="animate-fade rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xs">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-fg">
            {topicName}
          </span>
          <span className="text-faint">/</span>
          <span className="text-muted font-medium">{category}</span>
        </div>

        <div className="flex items-center gap-2">
          {progress ? (
            <span className="rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-muted">
              {progress}
            </span>
          ) : null}
          <span
            className={cn(
              "rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold",
              difficulty === "beginner" && "border-strong/20 bg-strong-soft text-strong",
              difficulty === "intermediate" && "border-partial/20 bg-partial-soft text-partial",
              difficulty === "advanced" && "border-weak/20 bg-weak-soft text-weak",
              difficulty === "expert" && "border-accent/20 bg-accent-soft text-accent",
            )}
          >
            {DIFFICULTY_LABELS[difficulty] ?? difficulty}
          </span>
        </div>
      </div>

      <h1 className="text-balance text-xl font-bold leading-snug tracking-tight text-fg sm:text-2xl">
        {question}
      </h1>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-border-subtle pt-4 text-xs text-muted">
        <p className="flex items-center gap-1.5">
          <span className="text-accent font-semibold">Tip:</span> Think out loud or write down your core reasoning before checking the solution.
        </p>
        {actions}
      </div>
    </section>
  );
}
