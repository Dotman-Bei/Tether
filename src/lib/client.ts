"use client";

import type { ActivityEvent, Memory, Origin } from "./types";

/**
 * Client-side plumbing shared by all three surfaces.
 *
 * Every surface talks to the same origin, so a BroadcastChannel gives instant
 * cross-tab updates (DesignLab stores → the Tether tab repaints immediately),
 * while polling remains the fallback for browsers or contexts without it.
 */

const CHANNEL = "tether:sync";

export type SyncMessage =
  | { kind: "memories-changed" }
  | { kind: "activity"; event: ActivityEvent };

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  channel ??= new BroadcastChannel(CHANNEL);
  return channel;
}

export function broadcast(message: SyncMessage) {
  try {
    getChannel()?.postMessage(message);
  } catch {
    /* a missing channel is never fatal; polling covers it */
  }
}

export function subscribe(handler: (message: SyncMessage) => void): () => void {
  const bus = getChannel();
  if (!bus) return () => {};
  const listener = (event: MessageEvent<SyncMessage>) => handler(event.data);
  bus.addEventListener("message", listener);
  return () => bus.removeEventListener("message", listener);
}

/* ------------------------------------------------------------------ */
/* Activity log                                                        */
/* ------------------------------------------------------------------ */

export type LogInput = {
  channel: string;
  label: string;
  detail?: string;
  origin?: Origin;
  status?: "ok" | "error" | "info";
};

/** Persist an activity event and echo it to every open tab. */
export async function logActivity(input: LogInput): Promise<void> {
  try {
    const response = await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: input.channel,
        label: input.label,
        detail: input.detail ?? "",
        origin: input.origin ?? "system",
        status: input.status ?? "ok",
      }),
    });
    if (!response.ok) return;
    const { event } = (await response.json()) as { event: ActivityEvent };
    broadcast({ kind: "activity", event });
  } catch {
    /* telemetry must never break the product path */
  }
}

/* ------------------------------------------------------------------ */
/* Memory API client                                                   */
/* ------------------------------------------------------------------ */

export type RetrievedMemory = Memory & { relevance: number; matchedOn: string[] };

type ApiIssue = { path: string; message: string };

async function json<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    const base =
      typeof body.error === "string" ? body.error : `Request failed (${response.status})`;
    // Surface Zod's per-field messages: an agent retrying a rejected tool call
    // needs to know which argument was wrong, not just that something was.
    const issues = Array.isArray(body.issues) ? (body.issues as ApiIssue[]) : [];
    const detail = issues
      .map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
      .join("; ");
    throw new Error(detail ? `${base}: ${detail}` : base);
  }
  return body as T;
}

export async function listMemories(): Promise<Memory[]> {
  const data = await json<{ memories: Memory[] }>(await fetch("/api/memory", { cache: "no-store" }));
  return data.memories;
}

export async function createMemory(input: {
  content: string;
  category?: string;
  tags?: string[];
  source: string;
  confidence?: number;
}): Promise<{ memory: Memory; duplicate: boolean }> {
  const result = await json<{ memory: Memory; duplicate: boolean }>(
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  broadcast({ kind: "memories-changed" });
  return result;
}

export async function searchMemories(
  query: string,
  options: { source?: string; limit?: number } = {},
): Promise<RetrievedMemory[]> {
  const params = new URLSearchParams({ q: query });
  if (options.source) params.set("source", options.source);
  if (options.limit) params.set("limit", String(options.limit));
  const data = await json<{ memories: RetrievedMemory[] }>(
    await fetch(`/api/memory/search?${params}`, { cache: "no-store" }),
  );
  return data.memories;
}

export async function updateMemory(
  id: string,
  patch: { content?: string; category?: string; tags?: string[]; confidence?: number },
): Promise<Memory> {
  const data = await json<{ memory: Memory }>(
    await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }),
  );
  broadcast({ kind: "memories-changed" });
  return data.memory;
}

export async function deleteMemory(id: string): Promise<Memory> {
  const data = await json<{ deleted: Memory }>(
    await fetch(`/api/memory/${id}`, { method: "DELETE" }),
  );
  broadcast({ kind: "memories-changed" });
  return data.deleted;
}

export async function fetchActivity(limit = 60): Promise<ActivityEvent[]> {
  const data = await json<{ events: ActivityEvent[] }>(
    await fetch(`/api/activity?limit=${limit}`, { cache: "no-store" }),
  );
  return data.events;
}

export async function resetSandbox(): Promise<void> {
  await fetch("/api/activity", { method: "DELETE" });
  broadcast({ kind: "memories-changed" });
}
