import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, expectedToken, timingSafeEqual } from "@/lib/auth";

// Gate the whole app behind the single password. Public: the login page and
// the login API. Everything else (pages + APIs) requires a valid session.
//
// If APP_PASSWORD is unset, the gate is open — convenient for local dev, but
// always set APP_PASSWORD in the deployed (Vercel) environment.

const PUBLIC_PATHS = ["/login", "/api/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const expected = await expectedToken();
  if (!expected) return NextResponse.next(); // no password configured → open

  const cookie = req.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (cookie && timingSafeEqual(cookie, expected)) {
    return NextResponse.next();
  }

  // API calls get a 401; page navigations get redirected to /login.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
