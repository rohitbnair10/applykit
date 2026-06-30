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
- **Phase 2 (done)** — JD intake (paste + URL readability fetch with LinkedIn
  fallback) + one Anthropic tailoring call (Sonnet 4.6 default, Opus 4.8
  toggle) returning structured JSON → tailored docs + recruiter's-eye note +
  per-run cost meter.
- **Phase 3 (done, pending deploy)** — Single-password gate (middleware),
  application history (Supabase + local fallback), re-downloadable runs,
  month-to-date budget meter. Deploy to Vercel is the collaborative step below.
- **Phase 4** — Live-project idea, hiring-manager email guess, persistent cost
  meter polish.

## Deploy to Vercel (Phase 3)

1. **Supabase** — create a free project, open the SQL editor, and run
   `supabase/schema.sql`. From Project Settings → API, copy the **Project URL**
   and the **service_role** key (server-side only — never the anon key here).
2. **Vercel** — import this GitHub repo as a new project (framework auto-detected
   as Next.js). Add these Environment Variables (Production + Preview):
   - `APP_PASSWORD` — the single password to enter the app.
   - `ANTHROPIC_API_KEY` — your Anthropic key (server-side only).
   - `SUPABASE_URL` — the Supabase project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — the service_role key.
3. **Deploy.** Hosting stays on the free (Hobby) tier — cost = Anthropic API
   only. Note the 60s function limit: Sonnet runs comfortably; a heavy Opus pass
   is the one thing that could approach it.
4. Open the deployment URL on your phone, log in with `APP_PASSWORD`, and tailor.

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
