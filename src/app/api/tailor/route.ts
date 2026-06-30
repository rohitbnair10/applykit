import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getBank, saveRun } from "@/lib/storage";
import { runTailor } from "@/lib/tailor";
import { hasAnthropicKey } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Hobby (free) caps functions at 60s

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
    const company = (body.company ?? "").trim();
    const role = (body.role ?? "").trim();
    const result = await runTailor({
      bank,
      jd: body.jd,
      company,
      role,
      useOpus: !!body.useOpus,
    });

    // Persist the run so the same role is never re-tailored (re-paid for).
    const id = randomUUID();
    try {
      await saveRun({
        id,
        createdAt: new Date().toISOString(),
        company,
        role,
        model: result.model,
        costUSD: result.costUSD,
        costAED: result.costAED,
        cv: result.cv,
        cover: result.cover,
        recruiterNote: result.recruiterNote,
      });
    } catch (e) {
      // Don't fail the tailor response if history persistence fails.
      console.error("saveRun failed:", (e as Error).message);
    }

    return NextResponse.json({ ...result, id });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
