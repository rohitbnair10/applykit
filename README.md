# ApplyKit

Single-user web app that tailors my CV and cover letter to a specific job
description, in my established format, downloadable as PDF and Word. Phone-first.

## Stack

- **Next.js (App Router) + TypeScript**, deployed to Vercel (target).
- **Anthropic API** for tailoring (Phase 2): Sonnet `claude-sonnet-4-6` default,
  optional Opus `claude-opus-4-8` per-run toggle. Key server-side only.
- **Storage**: Supabase (single-row `bank` table + `history` table). Dev fallback
  to a local JSON file (`.data/bank.json`) when Supabase env vars are absent.
- **Docs**: `.docx` via the `docx` library; PDF via headless Chromium
  (`@sparticuz/chromium` on Vercel, Playwright's Chromium locally).

## Two known hard spots (flagged early)

1. **PDF on Vercel serverless** — LibreOffice can't run there, so we generate the
   PDF from HTML/CSS with headless Chromium (`@sparticuz/chromium`). The `.docx`
   is produced separately with the `docx` JS lib, kept visually matched.
2. **One-page auto-fit** — `src/lib/docgen/pdf.ts` renders the sheet, measures
   content height vs. the printable page height, and binary-searches a `--fit`
   multiplier so the document fills one page without spilling to a second.
   `pageRanges: "1"` is a hard backstop. The cover letter scales up only to a
   comfortable cap (it doesn't stretch huge text to fill whitespace).

## Phases

- **Phase 1 (done)** — Experience bank (seeded, editable in a mobile UI) +
  document generator producing one-page CV & cover letter as PDF + Word.
- **Phase 2** — JD intake + Anthropic tailoring call returning structured JSON.
- **Phase 3** — Vercel deploy, password gate, application history.
- **Phase 4** — Live-project idea, hiring-manager email guess, cost meter, Opus toggle.

## Local dev

```bash
npm install
npm run dev        # http://localhost:3000
npm run sample     # render sample CV/cover into ./sample-output (PDF, DOCX, HTML)
```

Copy `.env.example` to `.env.local` and fill in values as phases require. With no
Supabase vars set, the bank reads/writes `.data/bank.json` locally.

## Project layout

```
src/
  app/
    page.tsx            Home — generate & download
    bank/page.tsx       Mobile bank editor
    api/bank/route.ts   GET/PUT the experience bank
    api/generate/route.ts  GET a single CV/cover PDF or DOCX
  lib/
    types.ts            Data model (bank + resolved documents)
    seed.ts             Seeded bank (from current CV)
    storage.ts          Supabase + local-file fallback
    compose.ts          Phase-1 deterministic bank → document resolution
    docgen/             styles, cvHtml, coverHtml, pdf (Chromium), docx
scripts/sample.ts       Local sample renderer
```

## Security note

Pinned to `next@14.2.x` (latest patch) — the original critical advisory is
fixed. Two remaining audit findings (next/image DoS variants, request-smuggling
in rewrites, a build-time postcss issue) only clear via a Next 16 major upgrade
and are not exploitable here: no `next/image` usage, no rewrites, single-user
behind a password gate. Revisit if we adopt those features.
