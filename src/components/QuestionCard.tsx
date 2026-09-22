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
    <section className="animate-fade rounded-lg border border-border bg-surface p-6 sm:p-8">
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full border border-border-strong bg-surface-2 px-2.5 py-0.5 font-medium text-fg">
          {topicName}
        </span>
        <span className="text-faint">/</span>
        <span className="text-muted">{category}</span>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-0.5 font-medium",
            difficulty === "easy" && "bg-strong/10 text-strong",
            difficulty === "medium" && "bg-partial/10 text-partial",
            difficulty === "hard" && "bg-weak/10 text-weak",
          )}
        >
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      </div>

      {progress ? <p className="mb-2 font-mono text-xs text-faint">{progress}</p> : null}

      <h1 className="text-balance text-xl font-semibold leading-snug text-fg sm:text-2xl">
        {question}
      </h1>

      <p className="mt-3 text-sm text-muted">
        Take a moment to think about your answer — explaining out loud is the skill interviews test.
      </p>

      {actions}
    </section>
  );
}
