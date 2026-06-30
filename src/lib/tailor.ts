import type {
  ExperienceBank,
  TailorModelOutput,
  TailorResult,
  CVDocument,
  CoverLetter,
} from "./types";
import {
  getAnthropic,
  MODELS,
  ModelChoice,
  costUSD,
  costAED,
} from "./anthropic";

// ---------------------------------------------------------------------------
// Tailoring engine: one Anthropic call given the master bank + JD, returning
// structured JSON. We instruct the model to emit JSON and parse it defensively
// (Sonnet 4.6 isn't in the structured-outputs model list, so we don't rely on
// output_config.format — one code path works for both models).
// ---------------------------------------------------------------------------

const SYSTEM = `You are a critical, experienced technical recruiter and resume writer helping a single candidate tailor a one-page CV and one-page cover letter to a specific job description (JD).

Your job:
1. Select and REFRAME the candidate's existing bullet points so they mirror the JD's language, priorities, and success metrics. Never invent experience, employers, dates, or metrics that aren't in the candidate's bank — you may rephrase and re-emphasize only.
2. Choose the most shortlist-relevant subset of content so each document fits on ONE page. Prefer fewer, sharper, metrics-first bullets over many weak ones. Lead bullets with quantified outcomes.
3. Pick a role-specific professional summary.
4. Select the most relevant skills, grouped.
5. Write a matching cover letter (3-4 tight paragraphs) that connects the candidate's proven results to what THIS JD asks for.
6. Act as a blunt recruiter: surface the gaps, framing mismatches, and seniority flags that would most affect a shortlist decision (e.g. a years-of-experience mismatch).

Hard rules:
- Output ONLY a single JSON object, no markdown fences, no commentary before or after.
- Keep every bullet truthful to the candidate's bank. Reframe wording; do not fabricate.
- Metrics-first: where a bullet has a number, lead with it.
- The CV must be tight enough for one page: aim for the strongest 4-5 bullets on the most recent/relevant role and 2 on older ones.`;

function buildUserPrompt(bank: ExperienceBank, jd: string, company: string, role: string): string {
  return `JOB DESCRIPTION${company ? ` (company: ${company})` : ""}${role ? ` (role: ${role})` : ""}:
"""
${jd.trim()}
"""

CANDIDATE EXPERIENCE BANK (JSON — the full pool to select and reframe from):
"""
${JSON.stringify(
  {
    summaryTemplates: bank.summaryTemplates.map((s) => s.text),
    roles: bank.roles.map((r) => ({
      company: r.company,
      title: r.title,
      location: r.location,
      dates: r.dates,
      bulletPool: r.bullets.map((b) => b.text),
    })),
    skills: bank.skills,
    sideProjects: bank.sideProjects,
    education: bank.education,
  },
  null,
  2
)}
"""

Return a JSON object with EXACTLY this shape:
{
  "summary": "string — role-specific professional summary, 1-2 sentences",
  "cvRoles": [
    {
      "company": "string (must match a bank role)",
      "title": "string",
      "location": "string",
      "dates": "string",
      "bullets": ["reframed bullet", "..."]
    }
  ],
  "skills": [ { "group": "string", "items": ["string", "..."] } ],
  "coverLetter": {
    "greeting": "e.g. Dear Hiring Manager,",
    "paragraphs": ["para 1", "para 2", "para 3"],
    "signoff": "e.g. Sincerely,"
  },
  "recruiterNote": {
    "summary": "1-2 sentence shortlist verdict",
    "gaps": ["string", "..."],
    "framingMismatches": ["string", "..."],
    "seniorityFlags": ["string", "..."]
  }
}

Keep cvRoles in the same chronological order as the bank (most recent first), include all real roles, but trim bullets so the whole CV fits one page.`;
}

// Robustly pull a JSON object out of model text (strips ``` fences, finds the
// outermost balanced braces).
function extractJSON(text: string): string {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model did not return JSON.");
  }
  return t.slice(start, end + 1);
}

function todayLong(): string {
  return new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function assemble(
  out: TailorModelOutput,
  bank: ExperienceBank,
  company: string,
  role: string
): { cv: CVDocument; cover: CoverLetter } {
  const cv: CVDocument = {
    header: bank.header,
    summary: out.summary,
    roles: out.cvRoles.map((r) => ({
      company: r.company,
      title: r.title,
      location: r.location,
      dates: r.dates,
      bullets: r.bullets,
    })),
    skills: out.skills,
    // Side projects + education come straight from the bank (not the model).
    sideProjects: bank.sideProjects.map((p) => ({ name: p.name, description: p.description })),
    education: bank.education,
  };

  const cover: CoverLetter = {
    header: bank.header,
    date: todayLong(),
    recipient: "Hiring Manager",
    companyName: company || undefined,
    roleTitle: role || undefined,
    greeting: out.coverLetter.greeting || "Dear Hiring Manager,",
    paragraphs: out.coverLetter.paragraphs,
    signoff: out.coverLetter.signoff || "Sincerely,",
    signatureName: bank.header.name,
  };

  return { cv, cover };
}

export interface TailorArgs {
  bank: ExperienceBank;
  jd: string;
  company: string;
  role: string;
  useOpus: boolean;
  // Per-run output token cap (cost guardrail).
  maxTokens?: number;
}

export async function runTailor(args: TailorArgs): Promise<TailorResult> {
  const { bank, jd, company, role, useOpus } = args;
  const modelChoice: ModelChoice = useOpus ? "opus" : "sonnet";
  const client = getAnthropic();

  const resp = await client.messages.create({
    model: MODELS[modelChoice],
    max_tokens: args.maxTokens ?? 8000,
    system: SYSTEM,
    // Opus pass uses adaptive thinking for quality; Sonnet default keeps cost
    // predictable with thinking off. Neither model accepts budget_tokens.
    thinking: useOpus ? { type: "adaptive" } : { type: "disabled" },
    messages: [{ role: "user", content: buildUserPrompt(bank, jd, company, role) }],
  });

  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  let parsed: TailorModelOutput;
  try {
    parsed = JSON.parse(extractJSON(text)) as TailorModelOutput;
  } catch (e) {
    throw new Error(
      `Couldn't parse the model's response as JSON. ${(e as Error).message}`
    );
  }

  const { cv, cover } = assemble(parsed, bank, company, role);

  const usage = {
    inputTokens: resp.usage.input_tokens,
    outputTokens: resp.usage.output_tokens,
  };

  return {
    cv,
    cover,
    recruiterNote: parsed.recruiterNote,
    model: modelChoice,
    usage,
    costUSD: costUSD(usage, modelChoice),
    costAED: costAED(usage, modelChoice),
  };
}

// Type-only import placed at the bottom to keep the runtime import list clean.
import type Anthropic from "@anthropic-ai/sdk";
