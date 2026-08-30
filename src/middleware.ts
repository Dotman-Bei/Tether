import { NextResponse, type NextRequest } from "next/server";

export const TETHER_UID_COOKIE = "tether_uid";

/**
 * Every visitor gets their own isolated memory sandbox.
 *
 * The security baseline in the build spec calls for demo memories scoped to a
 * single demo user/session — this is that scope. It is an opaque random id in
 * a first-party cookie: no accounts, no PII, and one judge's demo can never
 * show up in another's feed.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (request.cookies.get(TETHER_UID_COOKIE)?.value) return response;

  response.cookies.set(TETHER_UID_COOKIE, `u_${crypto.randomUUID()}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg$).*)"],
};
