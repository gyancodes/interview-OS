/**
 * Centralized LocalStorage access for InterviewOS.
 *
 * Nothing else in the app should touch `window.localStorage` directly — this
 * module guards SSR (returns safe defaults), tolerates private-mode failures,
 * and keeps every persisted shape in one place so the storage layer can be
 * swapped for PostgreSQL later without touching the UI.
 */

import type {
  Attempt,
  CachedLearningMaterial,
  Difficulty,
  LearningMaterial,
  MockInterviewRecord,
  Question,
  RecentQuestion,
  SavedQuestion,
  TopicId,
} from "@/lib/types";

const KEYS = {
  attempts: "interviewos.attempts",
  recentQuestions: "interviewos.recentQuestions",
  favoriteQuestions: "interviewos.favoriteQuestions",
  savedQuestions: "interviewos.savedQuestions",
  mockInterviewHistory: "interviewos.mockInterviewHistory",
} as const;

const MAX_ATTEMPTS = 2000;
const MAX_RECENT = 50;
const MAX_FAVORITES = 200;
const MAX_MOCKS = 50;

/* -------------------------------------------------------------------------- */
/* Per-user scoping                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Signed-in users get their own LocalStorage namespace so two accounts sharing
 * a browser never see each other's attempts.
 *
 * The scope is set by `AuthProvider` during render — before any child effect
 * reads storage — which keeps reads and writes consistent within a page load.
 */
let storageScope: string | null = null;

const LEARNING_CACHE_KEY = "interviewos.learningMaterials";
const MAX_LEARNING_CACHE = 60;

/** Every key that is namespaced per user. */
const SCOPED_KEYS: string[] = [...Object.values(KEYS), LEARNING_CACHE_KEY];

function scopedKey(key: string): string {
  return storageScope ? `${key}::u::${storageScope}` : key;
}

/**
 * Points storage at a user's namespace (or back at the anonymous namespace).
 * Called during `AuthProvider` render and after sign out.
 */
export function setStorageScope(userId: string | null): void {
  const next = userId && userId.trim().length > 0 ? userId.trim() : null;
  if (next === storageScope) return;
  storageScope = next;
  if (next) adoptAnonymousData(next);
}

/**
 * One-time move of pre-auth data into the first account that signs in on this
 * browser. The anonymous copy is removed so it cannot leak into a second
 * account later on the same device.
 */
