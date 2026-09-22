"use client";

import type { Evaluation } from "@/lib/types";

function ListSection({
  title,
  items,
  icon,
  tone,
}: {
  title: string;
  items: string[];
  icon: string;
  tone: "strong" | "partial" | "weak" | "muted";
}) {
  if (items.length === 0) return null;
  const toneClass = {
    strong: "text-strong",
    partial: "text-partial",
    weak: "text-weak",
    muted: "text-muted",
  }[tone];

  return (
    <div>
      <h4 className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${toneClass}`}>{title}</h4>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-fg">
            <span aria-hidden className="shrink-0 pt-0.5 text-xs">
              {icon}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedbackCard({
  evaluation,
  onFollowUp,
  followUpLoading,
  followUp,
}: {
  evaluation: Evaluation;
  onFollowUp?: () => void;
  followUpLoading?: boolean;
  followUp?: { question: string; why: string; focus: string[] } | null;
}) {
  return (
    <section className="animate-rise rounded-lg border border-border bg-surface p-5" aria-live="polite">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted">
          <span aria-hidden className="text-accent">✦</span>
          AI Feedback
        </h3>
        {/* Score is intentionally secondary — the written feedback is the value. */}
        <span
          className="shrink-0 rounded-full border border-border-strong bg-surface-2 px-2.5 py-0.5 font-mono text-xs text-muted"
          title="Interviewer score: 60 ≈ pass, 80 ≈ strong"
        >
          {evaluation.score}/100
        </span>
      </div>

      <div className="flex flex-col gap-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{evaluation.summary}</p>

        <ListSection title="What you got right" items={evaluation.strengths} icon="✓" tone="strong" />
        <ListSection title="What you missed" items={evaluation.missingConcepts} icon="→" tone="partial" />
        <ListSection title="What to correct" items={evaluation.corrections} icon="!" tone="weak" />

        {evaluation.interviewAnswer ? (
          <div className="rounded-lg border border-border bg-surface-2 p-4">
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
              A stronger interview answer
            </h4>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
              {evaluation.interviewAnswer}
            </p>
          </div>
        ) : null}

        {followUp ? (
          <div className="rounded-md border border-accent/30 bg-accent-soft/40 p-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">
              Follow-up from your interviewer
            </h4>
            <p className="text-sm font-medium text-fg">{followUp.question}</p>
            {followUp.why ? <p className="mt-1 text-xs text-muted">{followUp.why}</p> : null}
            {followUp.focus.length > 0 ? (
              <p className="mt-2 text-xs text-faint">
                Recall: {followUp.focus.join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {onFollowUp ? (
          <div>
            <button
              type="button"
              onClick={onFollowUp}
              disabled={followUpLoading}
              className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface-2 px-4 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
            >
              {followUpLoading ? (
                <span
                  aria-hidden
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-border-strong border-t-accent"
                />
              ) : (
                <span aria-hidden>↳</span>
              )}
              Ask follow-up question
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
