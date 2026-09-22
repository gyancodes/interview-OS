/**
 * Shared domain types for InterviewOS.
 *
 * These types are intentionally framework-free so the same shapes can back a
 * PostgreSQL/Prisma layer later without rewriting the application layer.
 */

export const TOPIC_IDS = [
  "javascript",
  "typescript",
  "nodejs",
  "express",
  "backend",
  "react",
  "nextjs",
  "fullstack",
  "devops",
  "system-design",
] as const;

export type TopicId = (typeof TOPIC_IDS)[number];

export type Difficulty = "easy" | "medium" | "hard";
export type DifficultyFilter = Difficulty | "mixed";
export type Confidence = "weak" | "partial" | "strong";
export type QuestionSource = "bank" | "ai";
export type PracticeCount = 5 | 10 | 20;

/** A question from the local, curated question bank. */
export interface Question {
  id: string;
  topic: TopicId;
  category: string;
  difficulty: Difficulty;
  question: string;
  /** Concise, interview-ready answer. */
  idealAnswer: string;
  /** Deeper explanation: internals, tradeoffs, misconceptions. */
  explanation: string;
  code?: string;
  tags: string[];
  followUps?: string[];
  interviewTip?: string;
  concepts?: string[];
}

/** A question inside an active practice session (bank or AI generated). */
export interface PracticeQuestion extends Question {
  source: QuestionSource;
}

/** Shape returned by POST /api/ai/question. */
export interface GeneratedQuestion {
  question: string;
  difficulty: Difficulty;
  topic: string;
  category: string;
  concepts: string[];
  idealAnswer: string;
  explanation: string;
  code?: string;
  followUps: string[];
  interviewTip: string;
}

/** One answered question, persisted in LocalStorage. */
export interface Attempt {
  questionId: string;
  topic: TopicId;
  category: string;
  difficulty: Difficulty;
  confidence: Confidence;
  userAnswer: string;
  timestamp: string;
  source: QuestionSource;
}

export interface SavedQuestion {
  id: string;
  topic: TopicId;
  category: string;
  difficulty: Difficulty;
  question: string;
  savedAt: string;
}

export interface RecentQuestion {
  id: string;
  topic: TopicId;
  category: string;
  difficulty: Difficulty;
  question: string;
  viewedAt: string;
}

/** Shape returned by POST /api/ai/evaluate. */
export interface Evaluation {
  summary: string;
  strengths: string[];
  missingConcepts: string[];
  corrections: string[];
  score: number;
  interviewAnswer: string;
  followUpQuestion: string;
}

/** Shape returned by POST /api/ai/followup. */
export interface FollowUpQuestion {
  question: string;
  why: string;
  focus: string[];
}

export type ExplanationMode = "simply" | "deeper" | "code" | "example" | "interview";

/** Shape returned by POST /api/ai/explain. */
export interface Explanation {
  title: string;
  content: string;
  code?: string;
  keyPoints: string[];
}

/* -------------------------------------------------------------------------- */
/* Practice session configuration                                             */
/* -------------------------------------------------------------------------- */

export interface PracticeConfig {
  topic: TopicId;
  difficulty: DifficultyFilter;
  source: QuestionSource;
  count: PracticeCount;
  category?: string;
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                   */
/* -------------------------------------------------------------------------- */

export interface TopicProgress {
  topic: TopicId;
  attempted: number;
  total: number;
  percent: number;
  strong: number;
  partial: number;
  weak: number;
}

export interface WeakArea {
  topic: TopicId;
  category: string;
  attempts: number;
  weak: number;
  partial: number;
  strong: number;
  /** 0 = consistently struggling, 1 = consistently strong. */
  score: number;
}

/* -------------------------------------------------------------------------- */
/* Mock interview                                                             */
/* -------------------------------------------------------------------------- */

export const INTERVIEW_ROLES = ["frontend", "backend", "fullstack", "nodejs", "devops"] as const;
export type InterviewRole = (typeof INTERVIEW_ROLES)[number];

export type InterviewLevel = "junior" | "mid";
export type InterviewDuration = 15 | 30 | 45;

export interface InterviewTurn {
  role: "interviewer" | "candidate";
  content: string;
  at: string;
  topic?: string;
}

/** Shape returned by POST /api/ai/interview with mode "turn". */
export interface InterviewTurnResponse {
  message: string;
  topic: string;
  difficulty: Difficulty;
  focus: string;
  shouldWrapUp: boolean;
}

/** Shape returned by POST /api/ai/interview with mode "summary". */
export interface InterviewSummary {
  topicsCovered: string[];
  strengths: string[];
  needsPractice: string[];
  verdict: string;
  suggestedPractice: string[];
}

export interface MockInterviewRecord {
  id: string;
  role: InterviewRole;
  level: InterviewLevel;
  durationMinutes: InterviewDuration;
  startedAt: string;
  endedAt: string;
  questionCount: number;
  topicsCovered: string[];
  strengths: string[];
  needsPractice: string[];
  verdict: string;
}

/* -------------------------------------------------------------------------- */
/* API envelope                                                               */
/* -------------------------------------------------------------------------- */

export type ApiErrorCode =
  | "missing_api_key"
  | "invalid_request"
  | "rate_limit"
  | "auth_error"
  | "timeout"
  | "network_error"
  | "invalid_response"
  | "api_error";

export interface ApiErrorPayload {
  code: ApiErrorCode;
  message: string;
}
