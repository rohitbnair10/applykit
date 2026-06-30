import { NextResponse } from "next/server";
import { listRuns } from "@/lib/storage";
import { MONTHLY_BUDGET_AED } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET → list of past runs (newest first) + a month-to-date cost total.
export async function GET() {
  const runs = await listRuns();

  const now = new Date();
  const monthSpendAED = runs
    .filter((r) => {
      const d = new Date(r.createdAt);
      return d.getUTCFullYear() === now.getUTCFullYear() && d.getUTCMonth() === now.getUTCMonth();
    })
    .reduce((sum, r) => sum + (r.costAED || 0), 0);

  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      company: r.company,
      role: r.role,
      model: r.model,
      costAED: r.costAED,
      costUSD: r.costUSD,
    })),
    monthSpendAED,
    budgetAED: MONTHLY_BUDGET_AED,
  });
}
