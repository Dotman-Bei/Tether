import type { Category, Memory } from "./types";

/**
 * Lightweight lexical retrieval.
 *
 * The build spec is explicit that embeddings are not worth hackathon time here:
 * the corpus is a handful of short, structured, user-authored statements, so
 * token overlap plus tag/category boosts is both accurate and explainable,
 * and "explainable" matters, because the UI shows the user *why* a memory
 * matched.
 */

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i",
  "in", "is", "it", "me", "my", "of", "on", "or", "please", "that", "the",
  "their", "them", "they", "this", "to", "use", "user", "want", "wants", "was",
  "what", "when", "which", "will", "with", "would", "you", "your",
]);

/** Query words that should pull in a whole category even without a text hit. */
const CATEGORY_HINTS: Record<string, Category> = {
  prefer: "preference",
  preference: "preference",
  preferences: "preference",
  like: "preference",
  likes: "preference",
  setting: "preference",
  settings: "preference",
  workflow: "workflow",
  process: "workflow",
  convention: "workflow",
  conventions: "workflow",
  project: "project",
  projects: "project",
  starter: "project",
  scaffold: "project",
  constraint: "constraint",
  constraints: "constraint",
  requirement: "constraint",
  avoid: "constraint",
};

/** Domain synonyms so "new project" finds "TypeScript for new projects". */
const SYNONYMS: Record<string, string[]> = {
  ui: ["interface", "interfaces", "theme", "design"],
  theme: ["ui", "interface", "interfaces", "dark", "light"],
  dark: ["theme", "ui", "interface", "interfaces"],
  layout: ["density", "spacing", "compact", "comfortable"],
  compact: ["layout", "density", "spacing"],
  language: ["typescript", "javascript", "python", "rust", "go"],
  typescript: ["language", "ts", "types", "typed"],
  project: ["starter", "scaffold", "app", "repo", "boilerplate"],
  starter: ["project", "scaffold", "boilerplate"],
  scaffold: ["project", "starter", "boilerplate"],
  development: ["dev", "engineering", "code", "coding"],
  design: ["ui", "visual", "interface", "interfaces"],
};

export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s#-]/g, " ")
    .split(/[\s#-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

/** Crude singularisation: "interfaces" -> "interface", "layouts" -> "layout". */
function singular(token: string): string {
  return token.endsWith("s") && token.length > 3 ? token.slice(0, -1) : token;
}

/** Normalise a memory's own words the same way we normalise the query. */
function normalize(tokens: string[]): Set<string> {
  const set = new Set(tokens);
  for (const token of tokens) set.add(singular(token));
  return set;
}

function expand(tokens: string[]): Set<string> {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const synonym of SYNONYMS[token] ?? []) expanded.add(synonym);
    expanded.add(singular(token));
  }
  return expanded;
}

export type ScoredMemory = {
  memory: Memory;
  score: number;
  /** Human-readable reason, surfaced in the retrieval-explanation UI. */
  matchedOn: string[];
};

/**
 * Score a memory against a query. Returns 0 when nothing matched.
 *
 * Weighting: an exact tag hit is the strongest signal (tags are curated), then
 * content-word overlap, then a small category-intent nudge, then confidence as
 * a tie-breaker so a shakier memory never outranks a confident one.
 */
export function scoreMemory(memory: Memory, query: string): ScoredMemory {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    // An empty query means "give me everything relevant"; rank by confidence.
    return { memory, score: 0.5 + memory.confidence * 0.1, matchedOn: ["all context"] };
  }

  const expanded = expand(queryTokens);
  const contentTokens = normalize(tokenize(memory.content));
  const memoryTags = normalize(memory.tags.map((tag) => tag.toLowerCase()));

  let score = 0;
  const matchedOn: string[] = [];

  for (const token of expanded) {
    if (memoryTags.has(token)) {
      score += 3;
      matchedOn.push(`#${token}`);
    }
    if (contentTokens.has(token)) {
      score += 2;
      matchedOn.push(token);
    }
  }

  for (const token of queryTokens) {
    const hinted = CATEGORY_HINTS[token];
    if (hinted && hinted === memory.category) {
      score += 1.5;
      matchedOn.push(`category:${hinted}`);
    }
  }

  if (score === 0) return { memory, score: 0, matchedOn: [] };

  // Confidence only breaks ties; it can never manufacture a match.
  score += memory.confidence;

  return { memory, score, matchedOn: Array.from(new Set(matchedOn)).slice(0, 5) };
}

export function rankMemories(memories: Memory[], query: string, limit = 20): ScoredMemory[] {
  return memories
    .map((memory) => scoreMemory(memory, query))
    .filter((scored) => scored.score > 0)
    .sort((a, b) => b.score - a.score || b.memory.createdAt.localeCompare(a.memory.createdAt))
    .slice(0, limit);
}
