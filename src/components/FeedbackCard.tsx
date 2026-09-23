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
    strong: "text-strong bg-strong-soft border-strong/20",
    partial: "text-partial bg-partial-soft border-partial/20",
    weak: "text-weak bg-weak-soft border-weak/20",
    muted: "text-muted bg-surface-2 border-border",
  }[tone];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold ${toneClass}`}>
          {icon}
        </span>
        <h4 className="font-mono text-xs font-semibold uppercase tracking-wider text-fg">
          {title}
        </h4>
      </div>
      <ul className="flex flex-col gap-1.5 pl-6">
        {items.map((item, index) => (
          <li key={index} className="text-xs leading-relaxed text-muted">
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
    <section className="animate-rise rounded-xl border border-border bg-surface p-6 sm:p-7 shadow-2xs" aria-live="polite">
      {/* Feedback header */}
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-white font-bold text-xs shadow-xs">
            ✦
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-fg">AI Evaluation & Feedback</h3>
            <p className="text-[11px] text-muted">Analysis of your technical clarity and completeness</p>
          </div>
        </div>

        {/* Score pill */}
        <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1 font-mono text-xs shadow-2xs">
          <span className="text-muted">Score:</span>
          <span className="font-bold text-accent">{evaluation.score}</span>
          <span className="text-faint">/100</span>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {/* Summary paragraph */}
        <p className="text-sm leading-relaxed text-fg bg-surface-2/60 p-4 rounded-lg border border-border-subtle">
          {evaluation.summary}
        </p>

        {/* Detailed bullet lists */}
        <div className="grid gap-4 sm:grid-cols-3">
          <ListSection title="Strengths" items={evaluation.strengths} icon="✓" tone="strong" />
          <ListSection title="Missing Points" items={evaluation.missingConcepts} icon="→" tone="partial" />
          <ListSection title="Corrections" items={evaluation.corrections} icon="!" tone="weak" />
        </div>

        {/* Model answer snippet */}
        {evaluation.interviewAnswer ? (
          <div className="rounded-xl border border-accent/25 bg-accent-soft/40 p-4">
            <h4 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <span>✦</span> Recommended Interview Formulation
            </h4>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-fg">
              {evaluation.interviewAnswer}
            </p>
          </div>
        ) : null}

        {/* Follow-up Question from AI */}
        {followUp ? (
          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <h4 className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-fg flex items-center gap-1.5">
              <span className="text-accent">↳</span> Interviewer Follow-Up Question
            </h4>
            <p className="text-xs font-medium text-fg">{followUp.question}</p>
            {followUp.why ? <p className="mt-1 text-xs text-muted">{followUp.why}</p> : null}
            {followUp.focus.length > 0 ? (
              <p className="mt-2 text-[11px] text-faint">
                Targeted concepts: {followUp.focus.join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Ask follow-up CTA */}
        {onFollowUp ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={onFollowUp}
              disabled={followUpLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-fg shadow-2xs transition-all hover:border-accent hover:text-accent hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {followUpLoading ? (
                <span
                  aria-hidden
                  className="h-3 w-3 animate-spin rounded-full border-2 border-border-strong border-t-accent"
                />
              ) : (
                <span aria-hidden className="text-accent">↳</span>
              )}
              {followUpLoading ? "Generating Drill-Down Question…" : "Ask Follow-Up Drill Question"}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
