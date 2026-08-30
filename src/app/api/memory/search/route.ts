import { NextResponse } from "next/server";

import { fromZodError, guard } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { getStore } from "@/lib/store";
import { searchSchema } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/memory/search?q=...&source=...&category=...&limit=...
 *
 * Returns ranked memories plus the reason each one matched, so the consuming
 * site can show the user *why* context was applied rather than asserting it.
 */
export async function GET(request: Request) {
  return guard(async () => {
    const params = new URL(request.url).searchParams;
    const parsed = searchSchema.safeParse({
      q: params.get("q") ?? "",
      source: params.get("source") ?? undefined,
      category: params.get("category") ?? undefined,
      limit: params.get("limit") ?? undefined,
    });
    if (!parsed.success) return fromZodError(parsed.error);

    const store = getStore();
    const userId = await getUserId();
    const ranked = await store.search({ userId, ...parsed.data });

    return NextResponse.json({
      query: parsed.data.q,
      count: ranked.length,
      memories: ranked.map(({ memory, score, matchedOn }) => ({
        ...memory,
        relevance: Number(score.toFixed(2)),
        matchedOn,
      })),
    });
  });
}
