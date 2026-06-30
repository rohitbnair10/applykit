// Edge-safe auth helpers. Single password gate via APP_PASSWORD (server env).
//
// We never store the raw password in the cookie. The session cookie holds a
// SHA-256 hex of APP_PASSWORD; middleware recomputes the same hash and compares.
// crypto.subtle is available in both the Edge (middleware) and Node runtimes.

export const SESSION_COOKIE = "ak_session";

export async function sessionToken(password: string): Promise<string> {
  const data = new TextEncoder().encode(`applykit:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// The token a valid session cookie must equal, derived from the configured
// password. Returns null when APP_PASSWORD is unset (gate effectively open in
// local dev unless you set it).
export async function expectedToken(): Promise<string | null> {
  const pw = process.env.APP_PASSWORD;
  if (!pw) return null;
  return sessionToken(pw);
}

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}
