"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { TopicCard } from "@/components/TopicCard";
import { WeakAreaCard } from "@/components/WeakAreaCard";
import { EmptyState, SectionHeading, buttonStyles } from "@/components/ui";
import { TOPIC_NAMES, TRACKS, TOPICS, type Track } from "@/data/topics";
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
  const [selectedTrack, setSelectedTrack] = useState<string>("All");

  useEffect(() => {
    setAttempts(getAttempts());
    setRecents(getRecentQuestions());
    setMocks(getMockInterviewHistory());
    setHydrated(true);
  }, []);

  const progressList: TopicProgress[] = useMemo(
    () => computeTopicProgress(attempts),
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
  const activeTopicsCount = useMemo(
    () => progressList.filter((item) => item.attempted > 0).length,
    [progressList],
  );

  const filteredProgressList = useMemo(() => {
    if (selectedTrack === "All") return progressList;
    return progressList.filter((progress) => {
      const topicData = TOPICS.find((t) => t.id === progress.topic);
      return topicData?.track === selectedTrack;
    });
  }, [progressList, selectedTrack]);

  return (
    <div className="flex flex-col gap-14">
      {/* Hero Section */}
      <section className="animate-fade relative flex flex-col items-start gap-6 pt-4 sm:pt-8">
        {/* Status Announcement Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
          <span className="font-medium text-fg">InterviewOS 2.0</span>
          <span className="text-faint">·</span>
          <span>Adaptive AI Technical Prep</span>
        </div>

        {/* Display Typography */}
        <div className="flex max-w-3xl flex-col gap-3">
          <h1 className="text-balance text-3xl font-bold tracking-tight text-fg sm:text-5xl sm:leading-[1.15]">
            Master technical interviews with{" "}
            <span className="text-accent underline decoration-accent/25 decoration-4 underline-offset-4">
              precision & speed
            </span>
            .
          </h1>
          <p className="max-w-2xl text-base text-muted sm:text-lg">
            Practice live AI-generated questions, read structured engineering guides, and simulate high-pressure interviews with real-time feedback.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link href="/practice" className={buttonStyles.primary}>
            Start Practice <span aria-hidden>→</span>
          </Link>
          <Link href="/mock-interview" className={buttonStyles.accent}>
            <span>✦</span> AI Mock Interview
          </Link>
          <Link href="/learn" className={buttonStyles.secondary}>
            Study Guides
          </Link>
        </div>
      </section>

      {/* Metrics & Readiness Ribbon */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Readiness Score
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-fg">
              {hydrated ? `${readiness}%` : "—"}
            </span>
            <span className="text-[11px] text-muted">overall</span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-border-subtle">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${readiness}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Total Attempts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-fg">
              {hydrated ? practiced : "—"}
            </span>
            <span className="text-[11px] text-muted">recorded</span>
          </div>
          <p className="mt-1 text-[11px] text-faint">questions answered</p>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Active Topics
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-fg">
              {hydrated ? activeTopicsCount : "—"}
            </span>
            <span className="text-[11px] text-muted">of {TOPICS.length}</span>
          </div>
          <p className="mt-1 text-[11px] text-faint">in active practice</p>
        </div>

        <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-4 shadow-2xs">
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
            Weak Areas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl font-bold tracking-tight text-fg">
              {hydrated ? weakAreas.length : "—"}
            </span>
            <span className="text-[11px] text-muted">identified</span>
          </div>
          <p className="mt-1 text-[11px] text-faint">needs revision</p>
        </div>
      </section>

      {/* Continue Practicing Card (if available) */}
      {lastAttempt ? (
        <section className="animate-fade">
          <SectionHeading eyebrow="Quick Resume" title="Continue Practicing" />
          <Link
            href={`/practice?topic=${lastAttempt.topic}`}
            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-accent/30 bg-accent-soft/30 p-5 shadow-2xs transition-all duration-200 hover:border-accent hover:bg-accent-soft/50"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-xs">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-fg">
                    {TOPIC_NAMES[lastAttempt.topic]}
                  </span>
                  <span className="text-faint">/</span>
                  <span className="text-xs text-muted">{lastAttempt.category}</span>
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-fg">
                  {truncate(lastAttempt.userAnswer || lastAttempt.questionId, 95)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs font-semibold text-accent group-hover:translate-x-0.5 transition-transform">
                Resume Session →
              </span>
            </div>
          </Link>
        </section>
      ) : null}

      {/* Weak Areas Section */}
      <section>
        <SectionHeading
          eyebrow="Targeted Revision"
          title="Priority Weak Areas"
          hint="Concepts where multiple attempts were graded weak or partial"
          action={
            weakAreas.length > 0 ? (
              <Link
                href={`/practice?topic=${weakAreas[0]?.topic ?? "javascript"}${
                  weakAreas[0] ? `&category=${encodeURIComponent(weakAreas[0].category)}` : ""
                }`}
                className="text-xs font-semibold text-accent hover:underline inline-flex items-center gap-1"
              >
                Practice All Weak Areas <span aria-hidden>→</span>
              </Link>
            ) : undefined
          }
        />
        {weakAreas.length === 0 ? (
          <EmptyState
            title="No weak areas identified yet"
            description="Answer a few practice questions and rate your confidence — struggling concepts will surface here automatically."
            action={
              <Link href="/practice" className={buttonStyles.secondary}>
                Start First Practice Session
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {weakAreas.slice(0, 4).map((area) => (
              <WeakAreaCard key={`${area.topic}-${area.category}`} area={area} />
            ))}
          </div>
        )}
      </section>

      {/* Topics Catalog with Track Filtering */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
              Curriculum
            </p>
            <h2 className="text-lg font-bold tracking-tight text-fg">Engineering Topics</h2>
            <p className="mt-0.5 text-xs text-muted">
              Select a domain to practice live questions or study core theory
            </p>
          </div>

          {/* Track Filter Pills */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface-2/60 p-1">
            <button
              type="button"
              onClick={() => setSelectedTrack("All")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTrack === "All"
                  ? "bg-surface text-fg shadow-2xs border border-border"
                  : "text-muted hover:text-fg"
              }`}
            >
              All Tracks
            </button>
            {TRACKS.map((track) => (
              <button
                key={track}
                type="button"
                onClick={() => setSelectedTrack(track)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedTrack === track
                    ? "bg-surface text-fg shadow-2xs border border-border"
                    : "text-muted hover:text-fg"
                }`}
              >
                {track}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProgressList.map((progress) => (
            <TopicCard key={progress.topic} progress={progress} />
          ))}
        </div>
      </section>

      {/* Recent Practice & Mock History Split */}
      <section className="grid gap-8 lg:grid-cols-2">
        {/* Recent Questions */}
        <div className="flex flex-col gap-4">
          <SectionHeading eyebrow="History" title="Recent Practice Questions" />
          {recents.length === 0 ? (
            <EmptyState
              title="No recent practice yet"
              description="Questions you answer during live practice sessions will appear here for review."
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {recents.slice(0, 5).map((recent) => (
                <li key={recent.id}>
                  <Link
                    href={`/practice?topic=${recent.topic}`}
                    className="group block rounded-xl border border-border bg-surface p-4 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
                        <span className="font-semibold text-fg">{TOPIC_NAMES[recent.topic]}</span>
                        <span className="text-faint">/</span>
                        <span>{recent.category}</span>
                      </div>
                      <span className="text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                        Practice again →
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium text-fg line-clamp-2">
                      {recent.question}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mock Interviews */}
        <div className="flex flex-col gap-4">
          <SectionHeading
            eyebrow="Simulations"
            title="Mock Interview Records"
            action={
              mocks.length > 0 ? (
                <Link href="/mock-interview" className="text-xs font-semibold text-accent hover:underline">
                  New Interview →
                </Link>
              ) : undefined
            }
          />
          {mocks.length === 0 ? (
            <EmptyState
              title="No mock interviews taken"
              description="Test yourself under simulated real-world conditions with our adaptive AI interviewer."
              action={
                <Link href="/mock-interview" className={buttonStyles.primary}>
                  Start First Simulation
                </Link>
              }
            />
          ) : (
            <ul className="flex flex-col gap-2.5">
              {mocks.slice(0, 5).map((mock) => (
                <li
                  key={mock.id}
                  className="rounded-xl border border-border bg-surface p-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wider text-fg">
                      {mock.level} {INTERVIEW_ROLE_LABELS[mock.role] ?? mock.role}
                    </span>
                    <span className="font-mono text-faint">
                      {new Date(mock.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {mock.questionCount} questions · {mock.durationMinutes} min session
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fg">
                    {mock.verdict}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
