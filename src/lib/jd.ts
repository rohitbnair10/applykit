// ---------------------------------------------------------------------------
// Job-description intake.
//
// Paste is the primary path. A URL box attempts a server-side fetch + a
// lightweight readability extraction; on any failure it falls back to paste
// with a clear, intentional-feeling message. LinkedIn job links almost always
// hit an auth wall — we detect that and say so plainly rather than looking
// broken.
// ---------------------------------------------------------------------------

export interface JDFetchResult {
  ok: boolean;
  text?: string;
  title?: string;
  reason?: string; // present when ok=false
  authWall?: boolean;
}

function stripHtml(html: string): { text: string; title?: string } {
  // Pull <title> if present.
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]).trim() : undefined;

  // Prefer <main> or <article> if present (more likely the JD body).
  let body = html;
  const main = html.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);
  if (main) body = main[2];

  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return { text: collapse(decode(text)), title };
}

function decode(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}

function collapse(s: string): string {
  return s
    .split("\n")
    .map((l) => l.replace(/[ \t\f\v]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function fetchJD(url: string): Promise<JDFetchResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("not http");
  } catch {
    return { ok: false, reason: "That doesn't look like a valid URL." };
  }

  const isLinkedIn = /(^|\.)linkedin\.com$/i.test(parsed.hostname);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        // A realistic UA improves the odds on sites that block bots.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return {
        ok: false,
        authWall: isLinkedIn || res.status === 401 || res.status === 403,
        reason: linkedInOr(
          isLinkedIn,
          `The page returned ${res.status}. Paste the description below instead.`
        ),
      };
    }

    const html = await res.text();
    const { text, title } = stripHtml(html);

    // Heuristic: LinkedIn auth walls return a short shell with a sign-in prompt.
    const looksGated =
      isLinkedIn &&
      (/sign in|join now|authwall/i.test(html) || text.length < 600);

    if (looksGated || text.length < 200) {
      return {
        ok: false,
        authWall: isLinkedIn || looksGated,
        reason: linkedInOr(
          isLinkedIn,
          "Couldn't extract enough readable text from that page. Paste the description below instead."
        ),
      };
    }

    return { ok: true, text, title };
  } catch (e) {
    const aborted = e instanceof Error && e.name === "AbortError";
    return {
      ok: false,
      authWall: isLinkedIn,
      reason: linkedInOr(
        isLinkedIn,
        aborted
          ? "That page took too long to load. Paste the description below instead."
          : "Couldn't reach that page. Paste the description below instead."
      ),
    };
  }
}

function linkedInOr(isLinkedIn: boolean, fallback: string): string {
  if (isLinkedIn) {
    return "LinkedIn requires a sign-in to read job posts, so it can't be fetched automatically — this is expected. Paste the description below and it'll work exactly the same.";
  }
  return fallback;
}
