import { promises as fs } from "fs";
import path from "path";
import { SEED_BANK } from "../src/lib/seed";
import { composeDefaultCV, composeSampleCover } from "../src/lib/compose";
import { cvHtml } from "../src/lib/docgen/cvHtml";
import { coverHtml } from "../src/lib/docgen/coverHtml";
import { htmlToPdf } from "../src/lib/docgen/pdf";
import { buildCvDocx, buildCoverDocx } from "../src/lib/docgen/docx";

async function main() {
  const outDir = path.join(process.cwd(), "sample-output");
  await fs.mkdir(outDir, { recursive: true });

  const cv = composeDefaultCV(SEED_BANK);
  const cover = composeSampleCover(SEED_BANK);

  const cvHtmlStr = cvHtml(cv);
  const coverHtmlStr = coverHtml(cover);
  await fs.writeFile(path.join(outDir, "cv.html"), cvHtmlStr);
  await fs.writeFile(path.join(outDir, "cover.html"), coverHtmlStr);

  console.log("Rendering CV PDF…");
  const cvPdf = await htmlToPdf(cvHtmlStr);
  await fs.writeFile(path.join(outDir, "cv.pdf"), cvPdf.buffer);
  console.log(`  CV fit multiplier: ${cvPdf.fit.toFixed(3)}`);

  console.log("Rendering Cover PDF…");
  const coverPdf = await htmlToPdf(coverHtmlStr);
  await fs.writeFile(path.join(outDir, "cover.pdf"), coverPdf.buffer);
  console.log(`  Cover fit multiplier: ${coverPdf.fit.toFixed(3)}`);

  console.log("Building DOCX…");
  await fs.writeFile(path.join(outDir, "cv.docx"), await buildCvDocx(cv));
  await fs.writeFile(path.join(outDir, "cover.docx"), await buildCoverDocx(cover));

  console.log("Done →", outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
