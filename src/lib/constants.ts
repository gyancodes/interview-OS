import type {
  Confidence,
  Difficulty,
  DifficultyFilter,
  ExplanationMode,
  InterviewDuration,
  InterviewLevel,
  InterviewRole,
  PracticeCount,
} from "@/lib/types";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const DIFFICULTY_FILTERS: { value: DifficultyFilter; label: string; hint?: string }[] = [
  { value: "mixed", label: "Mixed", hint: "AI picks a level per question for a varied session" },
  { value: "beginner", label: "Beginner", hint: "Core fundamentals and clear mental models" },
  { value: "intermediate", label: "Intermediate", hint: "Real-world behavior, tradeoffs and pitfalls" },
  { value: "advanced", label: "Advanced", hint: "Internals, edge cases and design tradeoffs" },
  { value: "expert", label: "Expert", hint: "Spec-level nuance and subtle behavior" },
];

export const PRACTICE_COUNTS: PracticeCount[] = [5, 10, 20];

export const CONFIDENCE_OPTIONS: {
  value: Confidence;
  label: string;
  dot: string;
  hint: string;
}[] = [
  {
    value: "weak",
    label: "Didn't know",
    dot: "🔴",
    hint: "Add to weak areas and revisit soon",
  },
  { value: "partial", label: "Partially knew", dot: "🟡", hint: "Shaky on details or tradeoffs" },
  { value: "strong", label: "Knew it", dot: "🟢", hint: "Could explain this in an interview" },
];

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  weak: "Didn't know",
  partial: "Partially knew",
  strong: "Knew it",
};

export const CONFIDENCE_TONE: Record<Confidence, "weak" | "partial" | "strong"> = {
  weak: "weak",
  partial: "partial",
  strong: "strong",
};

export const INTERVIEW_ROLE_OPTIONS: { value: InterviewRole; label: string; hint: string }[] = [
  { value: "frontend", label: "Frontend Engineer", hint: "React, browser, rendering, a11y" },
  { value: "backend", label: "Backend Engineer", hint: "APIs, databases, scaling" },
  { value: "fullstack", label: "Full Stack Engineer", hint: "End-to-end product engineering" },
  { value: "nodejs", label: "Node.js Engineer", hint: "Runtime, streams, concurrency" },
  { value: "devops", label: "DevOps Engineer", hint: "Linux, containers, pipelines" },
];

export const INTERVIEW_LEVEL_OPTIONS: { value: InterviewLevel; label: string; hint: string }[] = [
  { value: "junior", label: "Junior", hint: "Foundations, clear reasoning" },
  { value: "mid", label: "Mid-level", hint: "Tradeoffs, ownership, production" },
];

export const INTERVIEW_DURATION_OPTIONS: {
  value: InterviewDuration;
  label: string;
  hint: string;
}[] = [
  { value: 15, label: "15 min", hint: "Screening round" },
  { value: 30, label: "30 min", hint: "Standard technical round" },
  { value: 45, label: "45 min", hint: "Deep-dive round" },
];

export const EXPLANATION_ACTIONS: { mode: ExplanationMode; label: string; hint: string }[] = [
  { mode: "simply", label: "Explain simply", hint: "Plain language, first principles" },
  { mode: "deeper", label: "Explain deeper", hint: "Internals and tradeoffs" },
  { mode: "code", label: "Show code", hint: "Minimal runnable example" },
  { mode: "example", label: "Real-world example", hint: "Where this shows up in production" },
  { mode: "interview", label: "Interview explanation", hint: "What to actually say out loud" },
];

export const MAX_AI_QUESTIONS_PER_SESSION = 10;
