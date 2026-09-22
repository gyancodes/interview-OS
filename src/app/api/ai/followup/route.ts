import { NextResponse } from "next/server";

import { errorResponse, readJsonBody, requireString } from "@/lib/api-helpers";
import { GroqApiError, groqJson } from "@/lib/groq";
import { followUpPrompt } from "@/lib/prompts";

import type { FollowUpQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const input = {
      topic: requireString(body.topic, "topic"),
      question: requireString(body.question, "question"),
      candidateAnswer: requireString(body.candidateAnswer, "candidateAnswer"),
    };
    const missingConcepts = Array.isArray(body.missingConcepts)
      ? body.missingConcepts.filter((item): item is string => typeof item === "string").slice(0, 8)
      : [];

    const prompt = followUpPrompt({ ...input, missingConcepts });
    const raw = await groqJson<FollowUpQuestion>(prompt);

    const followUp: FollowUpQuestion = {
      question: String(raw.question ?? "").trim(),
      why: String(raw.why ?? "").trim(),
      focus: Array.isArray(raw.focus)
        ? raw.focus.filter((item): item is string => typeof item === "string").slice(0, 5)
        : [],
    };

    if (!followUp.question) {
      throw new GroqApiError(
        "invalid_response",
        "The AI did not return a follow-up question. Please try again.",
        502,
      );
    }

    return NextResponse.json(followUp);
  } catch (error) {
    return errorResponse(error);
  }
}
