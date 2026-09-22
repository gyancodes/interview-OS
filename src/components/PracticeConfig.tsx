"use client";

import { buttonStyles } from "@/components/ui";
import { TOPICS } from "@/data/topics";
import { DIFFICULTY_FILTERS, PRACTICE_COUNTS } from "@/lib/constants";

import type { DifficultyFilter, PracticeCount, TopicId } from "@/lib/types";
import { cn } from "@/lib/utils";

function OptionGroup<T extends string | number>({
  legend,
  options,
  value,
  onChange,
  renderHint,
}: {
  legend: string;
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  renderHint?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-fg">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            title={option.hint}
            className={cn(
              "rounded-md border px-3.5 py-2 text-sm transition-colors",
              value === option.value
                ? "border-accent/60 bg-accent-soft text-accent"
                : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {renderHint ? (
        <p className="mt-1.5 text-xs text-faint">
          {options.find((option) => option.value === value)?.hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export interface PracticeConfigState {
  topic: TopicId;
  difficulty: DifficultyFilter;
  count: PracticeCount;
}

export function PracticeConfig({
  config,
  onChange,
  onStart,
  starting,
}: {
  config: PracticeConfigState;
  onChange: (config: PracticeConfigState) => void;
  onStart: () => void;
  starting?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 sm:p-8">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-fg">Topic</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              onClick={() => onChange({ ...config, topic: topic.id })}
              aria-pressed={config.topic === topic.id}
              className={cn(
                "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                config.topic === topic.id
                  ? "border-accent/60 bg-accent-soft text-accent"
                  : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg",
              )}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </fieldset>

      <OptionGroup
        legend="Skill level"
        options={DIFFICULTY_FILTERS}
        value={config.difficulty}
        onChange={(difficulty) => onChange({ ...config, difficulty })}
        renderHint
      />

      <OptionGroup
        legend="Number of questions"
        options={PRACTICE_COUNTS.map((count) => ({ value: count, label: String(count) }))}
        value={config.count}
        onChange={(count) => onChange({ ...config, count })}
      />

      <p className="text-xs text-faint">
        Every question is generated live by AI for this exact topic and level — no two sessions are the same.
      </p>

      <div>
        <button type="button" onClick={onStart} disabled={starting} className={buttonStyles.primary}>
          {starting ? "Generating first question…" : "Start Practice"}
        </button>
      </div>
    </div>
  );
}
