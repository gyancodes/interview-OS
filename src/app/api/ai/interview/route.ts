import { NextResponse } from "next/server";

import { errorResponse, readJsonBody, requireString } from "@/lib/api-helpers";
import { GroqApiError, groqJson } from "@/lib/groq";
import { interviewSummaryPrompt, interviewTurnPrompt, sanitizeTranscript } from "@/lib/prompts";

import type { InterviewSummary, InterviewTurnResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const mode = body.mode === "summary" ? "summary" : "turn";

    if (mode === "turn") {
      const role = requireString(body.role, "role");
      const level = requireString(body.level, "level");
      const durationMinutes = Number(body.durationMinutes) || 30;
      const elapsedMinutes = Number(body.elapsedMinutes) || 0;
      const questionCount = Number(body.questionCount) || 0;
      const transcript = sanitizeTranscript(requireString(body.transcript, "transcript"));

      const prompt = interviewTurnPrompt({ role, level, durationMinutes, elapsedMinutes, questionCount, transcript });
      const raw = await groqJson<InterviewTurnResponse>({ ...prompt, temperature: 0.7 });

      const turn: InterviewTurnResponse = {
        message: String(raw.message ?? "").trim(),
        topic: String(raw.topic ?? "General").trim(),
        difficulty: (["easy", "medium", "hard"] as const).includes(raw.difficulty) ? raw.difficulty : "medium",
        focus: String(raw.focus ?? "").trim(),
        shouldWrapUp: raw.shouldWrapUp === true,
      };

      if (!turn.message) {
        throw new GroqApiError("invalid_response", "The interviewer response was empty. Please try again.", 502);
      }
      return NextResponse.json(turn);
    }

    // Summary mode
    const role = requireString(body.role, "role");
    const level = requireString(body.level, "level");
    const transcript = sanitizeTranscript(requireString(body.transcript, "transcript"));

    const prompt = interviewSummaryPrompt({ role, level, transcript });
    const raw = await groqJson<InterviewSummary>({ ...prompt, temperature: 0.4 });

    const summary: InterviewSummary = {
      topicsCovered: toStringArray(raw.topicsCovered),
      strengths: toStringArray(raw.strengths),
      needsPractice: toStringArray(raw.needsPractice),
      verdict: String(raw.verdict ?? "").trim(),
      suggestedPractice: toStringArray(raw.suggestedPractice),
    };

    if (!summary.verdict) {
      throw new GroqApiError("invalid_response", "The interview summary came back empty. Please try again.", 502);
    }
    return NextResponse.json(summary);
  } catch (error) {
    return errorResponse(error);
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 10);
}
