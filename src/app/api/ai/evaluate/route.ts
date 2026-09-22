import { NextResponse } from "next/server";

import { errorResponse, readJsonBody, requireString } from "@/lib/api-helpers";
import { GroqApiError, groqJson } from "@/lib/groq";
import { evaluationPrompt } from "@/lib/prompts";

import type { Evaluation } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = {
      topic: requireString(body.topic, "topic"),
      question: requireString(body.question, "question"),
      idealAnswer: requireString(body.idealAnswer, "idealAnswer"),
      candidateAnswer: requireString(body.candidateAnswer, "candidateAnswer"),
    };

    const prompt = evaluationPrompt(input);
    const raw = await groqJson<Evaluation>(prompt);

    const evaluation: Evaluation = {
      summary: String(raw.summary ?? "").trim(),
      strengths: toStringArray(raw.strengths),
      missingConcepts: toStringArray(raw.missingConcepts),
      corrections: toStringArray(raw.corrections),
      score: clampScore(Number(raw.score)),
      interviewAnswer: String(raw.interviewAnswer ?? "").trim(),
      followUpQuestion: String(raw.followUpQuestion ?? "").trim(),
    };

    if (!evaluation.summary) {
      throw new GroqApiError(
        "invalid_response",
        "The AI feedback was incomplete. Please try again.",
        502,
      );
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    return errorResponse(error);
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 8);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}
