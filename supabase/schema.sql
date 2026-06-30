-- ApplyKit — Supabase schema
-- Run this once in the Supabase SQL editor (or via the CLI) for your project.
--
-- Single-user app: the app talks to Supabase only from the server using the
-- SERVICE ROLE key, so Row Level Security is left enabled with no public
-- policies — the service role bypasses RLS, and the anon/public key is never
-- used. Nothing here is reachable from the browser.

-- Experience bank: exactly one row, id = 'singleton'.
create table if not exists public.bank (
  id          text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Application history: one row per tailoring run.
create table if not exists public.history (
  id              uuid primary key,
  created_at      timestamptz not null default now(),
  company         text,
  role            text,
  model           text not null,
  cost_usd        double precision not null default 0,
  cost_aed        double precision not null default 0,
  cv              jsonb not null,
  cover           jsonb not null,
  recruiter_note  jsonb
);

create index if not exists history_created_at_idx
  on public.history (created_at desc);

-- RLS on, no policies → only the service role (server) can read/write.
alter table public.bank    enable row level security;
alter table public.history enable row level security;
