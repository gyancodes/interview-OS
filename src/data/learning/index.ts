import type { Difficulty, LearningMaterial, TopicId } from "@/lib/types";

import { javascriptEventsMaterial } from "./javascript-events";

export interface CuratedMaterial {
  topic: TopicId;
  level: Difficulty;
  material: LearningMaterial;
}

/**
 * Registry of curated, in-repo learning materials. Each entry is authored and
 * reviewed here (sourced from deep-dive conversations/study sessions) and
 * served by GET /api/materials — never imported into client components.
 */
const CURATED_MATERIALS: CuratedMaterial[] = [
  { topic: "javascript", level: "beginner", material: javascriptEventsMaterial },
];

export function getCuratedMaterial(
  topic: TopicId,
  level: Difficulty,
): CuratedMaterial | undefined {
  return CURATED_MATERIALS.find((entry) => entry.topic === topic && entry.level === level);
}

export function listCuratedMaterials(): { topic: TopicId; level: Difficulty }[] {
  return CURATED_MATERIALS.map(({ topic, level }) => ({ topic, level }));
}