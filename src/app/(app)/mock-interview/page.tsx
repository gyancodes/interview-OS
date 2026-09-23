"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { EmptyState, LoadingState, buttonStyles } from "@/components/ui";
import {
  INTERVIEW_DURATION_OPTIONS,
  INTERVIEW_LEVEL_OPTIONS,
  INTERVIEW_ROLE_OPTIONS,
} from "@/lib/constants";
import {
  AiClientError,
  requestInterviewSummary,
  requestInterviewTurn,
} from "@/lib/ai-client";
import { addMockInterviewRecord } from "@/lib/storage";

import type {
  InterviewDuration,
  InterviewLevel,
  InterviewRole,
  InterviewSummary,
  InterviewTurnResponse,
} from "@/lib/types";
import { formatDuration } from "@/lib/utils";

type Screen = "config" | "live" | "summary";

interface ChatTurn {
  role: "interviewer" | "candidate" | "system";
  content: string;
  topic?: string;
}

const WRAPUP_THRESHOLD_MINUTES = 0.92;

function MockInterviewInner() {
  const [screen, setScreen] = useState<Screen>("config");
  const [role, setRole] = useState<InterviewRole>("backend");
  const [level, setLevel] = useState<InterviewLevel>("mid");
  const [duration, setDuration] = useState<InterviewDuration>(30);

  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InterviewSummary | null>(null);
  const [summarizing, setSummarizing] = useState(false);

  const startedAt = useRef<number>(0);
  const questionCount = useRef<number>(0);
  const lastDifficulty = useRef<string>("beginner");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, thinking]);

  const transcript = useCallback(
    () =>
      turns
        .filter((turn) => turn.role !== "system")
        .map((turn) => `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}`)
        .join("\n\n"),
    [turns],
  );

  const elapsedMinutes = useCallback(
    () => (startedAt.current ? (Date.now() - startedAt.current) / 60000 : 0),
    [],
  );

  const askInterviewer = useCallback(
    async (history: ChatTurn[]) => {
      setThinking(true);
      setError(null);
      try {
        const response: InterviewTurnResponse = await requestInterviewTurn({
          role,
          level,
          durationMinutes: duration,
          elapsedMinutes: Math.round(elapsedMinutes()),
          questionCount: questionCount.current,
          transcript: history
            .filter((turn) => turn.role !== "system")
            .map((turn) => `${turn.role === "interviewer" ? "Interviewer" : "Candidate"}: ${turn.content}`)
            .join("\n\n") || "The interview is just starting. Open with a brief greeting and your first question.",
        });
        questionCount.current += 1;
        lastDifficulty.current = response.difficulty;
        setTurns((previous) => [
          ...previous,
          { role: "interviewer", content: response.message, topic: response.topic },
        ]);
        if (response.shouldWrapUp || elapsedMinutes() >= duration * WRAPUP_THRESHOLD_MINUTES) {
          setTurns((previous) => [
            ...previous,
            {
              role: "system",
              content: "The interviewer is wrapping up. Answer if you like, or end the interview below.",
            },
          ]);
        }
      } catch (err) {
        setError(
          err instanceof AiClientError
            ? err.message
            : "The interviewer is temporarily unavailable. Your answers are safe — try again.",
        );
      } finally {
        setThinking(false);
        textareaRef.current?.focus();
      }
    },
    [role, level, duration, elapsedMinutes],
  );

  const start = useCallback(() => {
    startedAt.current = Date.now();
    questionCount.current = 0;
    lastDifficulty.current = "beginner";
    setTurns([]);
    setSummary(null);
    setScreen("live");
    void askInterviewer([]);
  }, [askInterviewer]);

  const submitAnswer = useCallback(() => {
    const answer = input.trim();
    if (!answer || thinking) return;
    const nextTurns: ChatTurn[] = [...turns, { role: "candidate", content: answer }];
    setTurns(nextTurns);
    setInput("");
    void askInterviewer(nextTurns);
  }, [input, thinking, turns, askInterviewer]);

  const endInterview = useCallback(async () => {
    setSummarizing(true);
    setError(null);
    try {
      const result = await requestInterviewSummary({
        role,
        level,
        transcript: transcript(),
      });
      setSummary(result);
      setScreen("summary");

      addMockInterviewRecord({
        id: `mock-${Date.now()}`,
        role,
        level,
        durationMinutes: duration,
        startedAt: new Date(startedAt.current).toISOString(),
        endedAt: new Date().toISOString(),
        questionCount: questionCount.current,
        topicsCovered: result.topicsCovered,
        strengths: result.strengths,
        needsPractice: result.needsPractice,
        verdict: result.verdict,
      });
    } catch (err) {
      setError(
        err instanceof AiClientError
          ? err.message
          : "Could not generate the interview summary. Try again in a moment.",
      );
    } finally {
      setSummarizing(false);
    }
  }, [role, level, duration, transcript]);

  /* ------------------------------- Config -------------------------------- */
  if (screen === "config") {
    return (
      <div className="flex max-w-3xl flex-col gap-8">
        <header className="animate-fade">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
            High-Pressure Simulation
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-4xl">AI Mock Interview</h1>
          <p className="mt-1 text-sm text-muted">
            Realistic interview simulation. The AI asks questions, probes edge cases, drills into your architecture decisions, and evaluates your performance upon completion.
          </p>
        </header>

        {/* Role selection */}
        <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-2xs">
          <div className="flex items-center justify-between">
            <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              1. Engineering Role
            </legend>
            <span className="text-xs text-faint">Focus area</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {INTERVIEW_ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-150 ${
                  role === option.value
                    ? "border-accent bg-accent-soft text-fg shadow-xs ring-1 ring-accent/30"
                    : "border-border bg-surface text-fg hover:border-border-strong hover:bg-surface-2/60"
                }`}
              >
                <span
                  className={`text-xs font-semibold ${
                    role === option.value ? "text-accent" : "text-fg"
                  }`}
                >
                  {option.label}
                </span>
                <span className="mt-0.5 text-[11px] text-faint">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Level & Duration */}
        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-2xs">
            <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              2. Target Seniority
            </legend>
            <div className="flex flex-col gap-2">
              {INTERVIEW_LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLevel(option.value)}
                  aria-pressed={level === option.value}
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs transition-all duration-150 ${
                    level === option.value
                      ? "border-accent bg-accent-soft font-semibold text-accent ring-1 ring-accent/30 shadow-xs"
                      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg hover:bg-surface-2"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-[11px] text-faint">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-2xs">
            <legend className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
              3. Time Allotment
            </legend>
            <div className="flex flex-col gap-2">
              {INTERVIEW_DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDuration(option.value)}
                  aria-pressed={duration === option.value}
                  className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 text-left text-xs transition-all duration-150 ${
                    duration === option.value
                      ? "border-accent bg-accent-soft font-semibold text-accent ring-1 ring-accent/30 shadow-xs"
                      : "border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg hover:bg-surface-2"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-[11px] text-faint">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <p className="text-xs text-muted">
            The interview starts immediately once initiated.
          </p>
          <button type="button" onClick={start} className={buttonStyles.primary}>
            Start Interview Session <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------- Summary ------------------------------- */
  if (screen === "summary" && summary) {
    return (
      <div className="flex max-w-3xl flex-col gap-8 animate-fade">
        <header>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-accent">
            Assessment Complete
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Interview Performance Report</h1>
          <p className="mt-1 font-mono text-xs text-muted">
            {level.toUpperCase()} {role.toUpperCase()} · {questionCount.current} questions answered · {Math.round(elapsedMinutes())} minutes elapsed
          </p>
        </header>

        {/* Executive Verdict */}
        <section className="rounded-xl border border-accent/30 bg-accent-soft/30 p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            <span>✦</span> Overall Hiring Committee Verdict
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg font-medium">
            {summary.verdict}
          </p>
        </section>

        {/* 4-Item Assessment Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryList title="Topics Evaluated" items={summary.topicsCovered} icon="◆" />
          <SummaryList title="Demonstrated Strengths" items={summary.strengths} icon="✓" tone="strong" />
          <SummaryList title="Areas Needing Revision" items={summary.needsPractice} icon="→" tone="partial" />
          <SummaryList title="Targeted Recommendations" items={summary.suggestedPractice} icon="✦" />
        </div>

        <div className="flex items-center gap-3 border-t border-border pt-4">
          <button type="button" onClick={() => setScreen("config")} className={buttonStyles.primary}>
            New Interview Simulation
          </button>
          <a href="/practice" className={buttonStyles.secondary}>
            Practice Weak Topics →
          </a>
        </div>
      </div>
    );
  }

  /* -------------------------------- Live --------------------------------- */
  const remainingSeconds = Math.max(0, duration * 60 - elapsedMinutes() * 60);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      {/* Live Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-fg text-canvas shadow-xs">
            <span className="font-mono text-xs font-bold">AI</span>
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-fg">Technical Interviewer</h1>
            <p className="font-mono text-[11px] text-muted uppercase">
              {level} · {role}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Remaining duration pill */}
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-3 py-1 font-mono text-xs text-fg">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>{formatDuration(remainingSeconds)} left</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm("End the interview session and compute your evaluation report?")) void endInterview();
            }}
            disabled={summarizing}
            className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-muted hover:border-weak hover:text-weak hover:bg-weak-soft/40 transition-colors"
          >
            {summarizing ? "Evaluating…" : "End Session"}
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" className="rounded-lg border border-weak/40 bg-weak-soft/80 px-4 py-3 text-xs text-weak">
          {error}
        </div>
      ) : null}

      {/* Chat Transcript Area */}
      <div className="scrollbar-thin flex min-h-[52vh] max-h-[62vh] overflow-y-auto flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-2xs">
        {turns.map((turn, i) =>
          turn.role === "system" ? (
            <div key={i} className="mx-auto my-2 rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-[10px] text-muted">
              {turn.content}
            </div>
          ) : (
            <div
              key={i}
              className={`flex flex-col gap-1 max-w-[88%] ${
                turn.role === "interviewer" ? "self-start" : "self-end items-end"
              }`}
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-faint">
                <span>{turn.role === "interviewer" ? "AI Interviewer" : "You"}</span>
                {turn.topic && turn.role === "interviewer" ? (
                  <>
                    <span>·</span>
                    <span className="uppercase text-accent font-semibold">{turn.topic}</span>
                  </>
                ) : null}
              </div>

              <div
                className={`rounded-xl border p-4 text-xs sm:text-sm leading-relaxed ${
                  turn.role === "interviewer"
                    ? "border-border bg-surface-2/80 text-fg shadow-2xs"
                    : "border-accent/30 bg-accent-soft text-fg shadow-2xs"
                }`}
              >
                <p className="whitespace-pre-wrap">{turn.content}</p>
              </div>
            </div>
          ),
        )}

        {thinking ? (
          <div className="self-start rounded-xl border border-border bg-surface-2 p-4 shadow-2xs">
            <LoadingState label="Interviewer is analyzing your response…" />
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {/* Candidate Response Editor */}
      <div className="flex flex-col gap-2">
        <label htmlFor="candidate-answer" className="sr-only">
          Your Answer
        </label>
        <div className="relative">
          <textarea
            id="candidate-answer"
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                submitAnswer();
              }
            }}
            rows={4}
            placeholder="Type your response as you would explain out loud in an interview… (⌘+Enter to send)"
            disabled={thinking || summarizing}
            className="scrollbar-thin w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm text-fg transition-all placeholder:text-faint focus:border-accent focus:ring-2 focus:ring-accent/15 focus:outline-none disabled:opacity-60 leading-relaxed"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted">
            <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 font-mono text-[10px]">
              ⌘+Enter
            </kbd>{" "}
            to submit response
          </span>
          <button
            type="button"
            onClick={submitAnswer}
            disabled={thinking || summarizing || !input.trim()}
            className={buttonStyles.primary}
          >
            Send Response <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryList({
  title,
  items,
  icon,
  tone = "muted",
}: {
  title: string;
  items: string[];
  icon: string;
  tone?: "strong" | "partial" | "muted";
}) {
  if (items.length === 0) return null;
  const toneClass = {
    strong: "text-strong bg-strong-soft border-strong/20",
    partial: "text-partial bg-partial-soft border-partial/20",
    muted: "text-fg bg-surface-2 border-border",
  }[tone];

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 shadow-2xs">
      <div className="flex items-center gap-2">
        <span className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-bold ${toneClass}`}>
          {icon}
        </span>
        <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-fg">{title}</h2>
      </div>
      <ul className="flex flex-col gap-1.5 pl-6">
        {items.map((item, index) => (
          <li key={index} className="text-xs leading-relaxed text-muted">
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MockInterviewPage() {
  return <MockInterviewInner />;
}
