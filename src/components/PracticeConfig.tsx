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
    <fieldset className="flex flex-col gap-2">
      <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            title={option.hint}
            className={cn(
              "rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-150",
              value === option.value
                ? "border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent/30 font-semibold"
                : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg hover:bg-surface-2",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      {renderHint ? (
        <p className="text-[11px] text-muted">
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
    <div className="flex flex-col gap-8 rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xs">
      {/* Topic selection */}
      <fieldset className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            1. Select Topic
          </legend>
          <span className="text-xs text-faint">10 core engineering domains</span>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {TOPICS.map((topic) => {
            const isSelected = config.topic === topic.id;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => onChange({ ...config, topic: topic.id })}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-150",
                  isSelected
                    ? "border-accent bg-accent-soft text-fg shadow-xs ring-1 ring-accent/30"
                    : "border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-2/60",
                )}
              >
                <span
                  className={cn(
                    "text-xs font-semibold tracking-tight",
                    isSelected ? "text-accent" : "text-fg",
                  )}
                >
                  {topic.name}
                </span>
                <span className="mt-0.5 text-[11px] text-faint line-clamp-1">{topic.tagline}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Level and Count in split columns */}
      <div className="grid gap-6 sm:grid-cols-2">
        <OptionGroup
          legend="2. Difficulty Level"
          options={DIFFICULTY_FILTERS}
          value={config.difficulty}
          onChange={(difficulty) => onChange({ ...config, difficulty })}
          renderHint
        />

        <OptionGroup
          legend="3. Number of Questions"
          options={PRACTICE_COUNTS.map((count) => ({ value: count, label: `${count} Questions` }))}
          value={config.count}
          onChange={(count) => onChange({ ...config, count })}
        />
      </div>

      {/* Start Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-soft text-accent font-bold">
            ✦
          </span>
          <span>Questions are generated live by AI adapted to your chosen domain.</span>
        </div>

        <button
          type="button"
          onClick={onStart}
          disabled={starting}
          className={cn(buttonStyles.primary, "px-6 py-2.5 text-sm font-semibold tracking-tight")}
        >
          {starting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-canvas border-t-transparent" />
              Generating Questions…
            </>
          ) : (
            "Start Practice Session →"
          )}
        </button>
      </div>
    </div>
  );
}