function adoptAnonymousData(userId: string): void {
  if (!isBrowser()) return;
  for (const key of SCOPED_KEYS) {
    const target = `${key}::u::${userId}`;
    try {
      if (window.localStorage.getItem(target) !== null) continue;
      const anonymousValue = window.localStorage.getItem(key);
      if (anonymousValue === null) continue;
      window.localStorage.setItem(target, anonymousValue);
      window.localStorage.removeItem(key);
    } catch {
      // Storage full or unavailable: skip the migration, keep the app working.
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Low-level helpers                                                           */
/* -------------------------------------------------------------------------- */

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(scopedKey(key));
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupted or inaccessible storage: degrade to defaults, never crash UI.
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(scopedKey(key), JSON.stringify(value));
  } catch {
    // Quota exceeded or private mode: persistence is best-effort in the MVP.
  }
}

/* -------------------------------------------------------------------------- */
/* Attempts                                                                    */
/* -------------------------------------------------------------------------- */

export function getAttempts(): Attempt[] {
  return readJson<Attempt[]>(KEYS.attempts, []);
}

export function addAttempt(attempt: Attempt): void {
  const attempts = getAttempts();
  attempts.push(attempt);
  writeJson(KEYS.attempts, attempts.slice(-MAX_ATTEMPTS));
}

/** Replaces the confidence recorded for a question's latest attempt. */
export function updateLatestAttemptConfidence(questionId: string, confidence: Attempt["confidence"]): void {
  const attempts = getAttempts();
  for (let i = attempts.length - 1; i >= 0; i -= 1) {
    const attempt = attempts[i];
    if (attempt && attempt.questionId === questionId) {
      attempt.confidence = confidence;
      break;
    }
  }
  writeJson(KEYS.attempts, attempts);
}

export function clearAttempts(): void {
  writeJson(KEYS.attempts, []);
}

/* -------------------------------------------------------------------------- */
/* Recent questions                                                            */
/* -------------------------------------------------------------------------- */

export function getRecentQuestions(): RecentQuestion[] {
  return readJson<RecentQuestion[]>(KEYS.recentQuestions, []);
}

export function recordRecentQuestion(question: Question): void {
  const recents = getRecentQuestions().filter((item) => item.id !== question.id);
  recents.unshift({
    id: question.id,
    topic: question.topic,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    viewedAt: new Date().toISOString(),
  });
  writeJson(KEYS.recentQuestions, recents.slice(0, MAX_RECENT));
}

export function clearRecentQuestions(): void {
  writeJson(KEYS.recentQuestions, []);
}

/* -------------------------------------------------------------------------- */
/* Favorite / saved questions                                                  */
/* -------------------------------------------------------------------------- */

export function getFavoriteQuestionIds(): string[] {
  return readJson<string[]>(KEYS.favoriteQuestions, []);
}

export function isFavoriteQuestion(questionId: string): boolean {
  return getFavoriteQuestionIds().includes(questionId);
}

export function toggleFavoriteQuestion(questionId: string): boolean {
  const favorites = getFavoriteQuestionIds();
  const index = favorites.indexOf(questionId);
  if (index >= 0) {
    favorites.splice(index, 1);
  } else {
    favorites.unshift(questionId);
  }
  writeJson(KEYS.favoriteQuestions, favorites.slice(0, MAX_FAVORITES));
  return index < 0;
}

export function getSavedQuestions(): SavedQuestion[] {
  return readJson<SavedQuestion[]>(KEYS.savedQuestions, []);
}

export function saveQuestion(question: Question): void {
  const saved = getSavedQuestions().filter((item) => item.id !== question.id);
  saved.unshift({
    id: question.id,
    topic: question.topic,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    savedAt: new Date().toISOString(),
  });
  writeJson(KEYS.savedQuestions, saved.slice(0, MAX_FAVORITES));
}

/* -------------------------------------------------------------------------- */
/* Mock interview history                                                      */
/* -------------------------------------------------------------------------- */

export function getMockInterviewHistory(): MockInterviewRecord[] {
  return readJson<MockInterviewRecord[]>(KEYS.mockInterviewHistory, []);
}

export function addMockInterviewRecord(record: MockInterviewRecord): void {
  const history = getMockInterviewHistory();
  history.unshift(record);
  writeJson(KEYS.mockInterviewHistory, history.slice(0, MAX_MOCKS));
}

export function clearMockInterviewHistory(): void {
  writeJson(KEYS.mockInterviewHistory, []);
}

/* -------------------------------------------------------------------------- */
/* Learning material cache                                                     */
/* -------------------------------------------------------------------------- */

export function getLearningMaterial(
  topic: TopicId,
  level: Difficulty,
): CachedLearningMaterial | undefined {
  return readJson<Record<string, CachedLearningMaterial>>(LEARNING_CACHE_KEY, {})[
    `${topic}::${level}`
  ];
}

export function saveLearningMaterial(
  topic: TopicId,
  level: Difficulty,
  material: LearningMaterial,
  source: CachedLearningMaterial["source"] = "ai",
): void {
  const cache = readJson<Record<string, CachedLearningMaterial>>(LEARNING_CACHE_KEY, {});
  cache[`${topic}::${level}`] = {
    topic,
    level,
    material,
    source,
    generatedAt: new Date().toISOString(),
  };
  // Keep the cache bounded: drop the oldest entries beyond the cap.
  const entries = Object.entries(cache).sort(
    (a, b) =>
      new Date(b[1].generatedAt).getTime() - new Date(a[1].generatedAt).getTime(),
  );
  writeJson(LEARNING_CACHE_KEY, Object.fromEntries(entries.slice(0, MAX_LEARNING_CACHE)));
}

/* -------------------------------------------------------------------------- */
/* Attempt summary helpers (used by dashboard widgets)                         */
/* -------------------------------------------------------------------------- */

export interface AttemptSummary {
  total: number;
  lastAttempt?: Attempt;
  topicsPracticed: Set<TopicId>;
}

export function summarizeAttempts(attempts: Attempt[]): AttemptSummary {
  const summary: AttemptSummary = { total: attempts.length, topicsPracticed: new Set() };
  let newest = -Infinity;
  for (const attempt of attempts) {
    summary.topicsPracticed.add(attempt.topic);
    const time = new Date(attempt.timestamp).getTime();
    if (!Number.isNaN(time) && time > newest) {
      newest = time;
      summary.lastAttempt = attempt;
    }
  }
  return summary;
}

/* -------------------------------------------------------------------------- */
/* Account-level resets (used by the profile page)                             */
/* -------------------------------------------------------------------------- */

/** Fields surfaced by the profile page's local-data panel. */
export interface LocalDataSummary {
  attempts: number;
  recentQuestions: number;
  savedQuestions: number;
  mockInterviews: number;
  learningMaterials: number;
}

export function getLocalDataSummary(): LocalDataSummary {
  return {
    attempts: getAttempts().length,
    recentQuestions: getRecentQuestions().length,
    savedQuestions: getSavedQuestions().length,
    mockInterviews: getMockInterviewHistory().length,
    learningMaterials: Object.keys(
      readJson<Record<string, CachedLearningMaterial>>(LEARNING_CACHE_KEY, {}),
    ).length,
  };
}

/** Clears every persisted record for the active user scope. */
export function clearAllLocalData(): void {
  for (const key of SCOPED_KEYS) {
    writeJson(key, key === LEARNING_CACHE_KEY ? {} : []);
  }
}

