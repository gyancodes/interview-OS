import { NextResponse } from "next/server";

import { errorResponse, readJsonBody, requireString } from "@/lib/api-helpers";
import { GroqApiError, groqJson } from "@/lib/groq";
import { explanationPrompt } from "@/lib/prompts";

import type { ExplanationMode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODES: ExplanationMode[] = ["simply", "deeper", "code", "example", "interview"];

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const mode = requireString(body.mode, "mode");
    if (!MODES.includes(mode as ExplanationMode)) {
      throw new GroqApiError("invalid_request", `Unknown explanation mode: ${mode}`, 400);
    }

    const input = {
      mode: mode as ExplanationMode,
      topic: requireString(body.topic, "topic"),
      question: requireString(body.question, "question"),
      idealAnswer: requireString(body.idealAnswer, "idealAnswer"),
    };

    interface ExplanationPayload {
      title?: unknown;
      content?: unknown;
      code?: unknown;
      keyPoints?: unknown;
    }

    const prompt = explanationPrompt(input);
    const raw = await groqJson<ExplanationPayload>(prompt);

    const explanation = {
      title: String(raw.title ?? "").trim(),
      content: String(raw.content ?? "").trim(),
      code: typeof raw.code === "string" && raw.code.trim().length > 0 ? raw.code.trim() : undefined,
      keyPoints: Array.isArray(raw.keyPoints)
        ? raw.keyPoints.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 6)
        : [],
    };

    if (!explanation.content) {
      throw new GroqApiError("invalid_response", "The AI explanation came back empty. Please try again.", 502);
    }

    return NextResponse.json(explanation);
  } catch (error) {
    return errorResponse(error);
  }
}
