import { NextResponse } from "next/server";

import { apiError, fromZodError, guard, readJson } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { getStore } from "@/lib/store";
import { activitySchema } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * The activity log is server-side on purpose: DesignLab writes to it in one
 * tab and the Tether dashboard reads it in another. That cross-tab visibility
 * is what makes the WebMCP flow legible on camera.
 */
export async function GET(request: Request) {
  return guard(async () => {
    const limitParam = Number(new URL(request.url).searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 120) : 60;
    const events = await getStore().activity(await getUserId(), limit);
    return NextResponse.json({ events });
  });
}

export async function POST(request: Request) {
  return guard(async () => {
    const body = await readJson(request);
    if (body === null) return apiError("Request body must be JSON.", 400);

    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) return fromZodError(parsed.error);

    const event = await getStore().log({ userId: await getUserId(), ...parsed.data });
    return NextResponse.json({ event }, { status: 201 });
  });
}

/** DELETE /api/activity resets the whole sandbox for a clean demo take. */
export async function DELETE() {
  return guard(async () => {
    const userId = await getUserId();
    await getStore().reset(userId);
    return NextResponse.json({ reset: true });
  });
}
