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

  // Load a cached guide when the topic/level selection changes.
  useEffect(() => {
    const cached = getLearningMaterial(topic, level);
    setMaterial(cached?.material ?? null);
    setSource(cached?.source ?? "ai");
    setError(null);
    setHydrated(true);
  }, [topic, level]);

  const generate = useCallback(
    async (force = false) => {
      setError(null);
      if (!force) {
        const cached = getLearningMaterial(topic, level);
        if (cached) {
          setMaterial(cached.material);
          setSource(cached.source ?? "ai");
          return;
        }
        // Curated material is authored in-repo and served by the server when
        // available; AI generation fills in everything else.
        const curated = await fetchCuratedMaterial(topic, level);
        if (curated) {
          setMaterial(curated.material);
          setSource("curated");
          saveLearningMaterial(topic, level, curated.material, "curated");
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
      <section className="animate-fade flex flex-col gap-2 pt-4">
        <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Learning Materials
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Pick a topic and skill level — AI generates a structured study guide with concept
          walkthroughs, code examples, common mistakes and what interviewers actually probe.
        </p>
      </section>

      <section className="flex flex-col gap-6 rounded-lg border border-border bg-surface p-6 sm:p-8">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">Topic</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {TOPICS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTopic(option.id)}
                aria-pressed={topic === option.id}
                className={cn(
                  "rounded-md border px-3 py-2.5 text-left text-sm transition-colors",
                  topic === option.id
                    ? "border-accent/60 bg-accent-soft text-accent"
                    : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {option.name}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-fg">Skill level</legend>
          <div className="flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLevel(option.value)}
                aria-pressed={level === option.value}
                className={cn(
                  "rounded-md border px-3.5 py-2 text-sm transition-colors",
                  level === option.value
                    ? "border-accent/60 bg-accent-soft text-accent"
                    : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-faint">{levelHint}</p>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => generate(Boolean(material))}
            disabled={loading}
            className={buttonStyles.primary}
          >
            {loading
              ? "Generating study guide…"
              : material
                ? "Regenerate guide"
                : "Generate study guide"}
          </button>
          <Link href={`/practice?topic=${topic}`} className={buttonStyles.secondary}>
            Practice {topicName} →
          </Link>
        </div>
        {error ? <ErrorNote message={error} retry={() => generate(true)} /> : null}
      </section>

      {loading && !material ? <LoadingState label="Generating your study guide…" /> : null}

      {material ? (
        <article className="flex flex-col gap-8">
          <header className="animate-fade flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-border-strong bg-surface-2 px-2.5 py-0.5 font-medium text-fg">
                {topicName}
              </span>
              <span className="text-faint">/</span>
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-medium text-accent">
                {DIFFICULTY_LABELS[level]}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-medium",
                  source === "curated" ? "bg-strong/10 text-strong" : "bg-accent/10 text-accent",
                )}
              >
                {source === "curated" ? "Curated" : "AI generated"}
              </span>
            </div>
            <h2 className="text-balance text-xl font-semibold text-fg sm:text-2xl">{material.title}</h2>
            <p className="max-w-3xl text-sm text-muted">{material.overview}</p>
            {material.prerequisites.length > 0 ? (
              <p className="text-xs text-faint">
                <span className="font-medium text-muted">Before starting: </span>
                {material.prerequisites.join(" · ")}
              </p>
            ) : null}
          </header>

          <section className="flex flex-col gap-5">
            <SectionHeading title="Study Guide" />
            {material.sections.map((section, sectionIndex) => (
              <section
                key={`${section.title}-${sectionIndex}`}
                className="rounded-lg border border-border bg-surface p-5"
              >
                <h3 className="flex items-baseline gap-3 font-medium text-fg">
                  <span className="font-mono text-xs text-faint">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h3>
                <div className="mt-3 flex flex-col gap-3">
                  {section.content
                    .split("\n")
                    .filter((line) => line.trim().length > 0)
                    .map((paragraph, lineIndex) => (
                      <p key={lineIndex} className="text-sm leading-relaxed text-muted">
                        {paragraph}
                      </p>
                    ))}
                </div>
                {section.code ? (
                  <div className="mt-4">
                    <CodeBlock code={section.code} />
                  </div>
                ) : null}
                {section.keyPoints.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-1.5">
                    {section.keyPoints.map((point, pointIndex) => (
                      <li key={pointIndex} className="flex gap-2 text-sm text-fg">
                        <span aria-hidden className="text-accent">
                          •
                        </span>
                        {point}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </section>

          {material.commonMistakes.length > 0 ? (
            <section className="flex flex-col gap-3">
              <SectionHeading title="Common Mistakes" />
              <div className="grid gap-3 sm:grid-cols-2">
                {material.commonMistakes.map((entry, index) => (
                  <div key={index} className="rounded-lg border border-weak/30 bg-surface p-4">
                    <p className="text-sm font-medium text-fg">
                      <span aria-hidden className="mr-1.5 text-weak">
                        ✕
                      </span>
                      {entry.mistake}
                    </p>
                    <p className="mt-1.5 text-sm text-muted">
                      <span className="font-medium text-strong">Fix: </span>
                      {entry.fix}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-8 lg:grid-cols-2">
            {material.interviewFocus.length > 0 ? (
              <div>
                <SectionHeading title="What Interviewers Probe" />
                <ul className="flex flex-col gap-2">
                  {material.interviewFocus.map((item, index) => (
                    <li
                      key={index}
                      className="rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {material.studyChecklist.length > 0 ? (
              <div>
                <SectionHeading title="Practice Checklist" />
                <ul className="flex flex-col gap-2">
                  {material.studyChecklist.map((item, index) => (
                    <li
                      key={index}
                      className="flex gap-2.5 rounded-md border border-border bg-surface px-4 py-3 text-sm text-muted"
                    >
                      <span aria-hidden className="font-mono text-xs text-accent">
                        ☐
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </article>
      ) : !loading && hydrated ? (
        <EmptyState
          icon="📚"
          title="No study guide yet"
          description="Choose a topic and skill level above, then generate an AI-built study guide tailored to that level."
        />
      ) : null}
    </div>
  );
}

export default function LearnPage() {
  return <LearnInner />;
}
