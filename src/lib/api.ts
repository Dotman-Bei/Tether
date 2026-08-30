import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Uniform error envelope so tool `execute` handlers can surface real reasons. */
export function apiError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function fromZodError(error: ZodError) {
  return apiError("Invalid input", 422, {
    issues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Wrap a handler so an unexpected store failure never leaks a stack trace. */
export async function guard<T>(fn: () => Promise<T>): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (error) {
    console.error("[tether] request failed:", error);
    return apiError("Tether could not complete that request.", 500);
  }
}
