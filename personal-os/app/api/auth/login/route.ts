import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE_SECONDS, createSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "server misconfigured: DASHBOARD_PASSWORD not set" },
      { status: 500 }
    );
  }

  if (password !== expected) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return response;
}
