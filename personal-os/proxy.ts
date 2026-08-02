import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifyApiSecret, verifySessionToken } from "@/lib/auth/session";

// Next.js 16 renamed `middleware.ts` -> `proxy.ts` (and `middleware` export -> `proxy`).
export const config = {
  matcher: [
    "/((?!login|api/auth|api/telegram/webhook|_next/static|_next/image|favicon.ico).*)",
  ],
};

export async function proxy(request: NextRequest) {
  const apiSecretHeader = request.headers.get("x-api-secret");
  if (verifyApiSecret(apiSecretHeader)) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(COOKIE_NAME)?.value;
  const validSession = await verifySessionToken(sessionCookie);

  if (validSession) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
