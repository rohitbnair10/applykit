import { NextRequest, NextResponse } from "next/server";
import { fetchJD } from "@/lib/jd";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 20;

// POST { url } → attempts a server-side fetch + readability parse.
// On failure, returns ok:false with a clear, intentional fallback message.
export async function POST(req: NextRequest) {
  const { url } = (await req.json()) as { url?: string };
  if (!url || !url.trim()) {
    return NextResponse.json({ ok: false, reason: "No URL provided." }, { status: 400 });
  }
  const result = await fetchJD(url.trim());
  return NextResponse.json(result);
}
