import { backendQuestions } from "@/data/questions/backend";
import { devopsQuestions } from "@/data/questions/devops";
import { expressQuestions } from "@/data/questions/express";
import { fullstackQuestions } from "@/data/questions/fullstack";
import { javascriptQuestions } from "@/data/questions/javascript";
import { nextjsQuestions } from "@/data/questions/nextjs";
import { nodejsQuestions } from "@/data/questions/nodejs";
import { reactQuestions } from "@/data/questions/react";
import { systemDesignQuestions } from "@/data/questions/system-design";
import { typescriptQuestions } from "@/data/questions/typescript";

import { TOPIC_MAP } from "@/data/topics";

import type { DifficultyFilter, Question, TopicId } from "@/lib/types";
import { difficultyOrder, shuffle } from "@/lib/utils";

/** The complete curated question bank. */
export const ALL_QUESTIONS: Question[] = [
  ...javascriptQuestions,
  ...typescriptQuestions,
  ...nodejsQuestions,
  ...expressQuestions,
  ...backendQuestions,
  ...reactQuestions,
  ...nextjsQuestions,
  ...fullstackQuestions,
  ...devopsQuestions,
  ...systemDesignQuestions,
];

export const QUESTION_INDEX: Record<string, Question> = ALL_QUESTIONS.reduce(
  (acc, question) => {
    acc[question.id] = question;
    return acc;
  },
  {} as Record<string, Question>,
);

export function getQuestionById(id: string): Question | undefined {
  return QUESTION_INDEX[id];
}

/** Curated question counts per topic (drives dashboard progress bars). */
export const BANK_SIZES: Record<TopicId, number> = Object.keys(TOPIC_MAP).reduce(
  (acc, topicId) => {
    acc[topicId as TopicId] = ALL_QUESTIONS.filter((question) => question.topic === topicId).length;
    return acc;
  },
  {} as Record<TopicId, number>,
);

export interface QuestionSelectionFilters {
  topic: TopicId;
  difficulty: DifficultyFilter;
  category?: string;
  excludeIds?: string[];
}

export function filterQuestions(filters: QuestionSelectionFilters): Question[] {
  return ALL_QUESTIONS.filter((question) => {
    if (question.topic !== filters.topic) return false;
    if (filters.category && question.category !== filters.category) return false;
    if (filters.difficulty !== "mixed" && question.difficulty !== filters.difficulty) return false;
    if (filters.excludeIds?.includes(question.id)) return false;
    return true;
  });
}

/**
 * Builds a practice session from the bank. Orders by difficulty progression
 * (easy -> hard) so the session warms up like a real interview, shuffling
 * within each difficulty band.
 */
export function buildBankSession(
  filters: QuestionSelectionFilters,
  count: number,
): Question[] {
  const pool = filterQuestions(filters);
  const selected: Question[] = [];

  const byDifficulty: Record<string, Question[]> = {
    easy: shuffle(pool.filter((question) => question.difficulty === "easy")),
    medium: shuffle(pool.filter((question) => question.difficulty === "medium")),
    hard: shuffle(pool.filter((question) => question.difficulty === "hard")),
  };

  // Round-robin across bands keeps the progression easy -> medium -> hard.
  const bands = ["easy", "medium", "hard"] as const;
  let bandIndex = 0;
  while (selected.length < count && bands.some((band) => byDifficulty[band].length > 0)) {
    const band = bands[bandIndex % bands.length];
    bandIndex += 1;
    const next = byDifficulty[band].shift();
    if (next) selected.push(next);
  }

  // If the topic is small, allow repeats from the remaining shuffled pool.
  if (selected.length < count) {
    const remaining = shuffle(pool).filter((question) => !selected.includes(question));
    selected.push(...remaining.slice(0, count - selected.length));
  }

  return selected;
}
