import { NextRequest } from "next/server";
import { getBank } from "@/lib/storage";
import { composeDefaultCV, composeSampleCover } from "@/lib/compose";
import { cvHtml } from "@/lib/docgen/cvHtml";
import { coverHtml } from "@/lib/docgen/coverHtml";
import { htmlToPdf } from "@/lib/docgen/pdf";
import { buildCvDocx, buildCoverDocx } from "@/lib/docgen/docx";
import type { CVDocument, CoverLetter } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60; // PDF render can take a few seconds on cold start

function filenameFor(doc: string): string {
  return doc === "cv" ? "Rohit_Nair_CV" : "Rohit_Nair_Cover_Letter";
}

async function renderFile(
  doc: "cv" | "cover",
  format: "pdf" | "docx",
  cv: CVDocument,
  cover: CoverLetter
): Promise<{ buffer: Buffer; contentType: string }> {
  if (format === "pdf") {
    const html = doc === "cv" ? cvHtml(cv) : coverHtml(cover);
    const { buffer } = await htmlToPdf(html);
    return { buffer, contentType: "application/pdf" };
  }
  const buffer = doc === "cv" ? await buildCvDocx(cv) : await buildCoverDocx(cover);
  return {
    buffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
}

function fileResponse(buffer: Buffer, contentType: string, doc: string, format: string) {
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filenameFor(doc)}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}

// POST { doc, format, cv, cover } → render a single file from a TAILORED payload
// (Phase 2). The client posts the documents returned by /api/tailor so we don't
// re-run (re-pay for) the model just to download.
export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    doc?: "cv" | "cover";
    format?: "pdf" | "docx";
    cv?: CVDocument;
    cover?: CoverLetter;
  };
  const doc = body.doc ?? "cv";
  const format = body.format ?? "pdf";
  if (!["cv", "cover"].includes(doc) || !["pdf", "docx"].includes(format)) {
    return new Response("Bad params", { status: 400 });
  }
  if ((doc === "cv" && !body.cv) || (doc === "cover" && !body.cover)) {
    return new Response("Missing document payload", { status: 400 });
  }
  const { buffer, contentType } = await renderFile(
    doc,
    format,
    body.cv as CVDocument,
    body.cover as CoverLetter
  );
  return fileResponse(buffer, contentType, doc, format);
}

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

  const { buffer, contentType } = await renderFile(
    doc as "cv" | "cover",
    format as "pdf" | "docx",
    cv,
    cover
  );
  return fileResponse(buffer, contentType, doc, format);
}
