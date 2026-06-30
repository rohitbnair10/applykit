import type { Browser } from "puppeteer-core";
import { PAGE_H, MARGIN_Y } from "./styles";

// ---------------------------------------------------------------------------
// HTML → one-page PDF via headless Chromium.
//
// Local dev:  uses the Playwright-installed Chromium at LOCAL_CHROMIUM.
// Vercel:     uses @sparticuz/chromium (a serverless-friendly build), since
//             LibreOffice cannot run on the serverless runtime.
//
// Auto-fit:   we render the sheet, measure the content height against the
//             available page height, and binary-search a `--fit` multiplier so
//             the document fills the page without spilling onto a second one.
// ---------------------------------------------------------------------------

const LOCAL_CHROMIUM =
  process.env.LOCAL_CHROMIUM_PATH || "/opt/pw-browsers/chromium";

const AVAILABLE_H = PAGE_H - MARGIN_Y * 2; // printable height inside the sheet
// Don't shrink below this (keeps things legible); above 1.0 we'd overflow margins.
const MIN_FIT = 0.7;
const MAX_FIT = 1.18;

async function launch(): Promise<Browser> {
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  const puppeteer = await import("puppeteer-core");

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    }) as unknown as Browser;
  }

  return puppeteer.launch({
    executablePath: LOCAL_CHROMIUM,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  }) as unknown as Browser;
}

/**
 * Find the largest `--fit` in [MIN_FIT, MAX_FIT] whose content fits one page.
 * Measuring is cheap (DOM layout), so a short binary search is plenty.
 */
async function fitToOnePage(page: import("puppeteer-core").Page): Promise<number> {
  const measure = async (fit: number): Promise<number> => {
    return page.evaluate((f) => {
      document.documentElement.style.setProperty("--fit", String(f));
      const content = document.querySelector(".content") as HTMLElement;
      // Force reflow then read.
      void content.offsetHeight;
      return content.getBoundingClientRect().height;
    }, fit);
  };

  // If even MIN_FIT overflows, we still use MIN_FIT (legibility floor) and let
  // it spill — but in practice one page of CV content fits well above the floor.
  let lo = MIN_FIT;
  let hi = MAX_FIT;
  // If natural (1.0) already overflows, search below; else search above to fill.
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    const h = await measure(mid);
    if (h <= AVAILABLE_H) lo = mid;
    else hi = mid;
  }
  const chosen = lo;
  await measure(chosen);
  return chosen;
}

export interface PdfResult {
  buffer: Buffer;
  fit: number;
}

export async function htmlToPdf(html: string): Promise<PdfResult> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    const fit = await fitToOnePage(page);

    const pdf = await page.pdf({
      printBackground: true,
      width: "210mm",
      height: "297mm",
      pageRanges: "1", // hard guarantee of a single page
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    return { buffer: Buffer.from(pdf), fit };
  } finally {
    await browser.close();
  }
}
