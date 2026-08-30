import { NextResponse } from "next/server";

import { apiError, fromZodError, guard, readJson } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { getStore } from "@/lib/store";
import { CATEGORIES, createMemorySchema, type Category } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/memory lists every memory for the current demo user. */
export async function GET(request: Request) {
  return guard(async () => {
    const store = getStore();
    const userId = await getUserId();
    const params = new URL(request.url).searchParams;

    const sourceParam = params.get("source")?.trim();
    const categoryParam = params.get("category")?.trim();
    const category =
      categoryParam && (CATEGORIES as readonly string[]).includes(categoryParam)
        ? (categoryParam as Category)
        : undefined;

    const memories = await store.list(userId, {
      source: sourceParam && sourceParam !== "all" ? sourceParam : undefined,
      category,
    });

    return NextResponse.json({ memories, count: memories.length, driver: store.driver });
  });
}

/** POST /api/memory persists one structured memory. */
export async function POST(request: Request) {
  return guard(async () => {
    const body = await readJson(request);
    if (body === null) return apiError("Request body must be JSON.", 400);

    const parsed = createMemorySchema.safeParse(body);
    if (!parsed.success) return fromZodError(parsed.error);

    const store = getStore();
    const userId = await getUserId();

    // Idempotence guard: an agent retrying a tool call should not double-write.
    const existing = await store.list(userId);
    const duplicate = existing.find(
      (memory) => memory.content.toLowerCase() === parsed.data.content.toLowerCase(),
    );
    if (duplicate) {
      await store.log({
        userId,
        channel: "TETHER",
        label: "store_context",
        detail: `Duplicate ignored; already knew "${duplicate.content}"`,
        origin: "system",
        status: "info",
      });
      return NextResponse.json({ memory: duplicate, duplicate: true }, { status: 200 });
    }

    const memory = await store.create({ userId, ...parsed.data });

    await store.log({
      userId,
      channel: "TETHER",
      label: "memory created",
      detail: `${memory.id.slice(0, 8)} · "${memory.content}" from ${memory.source}`,
      origin: "system",
      status: "ok",
    });

    return NextResponse.json({ memory, duplicate: false }, { status: 201 });
  });
}
