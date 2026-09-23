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
  value?: Confidence;
}) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <div className="flex items-center justify-between">
        <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Self Assessment
        </legend>
        <span className="text-xs text-faint">How well did you know this concept?</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CONFIDENCE_OPTIONS.map((option) => {
          const colorStyles = {
            weak: "hover:border-weak/60 hover:bg-weak-soft/40 hover:text-weak",
            partial: "hover:border-partial/60 hover:bg-partial-soft/40 hover:text-partial",
            strong: "hover:border-strong/60 hover:bg-strong-soft/40 hover:text-strong",
          }[option.value];

          const dotColor = {
            weak: "bg-weak",
            partial: "bg-partial",
            strong: "bg-strong",
          }[option.value];

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              title={option.hint}
              className={cn(
                "group flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-2xs",
                colorStyles,
              )}
            >
              <div className="flex items-center gap-2.5">
                <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                <span className="text-xs font-semibold text-fg group-hover:text-inherit">
                  {option.label}
                </span>
              </div>
              <span className="text-[11px] text-faint group-hover:text-inherit">
                Select →
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
