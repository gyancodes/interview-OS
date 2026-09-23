"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { CodeBlock } from "@/components/CodeBlock";
import { ErrorNote, EmptyState, LoadingState, SectionHeading, buttonStyles } from "@/components/ui";
import { TOPICS } from "@/data/topics";
import { AiClientError, fetchCuratedMaterial, requestLearningMaterial } from "@/lib/ai-client";
import { DIFFICULTY_FILTERS, DIFFICULTY_LABELS } from "@/lib/constants";
import { getLearningMaterial, saveLearningMaterial } from "@/lib/storage";
import { cn } from "@/lib/utils";

import type { Difficulty, LearningMaterial, MaterialSource, TopicId } from "@/lib/types";

const LEVEL_OPTIONS: { value: Difficulty; label: string; hint?: string }[] = DIFFICULTY_FILTERS.filter(
  (option): option is { value: Difficulty; label: string; hint?: string } => option.value !== "mixed",
);

function LearnInner() {
  const [topic, setTopic] = useState<TopicId>("javascript");
  const [level, setLevel] = useState<Difficulty>("beginner");
  const [material, setMaterial] = useState<LearningMaterial | null>(null);
  const [source, setSource] = useState<MaterialSource>("ai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    setError(null);
    setLoading(true);
    (async () => {
      const curated = await fetchCuratedMaterial(topic, level);
      if (!active) return;
      if (curated) {
        setMaterial(curated.material);
        setSource("curated");
        saveLearningMaterial(topic, level, curated.material, "curated");
      } else {
        const cached = getLearningMaterial(topic, level);
        setMaterial(cached?.material ?? null);
        setSource(cached?.source ?? "ai");
      }
      setLoading(false);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, [topic, level]);

  const generate = useCallback(
    async (force = false) => {
      setError(null);
      if (!force) {
        const curated = await fetchCuratedMaterial(topic, level);
        if (curated) {
          setMaterial(curated.material);
          setSource("curated");
          saveLearningMaterial(topic, level, curated.material, "curated");
          return;
        }
        const cached = getLearningMaterial(topic, level);
        if (cached) {
          setMaterial(cached.material);
          setSource(cached.source ?? "ai");
          return;
        }
      }
      setLoading(true);
      try {
        const result = await requestLearningMaterial({ topic, level });
        setMaterial(result);
        setSource("ai");
        saveLearningMaterial(topic, level, result, "ai");
      } catch (err) {
        setError(
          err instanceof AiClientError
            ? err.message
            : "Could not generate the study guide. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [topic, level],
  );

  const topicName = TOPICS.find((option) => option.id === topic)?.name ?? topic;
  const levelHint = LEVEL_OPTIONS.find((option) => option.value === level)?.hint;

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <section className="animate-fade flex flex-col gap-2 pt-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
          Curated & AI Knowledge Base
        </p>
        <h1 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-4xl">
          Engineering Study Guides
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Structured concepts, architectural tradeoffs, common mistakes, and what interviewers actually evaluate in top engineering loops.
        </p>
      </section>

      {/* Selector Card */}
      <section className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xs">
        {/* Topic Grid */}
        <fieldset className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              Select Topic
            </legend>
            <span className="text-xs text-faint">10 core domains</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {TOPICS.map((option) => {
              const isSelected = topic === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTopic(option.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-3 text-left transition-all duration-150",
                    isSelected
                      ? "border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent/30 font-semibold"
                      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg hover:bg-surface-2",
                  )}
                >
                  <span className="text-xs">{option.name}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Skill level */}
        <fieldset className="flex flex-col gap-2">
          <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Skill Level
          </legend>
          <div className="flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((option) => {
              const isSelected = level === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLevel(option.value)}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-xs font-medium transition-all duration-150",
                    isSelected
                      ? "border-accent bg-accent-soft text-accent shadow-xs ring-1 ring-accent/30 font-semibold"
                      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg hover:bg-surface-2",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted">{levelHint}</p>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="button"
            onClick={() => generate(Boolean(material))}
            disabled={loading}
            className={buttonStyles.primary}
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-canvas border-t-transparent" />
                Synthesizing Guide…
              </>
            ) : material ? (
              "Regenerate Guide"
            ) : (
              "Generate Study Guide →"
            )}
          </button>
          <Link href={`/practice?topic=${topic}`} className={buttonStyles.secondary}>
            Practice {topicName} Questions →
          </Link>
        </div>
        {error ? <ErrorNote message={error} retry={() => generate(true)} /> : null}
      </section>

      {loading && !material ? (
        <div className="py-12">
          <LoadingState label="Synthesizing your structured study guide…" />
        </div>
      ) : null}

      {material ? (
        <article className="animate-fade flex flex-col gap-10">
          {/* Guide Header */}
          <header className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 sm:p-8 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] font-semibold text-fg">
                {topicName}
              </span>
              <span className="text-faint">/</span>
              <span className="rounded-md border border-accent/20 bg-accent-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-accent">
                {DIFFICULTY_LABELS[level]}
              </span>
              <span
                className={cn(
                  "rounded-md border px-2.5 py-1 font-mono text-[11px] font-medium",
                  source === "curated"
                    ? "border-strong/20 bg-strong-soft text-strong"
                    : "border-border bg-surface-2 text-muted",
                )}
              >
                {source === "curated" ? "Curated Foundation" : "AI Synthesized"}
              </span>
            </div>

            <h2 className="text-balance text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {material.title}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-fg-muted">{material.overview}</p>

            {material.prerequisites.length > 0 ? (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border-subtle pt-3 text-xs text-muted">
                <span className="font-semibold text-fg">Prerequisites:</span>
                {material.prerequisites.map((prereq, index) => (
                  <span
                    key={index}
                    className="rounded bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-muted border border-border"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            ) : null}
          </header>

          {/* Core Sections */}
          <section className="flex flex-col gap-6">
            <SectionHeading eyebrow="Concepts" title="Core Breakdown" />
            <div className="flex flex-col gap-4">
              {material.sections.map((section, sectionIndex) => (
                <section
                  key={`${section.title}-${sectionIndex}`}
                  className="rounded-xl border border-border bg-surface p-6 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-2 font-mono text-xs font-bold text-accent border border-border">
                      {String(sectionIndex + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-base font-semibold text-fg">
                      {section.title}
                    </h3>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {section.content
                      .split("\n")
                      .filter((line) => line.trim().length > 0)
                      .map((paragraph, lineIndex) => (
                        <p key={lineIndex} className="text-sm leading-relaxed text-fg-muted">
                          {paragraph}
                        </p>
                      ))}
                  </div>

                  {section.code ? (
                    <div className="mt-4">
                      <CodeBlock code={section.code} caption={`${section.title} implementation`} />
                    </div>
                  ) : null}

                  {section.keyPoints.length > 0 ? (
                    <div className="mt-4 rounded-lg border border-border-subtle bg-surface-2/60 p-4">
                      <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                        Key Engineering Takeaways
                      </h4>
                      <ul className="flex flex-col gap-1.5">
                        {section.keyPoints.map((point, pointIndex) => (
                          <li key={pointIndex} className="flex gap-2 text-xs leading-relaxed text-muted">
                            <span aria-hidden className="text-accent font-bold">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </section>

          {/* Common Mistakes */}
          {material.commonMistakes.length > 0 ? (
            <section className="flex flex-col gap-4">
              <SectionHeading eyebrow="Pitfalls" title="Common Interview Mistakes & Corrections" />
              <div className="grid gap-3 sm:grid-cols-2">
                {material.commonMistakes.map((entry, index) => (
                  <div key={index} className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-2xs">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-weak">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-weak-soft text-[10px]">
                          ✕
                        </span>
                        <span>Anti-Pattern / Common Flaw</span>
                      </div>
                      <p className="mt-2 text-xs font-medium text-fg">
                        {entry.mistake}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-border-subtle pt-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-strong">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-strong-soft text-[10px]">
                          ✓
                        </span>
                        <span>Correct Approach</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {entry.fix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* Interview Focus & Checklist */}
          <section className="grid gap-6 lg:grid-cols-2">
            {material.interviewFocus.length > 0 ? (
              <div className="flex flex-col gap-3">
                <SectionHeading eyebrow="Probing" title="What Interviewers Drill On" />
                <ul className="flex flex-col gap-2">
                  {material.interviewFocus.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-xs text-fg shadow-2xs"
                    >
                      <span className="text-accent font-bold">↳</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {material.studyChecklist.length > 0 ? (
              <div className="flex flex-col gap-3">
                <SectionHeading eyebrow="Action Items" title="Mastery Checklist" />
                <ul className="flex flex-col gap-2">
                  {material.studyChecklist.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 text-xs text-fg shadow-2xs"
                    >
                      <span className="font-mono text-accent font-bold">☐</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </article>
      ) : !loading && hydrated ? (
        <EmptyState
          title="No study guide selected"
          description="Choose a topic and skill level above, then generate a comprehensive study guide tailored to that level."
          action={
            <button
              type="button"
              onClick={() => generate(false)}
              className={buttonStyles.primary}
            >
              Generate Guide for {topicName} →
            </button>
          }
        />
      ) : null}
    </div>
  );
}

export default function LearnPage() {
  return <LearnInner />;
}
