import { z } from "zod";

/**
 * A Tether memory is a single structured fact about the user that a
 * participating WebMCP site chose to persist. Structure — not raw chat text —
 * is what lets a second site retrieve and apply it without the user repeating
 * themselves.
 */
export const CATEGORIES = [
  "preference",
  "workflow",
  "project",
  "constraint",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export type Memory = {
  id: string;
  userId: string;
  content: string;
  category: Category;
  tags: string[];
  source: string;
  confidence: number;
  scope: "personal";
  createdAt: string;
  updatedAt: string;
};

/** Where a tool call came from. Never used to fabricate agent activity. */
export const ORIGINS = ["agent", "manual", "system"] as const;
export type Origin = (typeof ORIGINS)[number];

export type ActivityEvent = {
  id: string;
  userId: string;
  /** Surface that emitted the event: Tether, DesignLab, DevForge, WebMCP. */
  channel: string;
  /** Tool name or operation, e.g. `store_context`. */
  label: string;
  detail: string;
  origin: Origin;
  status: "ok" | "error" | "info";
  createdAt: string;
};

/* ------------------------------------------------------------------ */
/* Validation schemas — every tool input and API body passes through   */
/* one of these before it reaches the store.                           */
/* ------------------------------------------------------------------ */

const content = z
  .string()
  .trim()
  .min(3, "Memory content must be at least 3 characters")
  .max(400, "Memory content must be 400 characters or fewer");

const tags = z
  .array(z.string().trim().min(1).max(32))
  .max(8, "At most 8 tags")
  .optional()
  .transform((value) =>
    Array.from(new Set((value ?? []).map((tag) => tag.replace(/^#/, "").toLowerCase()))),
  );

const source = z.string().trim().min(1).max(48);
const confidence = z.coerce.number().min(0).max(1);

export const createMemorySchema = z.object({
  content,
  category: z.enum(CATEGORIES).default("preference"),
  tags,
  source: source.default("Unknown"),
  confidence: confidence.default(0.9),
});

export const updateMemorySchema = z
  .object({
    content: content.optional(),
    category: z.enum(CATEGORIES).optional(),
    tags,
    confidence: confidence.optional(),
  })
  .refine(
    (value) =>
      value.content !== undefined ||
      value.category !== undefined ||
      value.confidence !== undefined ||
      (value.tags?.length ?? 0) > 0,
    { message: "Provide at least one field to update" },
  );

export const searchSchema = z.object({
  q: z.string().trim().max(200).optional().default(""),
  source: z.string().trim().max(48).optional(),
  category: z.enum(CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const activitySchema = z.object({
  channel: z.string().trim().min(1).max(24),
  label: z.string().trim().min(1).max(64),
  detail: z.string().trim().max(400).default(""),
  origin: z.enum(ORIGINS).default("system"),
  status: z.enum(["ok", "error", "info"]).default("ok"),
});

export type CreateMemoryInput = z.input<typeof createMemorySchema>;
export type UpdateMemoryInput = z.input<typeof updateMemorySchema>;

/* ------------------------------------------------------------------ */
/* Presentation helpers shared by every surface                        */
/* ------------------------------------------------------------------ */

export function confidenceLabel(value: number): "HIGH" | "MEDIUM" | "LOW" {
  if (value >= 0.85) return "HIGH";
  if (value >= 0.6) return "MEDIUM";
  return "LOW";
}

export function relativeTime(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
