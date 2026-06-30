import { promises as fs } from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ExperienceBank, HistoryEntry } from "./types";
import { SEED_BANK } from "./seed";

// ---------------------------------------------------------------------------
// Storage abstraction.
//
// Production: Supabase (single-row `bank` table keyed id='singleton', plus a
// `history` table in Phase 3). Server-side only via the service-role key.
//
// Dev fallback: when SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are absent we
// read/write a local JSON file so formatting can be verified without a cloud
// project. The file is gitignored.
// ---------------------------------------------------------------------------

const LOCAL_FILE = path.join(process.cwd(), ".data", "bank.json");
const LOCAL_HISTORY = path.join(process.cwd(), ".data", "history.json");
const BANK_ROW_ID = "singleton";

function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readLocal(): Promise<ExperienceBank> {
  try {
    const raw = await fs.readFile(LOCAL_FILE, "utf8");
    return JSON.parse(raw) as ExperienceBank;
  } catch {
    return SEED_BANK;
  }
}

async function writeLocal(bank: ExperienceBank): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true });
  await fs.writeFile(LOCAL_FILE, JSON.stringify(bank, null, 2), "utf8");
}

export async function getBank(): Promise<ExperienceBank> {
  const supabase = getSupabase();
  if (!supabase) return readLocal();

  const { data, error } = await supabase
    .from("bank")
    .select("data")
    .eq("id", BANK_ROW_ID)
    .maybeSingle();

  if (error) throw new Error(`Supabase getBank failed: ${error.message}`);
  if (!data) return SEED_BANK; // first run, before any save
  return data.data as ExperienceBank;
}

export async function saveBank(bank: ExperienceBank): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return writeLocal(bank);

  const { error } = await supabase
    .from("bank")
    .upsert({ id: BANK_ROW_ID, data: bank, updated_at: new Date().toISOString() });

  if (error) throw new Error(`Supabase saveBank failed: ${error.message}`);
}

export function storageMode(): "supabase" | "local" {
  return getSupabase() ? "supabase" : "local";
}

// ---------------------------------------------------------------------------
// Application history
// ---------------------------------------------------------------------------

async function readLocalHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await fs.readFile(LOCAL_HISTORY, "utf8");
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

async function writeLocalHistory(rows: HistoryEntry[]): Promise<void> {
  await fs.mkdir(path.dirname(LOCAL_HISTORY), { recursive: true });
  await fs.writeFile(LOCAL_HISTORY, JSON.stringify(rows, null, 2), "utf8");
}

export async function saveRun(entry: HistoryEntry): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) {
    const rows = await readLocalHistory();
    rows.unshift(entry);
    return writeLocalHistory(rows);
  }
  const { error } = await supabase.from("history").insert({
    id: entry.id,
    created_at: entry.createdAt,
    company: entry.company,
    role: entry.role,
    model: entry.model,
    cost_usd: entry.costUSD,
    cost_aed: entry.costAED,
    cv: entry.cv,
    cover: entry.cover,
    recruiter_note: entry.recruiterNote,
  });
  if (error) throw new Error(`Supabase saveRun failed: ${error.message}`);
}

function rowToEntry(r: Record<string, unknown>): HistoryEntry {
  return {
    id: r.id as string,
    createdAt: r.created_at as string,
    company: (r.company as string) ?? "",
    role: (r.role as string) ?? "",
    model: r.model as "sonnet" | "opus",
    costUSD: Number(r.cost_usd ?? 0),
    costAED: Number(r.cost_aed ?? 0),
    cv: r.cv as HistoryEntry["cv"],
    cover: r.cover as HistoryEntry["cover"],
    recruiterNote: r.recruiter_note as HistoryEntry["recruiterNote"],
  };
}

export async function listRuns(): Promise<HistoryEntry[]> {
  const supabase = getSupabase();
  if (!supabase) return readLocalHistory();
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase listRuns failed: ${error.message}`);
  return (data ?? []).map(rowToEntry);
}

export async function getRun(id: string): Promise<HistoryEntry | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const rows = await readLocalHistory();
    return rows.find((r) => r.id === id) ?? null;
  }
  const { data, error } = await supabase
    .from("history")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Supabase getRun failed: ${error.message}`);
  return data ? rowToEntry(data) : null;
}
