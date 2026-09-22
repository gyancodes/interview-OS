"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { TopicCard } from "@/components/TopicCard";
import { WeakAreaCard } from "@/components/WeakAreaCard";
import { EmptyState, SectionHeading, buttonStyles } from "@/components/ui";
import { BANK_SIZES } from "@/data/questions";
import { TOPIC_NAMES } from "@/data/topics";
import { computeOverallReadiness, computeTopicProgress, computeWeakAreas } from "@/lib/progress";
import {
  getAttempts,
  getMockInterviewHistory,
  getRecentQuestions,
} from "@/lib/storage";

import type { Attempt, MockInterviewRecord, RecentQuestion, TopicProgress, WeakArea } from "@/lib/types";
import { pluralize, truncate } from "@/lib/utils";

import { INTERVIEW_ROLE_OPTIONS } from "@/lib/constants";

const INTERVIEW_ROLE_LABELS: Record<string, string> = Object.fromEntries(
  INTERVIEW_ROLE_OPTIONS.map((option) => [option.value, option.label]),
);

export default function DashboardPage() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [recents, setRecents] = useState<RecentQuestion[]>([]);
  const [mocks, setMocks] = useState<MockInterviewRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAttempts(getAttempts());
    setRecents(getRecentQuestions());
    setMocks(getMockInterviewHistory());
    setHydrated(true);
  }, []);

  const progressList: TopicProgress[] = useMemo(
    () => computeTopicProgress(attempts, BANK_SIZES),
    [attempts],
  );

  const weakAreas: WeakArea[] = useMemo(() => computeWeakAreas(attempts), [attempts]);
  const readiness = useMemo(() => computeOverallReadiness(attempts), [attempts]);

  const lastAttempt = useMemo(() => {
    let newest: Attempt | undefined;
    let newestTime = -Infinity;
    for (const attempt of attempts) {
      const time = new Date(attempt.timestamp).getTime();
      if (!Number.isNaN(time) && time > newestTime) {
        newestTime = time;
        newest = attempt;
      }
    }
    return newest;
  }, [attempts]);

  const practiced = attempts.length;

  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <section className="animate-fade flex flex-col items-start gap-5 pt-6 sm:pt-10">
        <h1 className="max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          Prepare for your next software engineering interview.
        </h1>
        <p className="max-w-xl text-muted">
          Practice concepts, explain your thinking, and identify your weak areas.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/practice" className={buttonStyles.primary}>
            Start Practice
          </Link>
          <Link href="/mock-interview" className={buttonStyles.secondary}>
            AI Mock Interview
          </Link>
        </div>
        {hydrated && practiced > 0 ? (
          <p className="text-xs text-faint">
            {practiced} {pluralize(practiced, "attempt")} recorded · overall readiness{" "}
            <span className="font-mono text-muted">{readiness}%</span>
          </p>
        ) : null}
      </section>

      {/* Continue practicing */}
      {lastAttempt ? (
        <section>
          <SectionHeading title="Continue Practicing" />
          <Link
            href={`/practice?topic=${lastAttempt.topic}`}
            className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4 transition-colors hover:border-border-strong"
          >
            <div className="min-w-0">
              <p className="text-xs text-faint">
                {TOPIC_NAMES[lastAttempt.topic]} · {lastAttempt.category} · last practiced
              </p>
              <p className="mt-1 truncate text-sm text-fg">
                {truncate(lastAttempt.userAnswer || lastAttempt.questionId, 90)}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
              Resume →
            </span>
          </Link>
        </section>
      ) : null}

      {/* Weak areas */}
      <section>
        <SectionHeading
          title="Weak Areas"
          hint="Concepts where repeated answers were weak or partial"
          action={
            weakAreas.length > 0 ? (
              <Link
                href={`/practice?topic=${weakAreas[0]?.topic ?? "javascript"}${
                  weakAreas[0] ? `&category=${encodeURIComponent(weakAreas[0].category)}` : ""
                }`}
                className="text-xs font-medium text-accent hover:underline"
              >
                Practice Weak Areas →
              </Link>
            ) : undefined
          }
        />
        {weakAreas.length === 0 ? (
          <EmptyState
            icon="🎯"
            title="No weak areas yet"
            description="Answer a few questions and rate your confidence — struggling concepts will surface here automatically."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {weakAreas.map((area) => (
              <WeakAreaCard key={`${area.topic}-${area.category}`} area={area} />
            ))}
          </div>
        )}
      </section>

      {/* Topics */}
      <section>
        <SectionHeading title="Topics" hint="Progress is measured against the curated question bank" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progressList.map((progress) => (
            <TopicCard key={progress.topic} progress={progress} />
          ))}
        </div>
      </section>

      {/* Recent + mock history */}
      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading title="Recent Questions" />
          {recents.length === 0 ? (
            <EmptyState
              title="Nothing yet"
              description="Questions you view in practice sessions will appear here."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {recents.slice(0, 5).map((recent) => (
                <li key={recent.id}>
                  <Link
                    href={`/practice?topic=${recent.topic}`}
                    className="block rounded-md border border-border bg-surface px-4 py-3 transition-colors hover:border-border-strong"
                  >
                    <p className="text-xs text-faint">
                      {TOPIC_NAMES[recent.topic]} · {recent.category}
                    </p>
                    <p className="mt-1 text-sm text-fg">{truncate(recent.question, 110)}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <SectionHeading title="Mock Interviews" />
          {mocks.length === 0 ? (
            <EmptyState
              icon="🎤"
              title="No mock interviews yet"
              description="Run an AI mock interview to test yourself under real interview pressure."
              action={
                <Link href="/mock-interview" className={buttonStyles.secondary}>
                  Start one
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {mocks.slice(0, 5).map((mock) => (
                <li
                  key={mock.id}
                  className="rounded-md border border-border bg-surface px-4 py-3"
                >
                  <p className="text-xs text-faint">
                    {mock.level} {INTERVIEW_ROLE_LABELS[mock.role] ?? mock.role} ·{" "}
                    {mock.questionCount} questions · {new Date(mock.startedAt).toLocaleDateString()}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{mock.verdict}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
