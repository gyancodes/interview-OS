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
      <div className="flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">AI Mock Interview</h1>
          <p className="mt-1 text-sm text-muted">
            A realistic interview simulation. The interviewer asks questions, drills into your
            answers, challenges assumptions — and never reveals the answer mid-interview.
          </p>
        </header>

        <fieldset className="rounded-lg border border-border bg-surface p-6">
          <legend className="mb-3 text-sm font-medium text-fg">Role</legend>
          <div className="flex flex-col gap-2">
            {INTERVIEW_ROLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                aria-pressed={role === option.value}
                className={`flex items-center justify-between rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
                  role === option.value
                    ? "border-accent/60 bg-accent-soft text-accent"
                    : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg"
                }`}
              >
                {option.label}
                <span className="text-xs text-faint">{option.hint}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset className="rounded-lg border border-border bg-surface p-6">
            <legend className="mb-3 text-sm font-medium text-fg">Level</legend>
            <div className="flex flex-col gap-2">
              {INTERVIEW_LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLevel(option.value)}
                  aria-pressed={level === option.value}
                  className={`rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
                    level === option.value
                      ? "border-accent/60 bg-accent-soft text-accent"
                      : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg"
                  }`}
                >
                  {option.label}
                  <span className="ml-2 text-xs text-faint">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="rounded-lg border border-border bg-surface p-6">
            <legend className="mb-3 text-sm font-medium text-fg">Duration</legend>
            <div className="flex flex-col gap-2">
              {INTERVIEW_DURATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDuration(option.value)}
                  aria-pressed={duration === option.value}
                  className={`rounded-md border px-4 py-2.5 text-left text-sm transition-colors ${
                    duration === option.value
                      ? "border-accent/60 bg-accent-soft text-accent"
                      : "border-border bg-surface-2 text-muted hover:border-border-strong hover:text-fg"
                  }`}
                >
                  {option.label}
                  <span className="ml-2 text-xs text-faint">{option.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <div>
          <button type="button" onClick={start} className={buttonStyles.primary}>
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------- Summary ------------------------------- */
  if (screen === "summary" && summary) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Interview Summary</h1>
          <p className="mt-1 text-sm text-muted">
            {level} {role} · {questionCount.current} questions · {Math.round(elapsedMinutes())} min
          </p>
        </header>

        <section className="rounded-lg border border-border bg-surface p-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Verdict</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{summary.verdict}</p>
        </section>

        <div className="grid gap-6 sm:grid-cols-2">
          <SummaryList title="Topics Covered" items={summary.topicsCovered} icon="◆" />
          <SummaryList title="Strengths" items={summary.strengths} icon="✓" tone="strong" />
          <SummaryList title="Needs Practice" items={summary.needsPractice} icon="→" tone="partial" />
          <SummaryList title="Suggested Practice" items={summary.suggestedPractice} icon="◆" />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => setScreen("config")} className={buttonStyles.primary}>
            New Interview
          </button>
          <a href="/practice" className={buttonStyles.secondary}>
            Practice Weak Areas
          </a>
        </div>
      </div>
    );
  }

  /* -------------------------------- Live --------------------------------- */
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">AI Interviewer</h1>
          <p className="text-xs text-faint">
            {level} {role} · {formatDuration(duration * 60 - elapsedMinutes() * 60)} remaining
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("End the interview and see your feedback?")) void endInterview();
          }}
          className={buttonStyles.ghost}
        >
          {summarizing ? "Summarizing…" : "End & Get Feedback"}
        </button>
      </header>

      {error ? (
        <div role="alert" className="rounded-md border border-weak/40 bg-weak/10 px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <div className="scrollbar-thin flex min-h-[50vh] flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        {turns.map((turn, i) =>
          turn.role === "system" ? (
            <p key={i} className="mx-auto my-1 text-center text-xs text-faint">
              {turn.content}
            </p>
          ) : (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg border px-4 py-3 text-sm leading-relaxed ${
                turn.role === "interviewer"
                  ? "self-start border-border bg-surface-2 text-fg"
                  : "self-end border-accent/30 bg-accent-soft/50 text-fg"
              }`}
            >
              {turn.topic && turn.role === "interviewer" ? (
                <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-faint">
                  {turn.topic}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap">{turn.content}</p>
            </div>
          ),
        )}

        {thinking ? (
          <div className="self-start rounded-lg border border-border bg-surface-2 px-4 py-3">
            <LoadingState label="Interviewer is thinking…" />
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="candidate-answer" className="sr-only">
          Your answer
        </label>
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
          placeholder="Answer as you would out loud. ⌘+Enter to send."
          disabled={thinking || summarizing}
          className="scrollbar-thin w-full resize-y rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-fg transition-colors placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none disabled:opacity-60"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={submitAnswer}
            disabled={thinking || summarizing || !input.trim()}
            className={buttonStyles.primary}
          >
            Send Answer
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
  const toneClass = { strong: "text-strong", partial: "text-partial", muted: "text-muted" }[tone];
  return (
    <section className="rounded-lg border border-border bg-surface p-5">
      <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${toneClass}`}>{title}</h2>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-relaxed text-fg">
            <span aria-hidden className="shrink-0 pt-0.5 text-xs opacity-70">
              {icon}
            </span>
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
