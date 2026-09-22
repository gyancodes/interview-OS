import { NextResponse } from "next/server";

import { errorResponse, readJsonBody, requireString } from "@/lib/api-helpers";
import { GroqApiError, groqJson } from "@/lib/groq";
import { learningMaterialPrompt } from "@/lib/prompts";
import { isTopicId } from "@/data/topics";

import { DIFFICULTIES } from "@/lib/types";

import type { LearningMaterial } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const topic = requireString(body.topic, "topic");
    if (!isTopicId(topic)) {
      throw new GroqApiError("invalid_request", `Unknown topic: ${topic}`, 400);
    }
    const level = requireString(body.level, "level");
    if (!(DIFFICULTIES as readonly string[]).includes(level)) {
      throw new GroqApiError("invalid_request", `Unknown level: ${level}`, 400);
    }

    const prompt = learningMaterialPrompt({ topicId: topic, level });
    const raw = await groqJson<Partial<LearningMaterial>>({ ...prompt, maxTokens: 4000 });

    const material: LearningMaterial = {
      title: String(raw.title ?? "").trim(),
      overview: String(raw.overview ?? "").trim(),
      prerequisites: toStringArray(raw.prerequisites),
      sections: (Array.isArray(raw.sections) ? raw.sections : [])
        .map((section) => ({
          title: String(section?.title ?? "").trim(),
          content: String(section?.content ?? "").trim(),
          code: optionalCode(section?.code),
          keyPoints: toStringArray(section?.keyPoints),
        }))
        .filter((section) => section.title && section.content)
        .slice(0, 8),
      commonMistakes: (Array.isArray(raw.commonMistakes) ? raw.commonMistakes : [])
        .map((entry) => ({
          mistake: String(entry?.mistake ?? "").trim(),
          fix: String(entry?.fix ?? "").trim(),
        }))
        .filter((entry) => entry.mistake)
        .slice(0, 8),
      interviewFocus: toStringArray(raw.interviewFocus),
      studyChecklist: toStringArray(raw.studyChecklist),
    };

    if (!material.title || material.sections.length === 0) {
      throw new GroqApiError(
        "invalid_response",
        "The AI returned incomplete learning material. Please try again.",
        502,
      );
    }

    return NextResponse.json(material);
  } catch (error) {
    return errorResponse(error);
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 10);
}

function optionalCode(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}