import "server-only";

import { cookies } from "next/headers";

import { TETHER_UID_COOKIE } from "@/middleware";

/**
 * Resolve the current demo user. Middleware normally plants the cookie on the
 * first request; the fallback keeps direct API calls (curl, tests) working
 * against a stable id instead of erroring.
 */
export async function getUserId(): Promise<string> {
  const jar = await cookies();
  return jar.get(TETHER_UID_COOKIE)?.value ?? "u_demo";
}
