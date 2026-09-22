import { NextResponse } from "next/server";

import { getCuratedMaterial, listCuratedMaterials } from "@/data/learning";
import { TOPIC_MAP } from "@/data/topics";
import { DIFFICULTIES } from "@/lib/types";

import type { Difficulty, TopicId } from "@/lib/types";

export const runtime = "nodejs";

/**
 * Serves curated learning material. Data lives on the server; the client
 * fetches it instead of importing it into the bundle.
 *
 * GET /api/materials                 -> list of available curated materials
 * GET /api/materials?topic=&level=   -> one curated material (404 if none yet)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic");
  const level = searchParams.get("level");

  if (!topic || !level) {
    return NextResponse.json({ materials: listCuratedMaterials() });
  }

  if (!(topic in TOPIC_MAP) || !(DIFFICULTIES as readonly string[]).includes(level)) {
    return NextResponse.json(
      { code: "invalid_request", message: `Unknown topic or level: ${topic}, ${level}` },
      { status: 400 },
    );
  }

  const curated = getCuratedMaterial(topic as TopicId, level as Difficulty);
  if (!curated) {
    return NextResponse.json(
      { code: "not_found", message: "No curated material for this topic and level yet." },
      { status: 404 },
    );
  }

  return NextResponse.json(curated);
}