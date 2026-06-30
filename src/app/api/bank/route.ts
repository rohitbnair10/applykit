import { NextRequest, NextResponse } from "next/server";
import { getBank, saveBank, storageMode } from "@/lib/storage";
import type { ExperienceBank } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const bank = await getBank();
  return NextResponse.json({ bank, storage: storageMode() });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json()) as { bank?: ExperienceBank };
  if (!body?.bank) {
    return NextResponse.json({ error: "Missing bank" }, { status: 400 });
  }
  await saveBank(body.bank);
  return NextResponse.json({ ok: true });
}
