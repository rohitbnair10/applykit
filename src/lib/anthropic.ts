import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Anthropic client + cost model.
//
// Models are exactly as specified: Sonnet 4.6 is the default; Opus 4.8 is the
// per-run "Opus pass" toggle. The key is read from ANTHROPIC_API_KEY (server
// env only) by the SDK — never referenced in client code, never logged.
// ---------------------------------------------------------------------------

export const MODELS = {
  sonnet: "claude-sonnet-4-6",
  opus: "claude-opus-4-8",
} as const;

export type ModelChoice = "sonnet" | "opus";

// USD per 1,000,000 tokens (input / output). Cache reads/writes are billed
// differently but we don't use prompt caching here, so plain in/out is exact.
export const PRICING: Record<ModelChoice, { input: number; output: number }> = {
  sonnet: { input: 3, output: 15 },
  opus: { input: 5, output: 25 },
};

// Single source of truth for currency. AED is pegged to USD at 3.6725.
export const USD_TO_AED = 3.6725;
export const MONTHLY_BUDGET_AED = 50;

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export function costUSD(usage: Usage, model: ModelChoice): number {
  const p = PRICING[model];
  return (usage.inputTokens / 1e6) * p.input + (usage.outputTokens / 1e6) * p.output;
}

export function costAED(usage: Usage, model: ModelChoice): number {
  return costUSD(usage, model) * USD_TO_AED;
}

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your server env (.env.local locally, or Vercel project env)."
    );
  }
  if (!client) client = new Anthropic();
  return client;
}

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
