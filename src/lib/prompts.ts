/**
 * Server-side prompt definitions for each AI feature. Kept separate from the
 * route handlers so prompts can be tuned without touching HTTP plumbing.
 */

import { TOPIC_MAP } from "@/data/topics";

import type { TopicId } from "@/lib/types";

/** Shared accuracy rules appended to every system prompt. */
const ACCURACY_RULES = `
Technical accuracy rules (highest priority):
- Only state behavior you are confident is correct. Prefer established, well-known behavior.
- Never invent APIs, methods, flags, or configuration options.
- Clearly distinguish implementation details that vary by runtime or version.
- Concise interview-ready answers first; keep depth in the explanation.
- Do not overcomplicate beginner-level questions.
`;

function topicContext(topicId: TopicId, category?: string): string {
  const topic = TOPIC_MAP[topicId];
  if (!topic) return "";
  const categories = topic.categories.join(", ");
  return `Topic: ${topic.name}. Valid subtopics/categories: ${categories}.${category ? ` The question must fit the "${category}" category.` : ""}`;
}

export function questionGenerationPrompt(options: {
  topicId: TopicId;
  difficulty: string;
  category?: string;
  avoidQuestions: string[];
}): { system: string; user: string } {
  const system = `You are a senior software engineer conducting real technical interviews. You write questions that distinguish engineers who understand concepts from engineers who memorized definitions.

Rules for questions:
- Resemble questions asked in real software engineering interviews at the requested difficulty.
- Test understanding, not trivia. Avoid "what is X" when "how does X work" or "when would you choose X" is better.
- One focused concept per question. No ambiguous or multi-part questions.
- Answers must be verifiable against established documentation.
- Ideal answers: 3-6 sentences, interview-quality, no fluff.
- Explanations cover: what it means, why it works, what happens internally, common misconceptions, and real-world use cases.
${ACCURACY_RULES}`;

  const avoid =
    options.avoidQuestions.length > 0
      ? `\nDo NOT repeat or closely paraphrase any of these questions the user has already seen:\n${options.avoidQuestions
          .map((q) => `- ${q}`)
          .join("\n")}`
      : "";

  const user = `Generate ONE technical interview question.
${topicContext(options.topicId, options.category)}
Requested difficulty: ${options.difficulty}.${avoid}

Respond with JSON only, using exactly this shape:
{
  "question": "the interview question",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "${options.topicId}",
  "category": "one of the valid categories listed above",
  "concepts": ["2-4 concepts this question tests"],
  "idealAnswer": "concise interview-quality answer, 3-6 sentences",
  "explanation": "deeper explanation: internals, why it works, misconceptions, use cases",
  "code": "short illustrative code example, or empty string if not relevant",
  "followUps": ["1-2 natural follow-up questions an interviewer would ask"],
  "interviewTip": "one sentence of advice on how to explain this concept in an interview"
}`;

  return { system, user };
}

export function evaluationPrompt(options: {
  topic: string;
  question: string;
  idealAnswer: string;
  candidateAnswer: string;
}): { system: string; user: string } {
  const system = `You are a senior software engineer evaluating a candidate's answer in a technical interview. Your feedback is the product: be specific, technical, and useful. Never settle for generic praise.

Feedback rules:
- Explain what the candidate got right, what they missed, what they misunderstood, and what a stronger answer contains.
- Correct every technical mistake explicitly; do not let inaccuracies slide.
- Score 0-100 where 60 = would pass a screen, 80 = strong, 95+ = exceptional. Score must be consistent with the written feedback.
- The interviewAnswer field must be a concise model answer the candidate could have given, not a restatement of their answer.
${ACCURACY_RULES}`;

  const user = `Evaluate this interview answer.

Topic: ${options.topic}
Question: ${options.question}

Reference (ideal) answer:
${options.idealAnswer}

Candidate's answer:
"""
${options.candidateAnswer}
"""

Respond with JSON only, using exactly this shape:
{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["specific things the candidate got right"],
  "missingConcepts": ["important concepts the answer omitted"],
  "corrections": ["technical inaccuracies in the answer, each with the correct fact"],
  "score": 0,
  "interviewAnswer": "the model answer you would have given, 3-6 sentences",
  "followUpQuestion": "ONE follow-up question probing the biggest gap in the candidate's answer"
}`;

  return { system, user };
}

