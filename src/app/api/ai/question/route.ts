import { NextResponse } from "next/server";

import { errorResponse, optionalString, readJsonBody, requireString } from "@/lib/api-helpers";
import { GroqApiError, groqJson } from "@/lib/groq";
import { questionGenerationPrompt } from "@/lib/prompts";
import { isTopicId } from "@/data/topics";

import { DIFFICULTIES } from "@/lib/types";

import type { Difficulty, GeneratedQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const topic = requireString(body.topic, "topic");
    if (!isTopicId(topic)) {
      throw new GroqApiError("invalid_request", `Unknown topic: ${topic}`, 400);
    }
    const difficulty = requireString(body.difficulty, "difficulty");
    const category = optionalString(body.category);
    const avoidQuestions = Array.isArray(body.avoidQuestions)
      ? body.avoidQuestions.filter((item): item is string => typeof item === "string").slice(-12)
      : [];

    const prompt = questionGenerationPrompt({ topicId: topic, difficulty, category, avoidQuestions });
    const generated = await groqJson<GeneratedQuestion>(prompt);

    // Defensive normalization — the model occasionally drops or mistypes fields.
    const question: GeneratedQuestion = {
      question: String(generated.question ?? "").trim(),
      difficulty: (DIFFICULTIES as readonly string[]).includes(generated.difficulty)
        ? generated.difficulty
        : difficulty === "mixed"
          ? "intermediate"
          : (difficulty as Difficulty),
      topic: String(generated.topic ?? topic),
      category: String(generated.category ?? category ?? "Fundamentals"),
      concepts: toArray(generated.concepts),
      idealAnswer: String(generated.idealAnswer ?? "").trim(),
      explanation: String(generated.explanation ?? "").trim(),
      code: optionalString(generated.code),
      followUps: toArray(generated.followUps),
      interviewTip: String(generated.interviewTip ?? "").trim(),
    };

    if (!question.question || !question.idealAnswer) {
      throw new GroqApiError(
        "invalid_response",
        "The AI returned an incomplete question. Please try again.",
        502,
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    return errorResponse(error);
  }
}

function toArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6);
}
