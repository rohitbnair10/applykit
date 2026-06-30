import { NextRequest, NextResponse } from "next/server";
import { getBank } from "@/lib/storage";
import { runTailor } from "@/lib/tailor";
import { hasAnthropicKey } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // tailoring (esp. Opus pass) can take a while

// POST { jd, company?, role?, useOpus? } → tailored CV/cover + recruiter note.
export async function POST(req: NextRequest) {
  if (!hasAnthropicKey()) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  const body = (await req.json()) as {
    jd?: string;
    company?: string;
    role?: string;
    useOpus?: boolean;
  };

  if (!body.jd || body.jd.trim().length < 80) {
    return NextResponse.json(
      { error: "Paste a fuller job description (at least a paragraph) to tailor against." },
      { status: 400 }
    );
  }

  try {
    const bank = await getBank();
    const result = await runTailor({
      bank,
      jd: body.jd,
      company: (body.company ?? "").trim(),
      role: (body.role ?? "").trim(),
      useOpus: !!body.useOpus,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
