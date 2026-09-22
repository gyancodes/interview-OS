import { NextResponse } from "next/server";

import { GroqApiError } from "@/lib/groq";

import type { ApiErrorPayload } from "@/lib/types";

/** Shared error -> HTTP response mapping for AI Route Handlers. */
export function errorResponse(error: unknown): NextResponse<ApiErrorPayload> {
  const groqError =
    error instanceof GroqApiError
      ? error
      : new GroqApiError("api_error", "The AI request failed unexpectedly. Your work has been saved locally — try again in a moment.", 500);

  if (process.env.NODE_ENV !== "production") {
    console.error(`[api/ai] ${groqError.code}: ${groqError.message}`);
  }
  return NextResponse.json({ code: groqError.code, message: groqError.message } satisfies ApiErrorPayload, {
    status: groqError.status,
  });
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new GroqApiError("invalid_request", `Missing or invalid field: ${field}.`, 400);
  }
  return value.trim();
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
