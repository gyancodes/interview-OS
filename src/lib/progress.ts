/**
 * Pure calculations over Attempt history: topic progress, weak areas,
 * overall readiness. No storage access — callers pass attempts in, which keeps
 * this unit-testable and reusable when persistence moves to PostgreSQL.
 */

import { TOPICS } from "@/data/topics";

import type { Attempt, TopicId, TopicProgress, WeakArea } from "@/lib/types";
import { confidenceScore } from "@/lib/utils";

/**
 * Total question count per topic shown in the dashboard. AI-generated questions
 * are unbounded, so we present progress against the curated bank size.
 */
export function bankSizeByTopic(): Record<TopicId, number> {
  return TOPICS.reduce(
    (acc, topic) => {
      acc[topic.id] = 0;
      return acc;
    },
    {} as Record<TopicId, number>,
  );
}

export function computeTopicProgress(attempts: Attempt[], bankSizes: Record<TopicId, number>): TopicProgress[] {
  const byTopic = new Map<TopicId, Attempt[]>();
  for (const attempt of attempts) {
    const list = byTopic.get(attempt.topic) ?? [];
    list.push(attempt);
    byTopic.set(attempt.topic, list);
  }

  return TOPICS.map((topic) => {
    const topicAttempts = byTopic.get(topic.id) ?? [];
    // Progress counts distinct questions attempted, not raw attempts.
    const distinctQuestions = new Set(topicAttempts.map((attempt) => attempt.questionId)).size;
    const total = bankSizes[topic.id] ?? 0;
    const strong = topicAttempts.filter((attempt) => attempt.confidence === "strong").length;
    const partial = topicAttempts.filter((attempt) => attempt.confidence === "partial").length;
    const weak = topicAttempts.filter((attempt) => attempt.confidence === "weak").length;
    return {
      topic: topic.id,
      attempted: distinctQuestions,
      total,
      percent: total > 0 ? Math.min(100, Math.round((distinctQuestions / total) * 100)) : 0,
      strong,
      partial,
      weak,
    };
  });
}

/**
 * Groups attempts by topic+category and scores each group. Groups are "weak"
 * when the average confidence is low and there are repeated weak/partial
 * answers — a single bad day should not flag a concept.
 */
export function computeWeakAreas(attempts: Attempt[], limit = 6): WeakArea[] {
  const groups = new Map<string, Attempt[]>();
  for (const attempt of attempts) {
    const key = `${attempt.topic}::${attempt.category}`;
    const list = groups.get(key) ?? [];
    list.push(attempt);
    groups.set(key, list);
  }

  const areas: WeakArea[] = [];
  for (const [key, groupAttempts] of groups) {
    const [topic, category] = key.split("::") as [TopicId, string];
    const weak = groupAttempts.filter((attempt) => attempt.confidence === "weak").length;
    const partial = groupAttempts.filter((attempt) => attempt.confidence === "partial").length;
    const strong = groupAttempts.filter((attempt) => attempt.confidence === "strong").length;
    const score = confidenceScore(groupAttempts.map((attempt) => attempt.confidence));

    // Repeated struggle: at least 2 non-strong attempts, or all attempts weak.
    const struggling = weak + partial;
    if (struggling >= 2 || (groupAttempts.length >= 1 && weak === groupAttempts.length)) {
      areas.push({ topic, category, attempts: groupAttempts.length, weak, partial, strong, score });
    }
  }

  areas.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return b.attempts - a.attempts;
  });

  return areas.slice(0, limit);
}

/** Overall readiness across all attempts: weighted share of strong answers. */
export function computeOverallReadiness(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;
  return Math.round(confidenceScore(attempts.map((attempt) => attempt.confidence)) * 100);
}
