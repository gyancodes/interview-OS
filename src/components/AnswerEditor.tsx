"use client";

import { buttonStyles } from "@/components/ui";

export function AnswerEditor({
  value,
  onChange,
  disabled,
  onSubmit,
  submitLabel = "Reveal Answer",
  placeholder = "Explain it the way you would in the interview…",
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
      <label htmlFor="answer-editor" className="sr-only">
        Your answer
      </label>
      <textarea
        id="answer-editor"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        rows={7}
        placeholder={placeholder}
        className="scrollbar-thin w-full resize-y rounded-md border border-border bg-canvas px-4 py-3 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none disabled:opacity-60"
      />
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-faint" aria-live="polite">
          {words === 0 ? "Take a moment to think before revealing." : `${words} words`}
        </span>
        {onSubmit ? (
          <button type="button" onClick={onSubmit} disabled={disabled} className={buttonStyles.primary}>
            {submitLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
