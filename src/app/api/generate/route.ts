import { NextRequest } from "next/server";
import { getBank } from "@/lib/storage";
import { composeDefaultCV, composeSampleCover } from "@/lib/compose";
import { cvHtml } from "@/lib/docgen/cvHtml";
import { coverHtml } from "@/lib/docgen/coverHtml";
import { htmlToPdf } from "@/lib/docgen/pdf";
import { buildCvDocx, buildCoverDocx } from "@/lib/docgen/docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // PDF render can take a few seconds on cold start

// Phase 1: generates straight from the seeded/edited bank (no AI yet).
// GET /api/generate?doc=cv|cover&format=pdf|docx  → streams a single file.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const doc = searchParams.get("doc") ?? "cv";
  const format = searchParams.get("format") ?? "pdf";

  if (!["cv", "cover"].includes(doc) || !["pdf", "docx"].includes(format)) {
    return new Response("Bad params", { status: 400 });
  }

  const bank = await getBank();
  const cv = composeDefaultCV(bank);
  const cover = composeSampleCover(bank);

  let buffer: Buffer;
  let contentType: string;
  const base = doc === "cv" ? "Rohit_Nair_CV" : "Rohit_Nair_Cover_Letter";

  if (format === "pdf") {
    const html = doc === "cv" ? cvHtml(cv) : coverHtml(cover);
    const { buffer: pdf } = await htmlToPdf(html);
    buffer = pdf;
    contentType = "application/pdf";
  } else {
    buffer = doc === "cv" ? await buildCvDocx(cv) : await buildCoverDocx(cover);
    contentType =
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }

  const filename = `${base}.${format}`;
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
