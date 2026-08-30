import { NextResponse } from "next/server";

import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Powers the "memory layer online" pill and the driver badge in the UI. */
export async function GET() {
  const store = getStore();
  try {
    await store.activity("__healthcheck__", 1);
    return NextResponse.json({ status: "online", driver: store.driver });
  } catch {
    return NextResponse.json({ status: "degraded", driver: store.driver }, { status: 503 });
  }
}
