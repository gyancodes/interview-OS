"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AiResponse } from "@/components/AiResponse";
import { AnswerEditor } from "@/components/AnswerEditor";
import { CodeBlock } from "@/components/CodeBlock";
import { ConfidenceSelector } from "@/components/ConfidenceSelector";
import { FeedbackCard } from "@/components/FeedbackCard";
import { PracticeConfig, type PracticeConfigState } from "@/components/PracticeConfig";
import { QuestionCard } from "@/components/QuestionCard";
import { ErrorNote, LoadingState, buttonStyles } from "@/components/ui";
import { TOPIC_NAMES, isTopicId } from "@/data/topics";
import {
  AiClientError,
  requestEvaluation,
  requestExplanation,
  requestFollowUp,
  requestGeneratedQuestion,
} from "@/lib/ai-client";
import { EXPLANATION_ACTIONS } from "@/lib/constants";
import { addAttempt, recordRecentQuestion } from "@/lib/storage";

import type {
  Attempt,
  Confidence,
  ExplanationMode,
  PracticeQuestion,
} from "@/lib/types";

type Screen = "config" | "session";

interface ExplanationState {
  mode: ExplanationMode;
  title: string;
  content: string;
  code?: string;
  keyPoints: string[];
}

function PracticeInner() {
  const searchParams = useSearchParams();
  const [screen, setScreen] = useState<Screen>("config");
  const [config, setConfig] = useState<PracticeConfigState>({
    topic: "javascript",
    difficulty: "mixed",
    count: 5,
  });

  // Session state
  const [queue, setQueue] = useState<PracticeQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [confidenceRecorded, setConfidenceRecorded] = useState(false);

  // AI state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<
    Awaited<ReturnType<typeof requestEvaluation>> | null
  >(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);
  const [followUp, setFollowUp] = useState<
    Awaited<ReturnType<typeof requestFollowUp>> | null
  >(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [explanations, setExplanations] = useState<Partial<Record<ExplanationMode, ExplanationState | "loading">>>(
    {},
  );
  const [explanationErrors, setExplanationErrors] = useState<Partial<Record<ExplanationMode, string>>>({});
  const questionStarter = useRef<AbortController | null>(null);

  const current = queue[index];

  // Preselect topic/category from query params on the config screen.
  useEffect(() => {
    const topic = searchParams.get("topic");
    if (topic && isTopicId(topic)) {
      setConfig((previous) => ({ ...previous, topic }));
      setScreen("config");
    }
  }, [searchParams]);

  const recordAttempt = useCallback(
    (question: PracticeQuestion, confidence: Confidence) => {
      const attempt: Attempt = {
        questionId: question.id,
        topic: isTopicId(question.topic) ? question.topic : "javascript",
        category: question.category,
        difficulty: question.difficulty,
        confidence,
        userAnswer: answer,
        timestamp: new Date().toISOString(),
        source: question.source,
      };
      addAttempt(attempt);
      setConfidenceRecorded(true);
    },
    [answer],
  );

  /** Generates one AI question and appends it to the queue. */
  const generateNextQuestion = useCallback(
    async (topicKey: string, difficulty: string, category?: string) => {
      const avoid = queue
        .slice(-6)
        .map((question) => question.question)
        .filter(Boolean);
      const generated = await requestGeneratedQuestion({
        topic: topicKey,
        difficulty,
        category,
        avoidQuestions: avoid,
      });
      return generated;
    },
    [queue],
  );

  const startSession = useCallback(async () => {
    setGenerateError(null);
    setQueue([]);
    setIndex(0);
    setScreen("session");

    // Questions are always generated live: first question now, the rest on demand.
    setGenerating(true);
    try {
      const generated = await generateNextQuestion(config.topic, config.difficulty);
      questionStarter.current?.abort();
      setQueue([
        {
          id: `ai-${config.topic}-${Date.now()}`,
          topic: isTopicId(config.topic) ? config.topic : "javascript",
          category: generated.category,
          difficulty: generated.difficulty,
          question: generated.question,
          idealAnswer: generated.idealAnswer,
          explanation: generated.explanation,
          code: generated.code || undefined,
          tags: generated.concepts,
          followUps: generated.followUps,
          interviewTip: generated.interviewTip,
          concepts: generated.concepts,
          source: "ai",
        },
      ]);
      setIndex(0);
    } catch (error) {
      setGenerateError(
        error instanceof AiClientError
          ? error.message
          : "Could not generate a question. Please try again.",
      );
      setScreen("config");
    } finally {
      setGenerating(false);
    }
  }, [config, generateNextQuestion]);

  const resetQuestionState = useCallback(() => {
    setAnswer("");
    setRevealed(false);
    setConfidenceRecorded(false);
    setEvaluation(null);
    setEvaluateError(null);
    setFollowUp(null);
    setExplanations({});
    setExplanationErrors({});
  }, []);

  const advance = useCallback(
    async (confidence: Confidence) => {
      if (!current) return;
      recordAttempt(current, confidence);

      const nextIndex = index + 1;
      resetQuestionState();

      if (nextIndex >= config.count) {
        setScreen("config");
        setQueue([]);
        return;
      }

      // Generate the next question on demand.
      setGenerating(true);
      setGenerateError(null);
      try {
        const generated = await generateNextQuestion(config.topic, config.difficulty);
        setQueue((previous) => {
          const copy = [...previous];
          copy[nextIndex] = {
            id: `ai-${config.topic}-${Date.now()}`,
            topic: isTopicId(config.topic) ? config.topic : "javascript",
            category: generated.category,
            difficulty: generated.difficulty,
            question: generated.question,
            idealAnswer: generated.idealAnswer,
            explanation: generated.explanation,
            code: generated.code || undefined,
            tags: generated.concepts,
            followUps: generated.followUps,
            interviewTip: generated.interviewTip,
            concepts: generated.concepts,
            source: "ai",
          };
          return copy;
        });
        setIndex(nextIndex);
      } catch (error) {
        setGenerateError(
          error instanceof AiClientError
            ? error.message
            : "Could not generate the next question.",
        );
      } finally {
        setGenerating(false);
      }
    },
    [current, index, config, recordAttempt, resetQuestionState, generateNextQuestion],
  );

  const reveal = useCallback(() => {
    if (!current) return;
    setRevealed(true);
    recordRecentQuestion(current);
  }, [current]);

  const runEvaluation = useCallback(async () => {
    if (!current || !answer.trim()) return;
    setEvaluating(true);
    setEvaluateError(null);
    try {
      const result = await requestEvaluation({
        topic: TOPIC_NAMES[isTopicId(current.topic) ? current.topic : "javascript"],
        question: current.question,
        idealAnswer: current.idealAnswer,
        candidateAnswer: answer,
      });
      setEvaluation(result);
    } catch (error) {
      setEvaluateError(
        error instanceof AiClientError
          ? `${error.message} Your answer has still been saved — try again in a moment.`
          : "AI feedback is temporarily unavailable. Your answer has been saved.",
      );
    } finally {
      setEvaluating(false);
    }
  }, [current, answer]);

  const runFollowUp = useCallback(async () => {
    if (!current || !evaluation) return;
    setFollowUpLoading(true);
    try {
      const result = await requestFollowUp({
        topic: TOPIC_NAMES[isTopicId(current.topic) ? current.topic : "javascript"],
        question: current.question,
        candidateAnswer: answer,
        missingConcepts: evaluation.missingConcepts,
      });
      setFollowUp(result);
    } catch (error) {
      setFollowUp({
        question:
          evaluation.followUpQuestion ||
          "How would you go deeper on the part you found hardest?",
        why: "AI follow-up was unavailable — here is the interviewer's suggested follow-up instead.",
        focus: evaluation.missingConcepts.slice(0, 3),
      });
      void error;
    } finally {
      setFollowUpLoading(false);
    }
  }, [current, evaluation, answer]);

  const runExplanation = useCallback(
    async (mode: ExplanationMode) => {
      if (!current) return;
      setExplanations((previous) => ({
        ...(previous ?? ({} as Record<ExplanationMode, ExplanationState | "loading">)),
        [mode]: "loading",
      }));
      setExplanationErrors((previous) => ({ ...previous, [mode]: undefined }));
      try {
        const result = await requestExplanation({
          mode,
          topic: TOPIC_NAMES[isTopicId(current.topic) ? current.topic : "javascript"],
          question: current.question,
          idealAnswer: current.idealAnswer,
        });
        setExplanations((previous) => ({
          ...(previous ?? {}),
          [mode]: { mode, title: result.title, content: result.content, code: result.code, keyPoints: result.keyPoints },
        }));
      } catch (error) {
        setExplanationErrors((previous) => ({
          ...previous,
          [mode]:
            error instanceof AiClientError
              ? error.message
              : "The AI explanation is temporarily unavailable. Try again in a moment.",
        }));
      }
    },
    [current],
  );

  if (screen === "config") {
    return (
      <div className="flex flex-col gap-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Practice</h1>
          <p className="mt-1 text-sm text-muted">
            Configure a focused session. AI-generated questions adapt to what you have already
            seen.
          </p>
        </header>

        {generateError ? <ErrorNote message={generateError} /> : null}
        {generating ? <LoadingState label="Writing your first question…" /> : null}

        <PracticeConfig config={config} onChange={setConfig} onStart={startSession} starting={generating} />
      </div>
    );
  }

  if (!current) {
    return <LoadingState label="Loading question…" />;
  }

  const progress = `Question ${index + 1} / ${config.count}`;

  return (
    <div className="flex flex-col gap-6">
      <QuestionCard
        topic={current.topic}
        category={current.category}
        difficulty={current.difficulty}
        question={current.question}
        progress={progress}
        actions={
          current.source === "ai" ? (
            <span className="mt-4 inline-flex items-center gap-1.5 text-xs text-faint">
              <span aria-hidden>✨</span> AI-generated question
            </span>
          ) : undefined
        }
      />

      {!revealed ? (
        <section className="rounded-lg border border-border bg-surface p-5">
          <AnswerEditor value={answer} onChange={setAnswer} onSubmit={reveal} />
        </section>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Your answer */}
          <section className="animate-fade rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Your Answer
            </h3>
            {answer.trim() ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{answer}</p>
            ) : (
              <p className="text-sm italic text-faint">
                You answered without writing anything down. Even a rough written answer gives the AI
                feedback something to work with.
              </p>
            )}
          </section>

          {/* Ideal answer */}
          <section className="animate-fade rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Ideal Answer
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
              {current.idealAnswer}
            </p>
            {current.code ? (
              <div className="mt-4">
                <CodeBlock code={current.code} />
              </div>
            ) : null}
          </section>

          {/* Deep explanation (static from question data) */}
          <section className="animate-fade rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Deep Explanation
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
              {current.explanation}
            </p>
            {current.interviewTip ? (
              <p className="mt-4 rounded-md border border-accent/25 bg-accent-soft/40 p-3 text-sm text-fg">
                <span aria-hidden className="mr-1.5">💡</span>
                <span className="font-medium">Interview tip:</span> {current.interviewTip}
              </p>
            ) : null}
          </section>

          {/* Confidence */}
          {!confidenceRecorded ? (
            <section className="rounded-lg border border-border bg-surface p-5">
              <ConfidenceSelector onSelect={(confidence) => advance(confidence)} />
            </section>
          ) : null}

          {/* AI feedback */}
          {current.source === "ai" || answer.trim() ? (
            evaluation ? (
              <FeedbackCard
                evaluation={evaluation}
                followUp={followUp}
                followUpLoading={followUpLoading}
                onFollowUp={followUp ? undefined : runFollowUp}
              />
            ) : (
              <section className="rounded-lg border border-border bg-surface p-5">
                {evaluateError ? (
                  <div className="flex flex-col gap-3">
                    <ErrorNote message={evaluateError} retry={runEvaluation} />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={runEvaluation}
                  disabled={evaluating || !answer.trim()}
                  className={buttonStyles.secondary}
                >
                  {evaluating ? "Evaluating…" : "Get AI Feedback"}
                </button>
                {!answer.trim() ? (
                  <p className="mt-2 text-xs text-faint">
                    Write an answer first so the feedback has something to evaluate.
                  </p>
                ) : null}
              </section>
            )
          ) : null}

          {/* AI explanations */}
          <section className="rounded-lg border border-border bg-surface p-5">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
              Learn More
            </h3>
            <div className="flex flex-wrap gap-2">
              {EXPLANATION_ACTIONS.map((action) => (
                <button
                  key={action.mode}
                  type="button"
                  title={action.hint}
                  onClick={() => runExplanation(action.mode)}
                  className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-fg"
                >
                  {action.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {(Object.entries(explanations) as [ExplanationMode, ExplanationState | "loading"][]).map(
                  ([mode, state]) =>
                    state === "loading" ? (
                      <AiResponse key={mode} title={labelFor(mode)} loading />
                    ) : (
                      <AiResponse
                        key={mode}
                        title={state.title || labelFor(mode)}
                        content={state.content}
                        code={state.code}
                        keyPoints={state.keyPoints}
                        error={explanationErrors[mode] ?? null}
                        onRetry={() => runExplanation(mode)}
                      />
                    ),
                )}
            </div>
          </section>

          {/* Move on */}
          {confidenceRecorded ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => advance("strong")}
                className={buttonStyles.secondary}
              >
                {index + 1 >= config.count ? "Finish session" : "Continue"} →
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function labelFor(mode: ExplanationMode): string {
  const action = EXPLANATION_ACTIONS.find((entry) => entry.mode === mode);
  return action?.label ?? "Explanation";
}

export default function PracticePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading practice…" />}>
      <PracticeInner />
    </Suspense>
  );
}
