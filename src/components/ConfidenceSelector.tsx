"use client";

import { CONFIDENCE_OPTIONS } from "@/lib/constants";

import type { Confidence } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ConfidenceSelector({
  onSelect,
  disabled,
}: {
  onSelect: (confidence: Confidence) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className="text-sm font-medium text-fg">How well did you know this?</legend>
      <div className="flex flex-wrap gap-2">
        {CONFIDENCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            title={option.hint}
            className={cn(
              "flex items-center gap-2 rounded-md border border-border bg-surface-2 px-4 py-2 text-sm text-fg transition-colors hover:border-border-strong",
              option.value === "weak" && "hover:border-weak/60",
              option.value === "partial" && "hover:border-partial/60",
              option.value === "strong" && "hover:border-strong/60",
            )}
          >
            <span aria-hidden>{option.dot}</span>
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
