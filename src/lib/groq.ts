/**
 * Server-side Groq utility. The ONLY module in the app that reads GROQ_API_KEY.
 * Every AI Route Handler funnels through here so the key never reaches the
 * browser and retry/timeout/error mapping happens in one place.
 */

import Groq from "groq-sdk";

import type { ApiErrorCode, ApiErrorPayload } from "@/lib/types";

let client: Groq | null = null;

export const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";

/** Small class so handlers can signal failure with an HTTP status + typed code. */
export class GroqApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "GroqApiError";
    this.code = code;
    this.status = status;
  }
}

export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new GroqApiError(
      "missing_api_key",
      "GROQ_API_KEY is not configured on the server. Add it to .env.local and restart.",
      503,
    );
  }
  if (!client) {
    client = new Groq({ apiKey, timeout: 45_000, maxRetries: 1 });
  }
  return client;
}

const RETRY_AFTER_HEADER_CANDIDATES = ["retry-after", "x-ratelimit-reset-requests", "x-ratelimit-reset-tokens"];

function rateLimitHint(error: unknown): string {
  if (error && typeof error === "object" && "headers" in error) {
    const headers = (error as { headers?: Record<string, unknown> }).headers;
    if (headers) {
      for (const candidate of RETRY_AFTER_HEADER_CANDIDATES) {
        const value = headers[candidate];
        if (typeof value === "string" && value.trim()) {
          return ` Try again in ~${value} seconds.`;
        }
      }
    }
  }
  return " Wait a few seconds and try again.";
}

/** Maps any thrown error from a Groq call into a typed, user-safe API error. */
export function toGroqApiError(error: unknown): GroqApiError {
  if (error instanceof GroqApiError) return error;

  if (error instanceof Groq.APIError) {
    const status = error.status ?? 500;
    if (status === 401 || status === 403) {
      return new GroqApiError("auth_error", "The Groq API key was rejected. Check GROQ_API_KEY on the server.", 502);
    }
    if (status === 429) {
      return new GroqApiError("rate_limit", `Groq rate limit reached.${rateLimitHint(error)}`, 429);
    }
    const detail = typeof error.message === "string" ? error.message.slice(0, 200) : "";
    return new GroqApiError("api_error", `Groq request failed${detail ? `: ${detail}` : "."}`, 502);
  }

  if (error instanceof Error) {
    if (error.name === "APIConnectionError" || /fetch failed|network|ENOTFOUND|ECONNREFUSED/i.test(error.message)) {
      return new GroqApiError("network_error", "Could not reach the Groq API. Check your network connection.", 502);
    }
    if (error.name === "APIConnectionTimeoutError") {
      return new GroqApiError("timeout", "The Groq request timed out. Try again in a moment.", 504);
    }
    return new GroqApiError("api_error", "Groq request failed unexpectedly.", 500);
  }

  return new GroqApiError("api_error", "Groq request failed unexpectedly.", 500);
}

/**
 * Sends a chat completion asking for strict JSON and parses it.
 * Returns the parsed object; throws GroqApiError("invalid_response") when the
 * model returns malformed JSON or misses the required shape.
 */
export async function groqJson<T extends object>(options: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const { system, user, temperature = 0.4, maxTokens = 2200 } = options;

  let completion: Groq.Chat.ChatCompletion;
  try {
    completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
  } catch (error) {
    throw toGroqApiError(error);
  }

  const text = completion.choices[0]?.message?.content ?? "";
  return parseModelJson<T>(text);
}

/** Parses model output leniently: strips code fences and finds the JSON object. */
export function parseModelJson<T extends object>(text: string): T {
  let candidate = text.trim();
  const fence = candidate.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence?.[1]) candidate = fence[1].trim();

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new GroqApiError("invalid_response", "The AI response was malformed. Please try again.", 502);
  }
  candidate = candidate.slice(start, end + 1);

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    throw new GroqApiError("invalid_response", "The AI response was malformed. Please try again.", 502);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new GroqApiError("invalid_response", "The AI response had an unexpected shape. Please try again.", 502);
  }
  return parsed as T;
}
