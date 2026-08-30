import { NextResponse } from "next/server";

import { apiError, fromZodError, guard, readJson } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { getStore } from "@/lib/store";
import { updateMemorySchema } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/memory/:id */
export async function GET(_request: Request, { params }: Params) {
  return guard(async () => {
    const { id } = await params;
    const memory = await getStore().get(await getUserId(), id);
    if (!memory) return apiError("Memory not found.", 404);
    return NextResponse.json({ memory });
  });
}

/** PATCH /api/memory/:id — refine an existing memory in place. */
export async function PATCH(request: Request, { params }: Params) {
  return guard(async () => {
    const { id } = await params;
    const body = await readJson(request);
    if (body === null) return apiError("Request body must be JSON.", 400);

    const parsed = updateMemorySchema.safeParse(body);
    if (!parsed.success) return fromZodError(parsed.error);

    const store = getStore();
    const userId = await getUserId();

    // `tags` always parses to an array; an empty one means "not provided".
    const { tags, ...rest } = parsed.data;
    const patch = { ...rest, ...(tags.length > 0 ? { tags } : {}) };

    const memory = await store.update(userId, id, patch);
    if (!memory) return apiError("Memory not found.", 404);

    await store.log({
      userId,
      channel: "TETHER",
      label: "memory updated",
      detail: `${memory.id.slice(0, 8)} · "${memory.content}"`,
      origin: "system",
      status: "ok",
    });

    return NextResponse.json({ memory });
  });
}

/** DELETE /api/memory/:id — the human control path. Always available. */
export async function DELETE(_request: Request, { params }: Params) {
  return guard(async () => {
    const { id } = await params;
    const store = getStore();
    const userId = await getUserId();

    const memory = await store.remove(userId, id);
    if (!memory) return apiError("Memory not found.", 404);

    await store.log({
      userId,
      channel: "TETHER",
      label: "memory deleted",
      detail: `User removed "${memory.content}" — no longer retrievable by any site`,
      origin: "manual",
      status: "ok",
    });

    return NextResponse.json({ deleted: memory });
  });
}
