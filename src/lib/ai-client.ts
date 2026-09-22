/**
 * Browser-side client for the AI Route Handlers. Wraps fetch with typed error
 * handling so components never parse raw error payloads themselves.
 */

import type { ApiErrorPayload, Difficulty } from "@/lib/types";

export class AiClientError extends Error {
  readonly code: ApiErrorPayload["code"];
  readonly status: number;

  constructor(code: ApiErrorPayload["code"], message: string, status: number) {
    super(message);
    this.name = "AiClientError";
    this.code = code;
    this.status = status;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AiClientError("network_error", "Network error — could not reach the server. Check your connection and try again.", 0);
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body (proxy error page etc.)
  }

  if (!response.ok) {
    const error = (payload as Partial<ApiErrorPayload> | null) ?? {};
    throw new AiClientError(
      error.code ?? "api_error",
      error.message ?? `Request failed (HTTP ${response.status}).`,
      response.status,
    );
  }

  if (!payload || typeof payload !== "object") {
    throw new AiClientError("invalid_response", "The server returned an unexpected response.", response.status);
  }
  return payload as T;
}

export interface GeneratedQuestionResponse {
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

export function requestGeneratedQuestion(input: {
  topic: string;
  difficulty: string;
  category?: string;
  avoidQuestions?: string[];
}): Promise<GeneratedQuestionResponse> {
  return postJson("/api/ai/question", input);
}

export interface EvaluationResponse {
  summary: string;
  strengths: string[];
  missingConcepts: string[];
  corrections: string[];
  score: number;
  interviewAnswer: string;
  followUpQuestion: string;
}

export function requestEvaluation(input: {
  topic: string;
  question: string;
  idealAnswer: string;
  candidateAnswer: string;
}): Promise<EvaluationResponse> {
  return postJson("/api/ai/evaluate", input);
}

export interface FollowUpResponse {
  question: string;
  why: string;
  focus: string[];
}

export function requestFollowUp(input: {
  topic: string;
  question: string;
  candidateAnswer: string;
  missingConcepts?: string[];
}): Promise<FollowUpResponse> {
  return postJson("/api/ai/followup", input);
}

export interface ExplanationResponse {
  title: string;
  content: string;
  code?: string;
  keyPoints: string[];
}

export function requestExplanation(input: {
  mode: "simply" | "deeper" | "code" | "example" | "interview";
  topic: string;
  question: string;
  idealAnswer: string;
}): Promise<ExplanationResponse> {
  return postJson("/api/ai/explain", input);
}

export interface LearningMaterialResponse {
  title: string;
  overview: string;
  prerequisites: string[];
  sections: { title: string; content: string; code?: string; keyPoints: string[] }[];
  commonMistakes: { mistake: string; fix: string }[];
  interviewFocus: string[];
  studyChecklist: string[];
}

export function requestLearningMaterial(input: {
  topic: string;
  level: string;
}): Promise<LearningMaterialResponse> {
  return postJson("/api/ai/learn", input);
}

export interface CuratedMaterialResponse {
  topic: string;
  level: string;
  material: LearningMaterialResponse;
}

/**
 * Fetches curated (server-authored) learning material. Returns null when none
 * exists (404) or the request fails, so callers can fall back to AI generation.
 */
export async function fetchCuratedMaterial(
  topic: string,
  level: string,
): Promise<CuratedMaterialResponse | null> {
  try {
    const response = await fetch(
      `/api/materials?topic=${encodeURIComponent(topic)}&level=${encodeURIComponent(level)}`,
    );
    if (!response.ok) return null;
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object") return null;
    return payload as CuratedMaterialResponse;
  } catch {
    return null;
  }
}

export interface InterviewTurnResponse {
  message: string;
  topic: string;
  difficulty: Difficulty;
  focus: string;
  shouldWrapUp: boolean;
}

export function requestInterviewTurn(input: {
  role: string;
  level: string;
  durationMinutes: number;
  elapsedMinutes: number;
  questionCount: number;
  transcript: string;
}): Promise<InterviewTurnResponse> {
  return postJson("/api/ai/interview", { ...input, mode: "turn" });
}

export interface InterviewSummaryResponse {
  topicsCovered: string[];
  strengths: string[];
  needsPractice: string[];
  verdict: string;
  suggestedPractice: string[];
}

export function requestInterviewSummary(input: {
  role: string;
  level: string;
  transcript: string;
}): Promise<InterviewSummaryResponse> {
  return postJson("/api/ai/interview", { ...input, mode: "summary" });
}
