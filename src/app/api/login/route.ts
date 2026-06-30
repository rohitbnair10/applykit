import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, sessionToken, timingSafeEqual } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST { password } → sets the session cookie on a correct password.
export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };
  const configured = process.env.APP_PASSWORD;

  if (!configured) {
    return NextResponse.json(
      { error: "No password configured on the server." },
      { status: 500 }
    );
  }
  if (!password || !timingSafeEqual(password, configured)) {
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const token = await sessionToken(configured);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

// DELETE → log out.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
