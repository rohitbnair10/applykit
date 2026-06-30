import { NextRequest, NextResponse } from "next/server";
import { getRun } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET → a single saved run (full cv/cover/recruiterNote) for re-download.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const run = await getRun(params.id);
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(run);
}