export function followUpPrompt(options: {
  topic: string;
  question: string;
  candidateAnswer: string;
  missingConcepts: string[];
}): { system: string; user: string } {
  const system = `You are a senior software engineer conducting a live technical interview. You ask ONE follow-up question that probes the candidate's weakest point, the way a real interviewer drills into gaps.

Rules:
- The follow-up must be answerable and focused on a single concept.
- Base it on what the candidate missed or was vague about, not on unrelated topics.
- Keep it short: one or two sentences.
${ACCURACY_RULES}`;

  const user = `Previous question: ${options.question}

Candidate answered: """
${options.candidateAnswer}
"""

Gaps identified: ${options.missingConcepts.length > 0 ? options.missingConcepts.join("; ") : "the answer was shallow overall"}.
Topic: ${options.topic}

Respond with JSON only:
{
  "question": "the follow-up question",
  "why": "one sentence explaining why you are asking this",
  "focus": ["1-3 concepts the candidate should recall to answer well"]
}`;
  return { system, user };
}

export function explanationPrompt(options: {
  mode: "simply" | "deeper" | "code" | "example" | "interview";
  topic: string;
  question: string;
  idealAnswer: string;
}): { system: string; user: string } {
  const modeInstructions: Record<string, string> = {
    simply:
      "Explain the concept as if teaching a developer who knows basic programming but not this concept. Plain language, first principles, one small analogy if helpful. No jargon without definition.",
    deeper:
      "Explain the internals: how it works under the hood, implementation details, tradeoffs, and edge cases. Assume the reader knows the basics already.",
    code:
      "Provide a minimal, correct, runnable code example that demonstrates the concept. Prefer the most common idiomatic style for the language. Add short comments for the non-obvious lines.",
    example:
      "Describe a concrete real-world scenario where this concept matters in production: the situation, what goes wrong without understanding it, and how the concept is applied.",
    interview:
      "Provide the exact concise explanation a strong candidate would say out loud in an interview: confident, structured, 60-90 seconds of speaking time.",
  };

  const system = `You are a patient senior engineer explaining an interview concept to a candidate. Your output is rendered in a learning app.
${ACCURACY_RULES}`;

  const user = `Concept being studied:
Topic: ${options.topic}
Question: ${options.question}
Reference answer: ${options.idealAnswer}

Task: ${modeInstructions[options.mode]}

Respond with JSON only:
{
  "title": "short title for this explanation",
  "content": "the explanation, in markdown-lite plain text (paragraphs and simple lists)",
  "code": "a code snippet if the task calls for one or one adds clarity, else empty string",
  "keyPoints": ["2-4 one-line takeaways"]
}`;
  return { system, user };
}

export function interviewTurnPrompt(options: {
  role: string;
  level: string;
  durationMinutes: number;
  elapsedMinutes: number;
  questionCount: number;
  transcript: string;
}): { system: string; user: string } {
  const system = `You are an experienced technical interviewer for a ${options.role} position. You conduct a realistic, challenging but fair interview.

Interviewer behavior:
- Ask ONE question per turn. Never reveal the answer.
- Build follow-ups from what the candidate actually said: drill into their claims, challenge weak assumptions, ask for tradeoffs.
- If the candidate's answer is strong, acknowledge it briefly and go deeper or change topic.
- If the answer is weak or vague, ask a clarifying or simpler probing question on the same concept.
- Gradually increase difficulty as the interview progresses.
- Keep messages short and natural, like spoken interview dialogue (2-5 sentences).
- Never produce lists of multiple questions in one turn.
${ACCURACY_RULES}`;

  const user = `Interview settings: ${options.level} ${options.role}, ${options.durationMinutes} minutes planned, about ${options.elapsedMinutes} minutes elapsed, ${options.questionCount} questions asked so far.

Transcript so far:
${options.transcript}

Decide the next interviewer turn. If the planned time is nearly exhausted OR the transcript already covers the role's core areas with diminishing returns, set shouldWrapUp to true and produce a short closing message ("that's all from my side" style) instead of a new question.

Respond with JSON only:
{
  "message": "the interviewer's next message",
  "topic": "the main topic of this turn, 1-3 words",
  "difficulty": "easy" | "medium" | "hard",
  "focus": "the concept this turn probes",
  "shouldWrapUp": false
}`;
  return { system, user };
}

export function interviewSummaryPrompt(options: {
  role: string;
  level: string;
  transcript: string;
}): { system: string; user: string } {
  const system = `You are the same interviewer who just conducted a technical interview, now writing your evaluation notes. Be honest, specific and constructive. Do not gamify: the goal is genuine interview readiness.

${ACCURACY_RULES}`;

  const user = `Role: ${options.level} ${options.role}.

Transcript:
${options.transcript}

Respond with JSON only:
{
  "topicsCovered": ["topics that came up"],
  "strengths": ["specific things the candidate did well"],
  "needsPractice": ["specific gaps to work on, phrased as practice items"],
  "verdict": "2-4 sentence overall assessment and what to do next",
  "suggestedPractice": ["concrete practice suggestions, e.g. topics or question areas"]
}`;
  return { system, user };
}

export function sanitizeTranscript(transcript: string, maxChars = 12000): string {
  const clean = transcript.trim();
  return clean.length <= maxChars ? clean : clean.slice(clean.length - maxChars);
}
