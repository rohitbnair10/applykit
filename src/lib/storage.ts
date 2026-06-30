import { promises as fs } from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { ExperienceBank } from "./types";
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
