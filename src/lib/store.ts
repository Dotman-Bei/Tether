import "server-only";

import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { rankMemories, type ScoredMemory } from "./match";
import type { ActivityEvent, Category, Memory, Origin } from "./types";

export type CreateArgs = {
  userId: string;
  content: string;
  category: Category;
  tags: string[];
  source: string;
  confidence: number;
};

export type UpdateArgs = Partial<Pick<Memory, "content" | "category" | "tags" | "confidence">>;

export type SearchArgs = {
  userId: string;
  q: string;
  source?: string;
  category?: Category;
  limit: number;
};

export type LogArgs = Omit<ActivityEvent, "id" | "createdAt">;

export interface MemoryStore {
  readonly driver: "supabase" | "in-memory";
  list(userId: string, filter?: { source?: string; category?: Category }): Promise<Memory[]>;
  get(userId: string, id: string): Promise<Memory | null>;
  create(args: CreateArgs): Promise<Memory>;
  update(userId: string, id: string, patch: UpdateArgs): Promise<Memory | null>;
  remove(userId: string, id: string): Promise<Memory | null>;
  search(args: SearchArgs): Promise<ScoredMemory[]>;
  log(args: LogArgs): Promise<ActivityEvent>;
  activity(userId: string, limit?: number): Promise<ActivityEvent[]>;
  reset(userId: string): Promise<void>;
}

const MAX_ACTIVITY = 120;

/* ------------------------------------------------------------------ */
/* In-memory driver (zero-config default)                              */
/* ------------------------------------------------------------------ */

type Db = { memories: Memory[]; events: ActivityEvent[] };

/**
 * Cached on globalThis so Next.js dev hot-reloads and route-handler module
 * re-evaluation inside one server process don't wipe a live demo.
 */
const globalDb = globalThis as unknown as { __tetherDb?: Db };
const db: Db = (globalDb.__tetherDb ??= { memories: [], events: [] });

class InMemoryStore implements MemoryStore {
  readonly driver = "in-memory" as const;

  async list(userId: string, filter?: { source?: string; category?: Category }) {
    return db.memories
      .filter((memory) => memory.userId === userId)
      .filter((memory) =>
        filter?.source ? memory.source.toLowerCase() === filter.source.toLowerCase() : true,
      )
      .filter((memory) => (filter?.category ? memory.category === filter.category : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async get(userId: string, id: string) {
    return db.memories.find((memory) => memory.id === id && memory.userId === userId) ?? null;
  }

  async create(args: CreateArgs) {
    const now = new Date().toISOString();
    const memory: Memory = {
      id: randomUUID(),
      userId: args.userId,
      content: args.content,
      category: args.category,
      tags: args.tags,
      source: args.source,
      confidence: args.confidence,
      scope: "personal",
      createdAt: now,
      updatedAt: now,
    };
    db.memories.unshift(memory);
    return memory;
  }

  async update(userId: string, id: string, patch: UpdateArgs) {
    const memory = await this.get(userId, id);
    if (!memory) return null;
    Object.assign(memory, patch, { updatedAt: new Date().toISOString() });
    return memory;
  }

  async remove(userId: string, id: string) {
    const index = db.memories.findIndex((m) => m.id === id && m.userId === userId);
    if (index === -1) return null;
    return db.memories.splice(index, 1)[0];
  }

  async search(args: SearchArgs) {
    const pool = await this.list(args.userId, { source: args.source, category: args.category });
    return rankMemories(pool, args.q, args.limit);
  }

  async log(args: LogArgs) {
    const event: ActivityEvent = { ...args, id: randomUUID(), createdAt: new Date().toISOString() };
    db.events.unshift(event);
    if (db.events.length > MAX_ACTIVITY * 4) db.events.length = MAX_ACTIVITY * 4;
    return event;
  }

  async activity(userId: string, limit = MAX_ACTIVITY) {
    return db.events.filter((event) => event.userId === userId).slice(0, limit);
  }

  async reset(userId: string) {
    db.memories = db.memories.filter((memory) => memory.userId !== userId);
    db.events = db.events.filter((event) => event.userId !== userId);
  }
}

/* ------------------------------------------------------------------ */
/* Supabase driver                                                     */
/* ------------------------------------------------------------------ */

type MemoryRow = {
  id: string;
  user_id: string;
  content: string;
  category: Category;
  tags: string[] | null;
  source: string;
  confidence: number;
  scope: "personal";
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  user_id: string;
  channel: string;
  label: string;
  detail: string | null;
  origin: Origin;
  status: "ok" | "error" | "info";
  created_at: string;
};

const toMemory = (row: MemoryRow): Memory => ({
  id: row.id,
  userId: row.user_id,
  content: row.content,
  category: row.category,
  tags: row.tags ?? [],
  source: row.source,
  confidence: Number(row.confidence),
  scope: row.scope,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toEvent = (row: EventRow): ActivityEvent => ({
  id: row.id,
  userId: row.user_id,
  channel: row.channel,
  label: row.label,
  detail: row.detail ?? "",
  origin: row.origin,
  status: row.status,
  createdAt: row.created_at,
});

class SupabaseStore implements MemoryStore {
  readonly driver = "supabase" as const;

  constructor(private readonly client: SupabaseClient) {}

  async list(userId: string, filter?: { source?: string; category?: Category }) {
    let query = this.client
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (filter?.source) query = query.ilike("source", filter.source);
    if (filter?.category) query = query.eq("category", filter.category);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data as MemoryRow[]).map(toMemory);
  }

  async get(userId: string, id: string) {
    const { data, error } = await this.client
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toMemory(data as MemoryRow) : null;
  }

  async create(args: CreateArgs) {
    const { data, error } = await this.client
      .from("memories")
      .insert({
        user_id: args.userId,
        content: args.content,
        category: args.category,
        tags: args.tags,
        source: args.source,
        confidence: args.confidence,
        scope: "personal",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toMemory(data as MemoryRow);
  }

  async update(userId: string, id: string, patch: UpdateArgs) {
    const { data, error } = await this.client
      .from("memories")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toMemory(data as MemoryRow) : null;
  }

  async remove(userId: string, id: string) {
    const { data, error } = await this.client
      .from("memories")
      .delete()
      .eq("user_id", userId)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toMemory(data as MemoryRow) : null;
  }

  async search(args: SearchArgs) {
    const pool = await this.list(args.userId, { source: args.source, category: args.category });
    return rankMemories(pool, args.q, args.limit);
  }

  async log(args: LogArgs) {
    const { data, error } = await this.client
      .from("activity_events")
      .insert({
        user_id: args.userId,
        channel: args.channel,
        label: args.label,
        detail: args.detail,
        origin: args.origin,
        status: args.status,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return toEvent(data as EventRow);
  }

  async activity(userId: string, limit = MAX_ACTIVITY) {
    const { data, error } = await this.client
      .from("activity_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return (data as EventRow[]).map(toEvent);
  }

  async reset(userId: string) {
    await this.client.from("activity_events").delete().eq("user_id", userId);
    await this.client.from("memories").delete().eq("user_id", userId);
  }
}

/* ------------------------------------------------------------------ */
/* Driver selection                                                    */
/* ------------------------------------------------------------------ */

const globalStore = globalThis as unknown as { __tetherStore?: MemoryStore };

export function getStore(): MemoryStore {
  if (globalStore.__tetherStore) return globalStore.__tetherStore;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Service-role key is read here and only here: inside server-only code.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const store: MemoryStore =
    url && key
      ? new SupabaseStore(createClient(url, key, { auth: { persistSession: false } }))
      : new InMemoryStore();

  globalStore.__tetherStore = store;
  return store;
}
