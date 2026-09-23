"use client";

import { buttonStyles } from "@/components/ui";

export function AnswerEditor({
  value,
  onChange,
  disabled,
  onSubmit,
  submitLabel = "Reveal Answer",
  placeholder = "Explain your reasoning the way you would in a technical interview…",
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onSubmit?: () => void;
  submitLabel?: string;
  placeholder?: string;
}) {
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor="answer-editor" className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
          Your Answer
        </label>
        <span className="font-mono text-[11px] text-faint" aria-live="polite">
          {words === 0 ? "0 words" : `${words} words written`}
        </span>
      </div>

      <div className="relative">
        <textarea
          id="answer-editor"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              if (onSubmit) onSubmit();
            }
          }}
          disabled={disabled}
          rows={7}
          placeholder={placeholder}
          className="scrollbar-thin w-full resize-y rounded-xl border border-border bg-surface px-4 py-3.5 text-sm text-fg transition-all placeholder:text-faint focus:border-accent focus:bg-surface focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:opacity-60 font-sans leading-relaxed"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted">
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted">
            ⌘+Enter
          </kbd>{" "}
          or click below to reveal the ideal answer and get AI evaluation.
        </p>
        {onSubmit ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled}
            className={buttonStyles.primary}
          >
            {submitLabel} <span aria-hidden>→</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
