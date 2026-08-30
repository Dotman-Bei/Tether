-- Tether — shared memory layer for the agent-native web
-- Run this in the Supabase SQL editor (or `supabase db push`) before setting
-- NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
--
-- Without these variables Tether falls back to an in-process store, so a fresh
-- clone runs with no configuration at all.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- memories
-- ---------------------------------------------------------------------------

create table if not exists public.memories (
  id          uuid primary key default gen_random_uuid(),
  -- Opaque per-browser session id from the tether_uid cookie. Not a real
  -- account: the MVP has no auth, and this is what scopes one demo from another.
  user_id     text        not null,
  content     text        not null check (char_length(content) between 3 and 400),
  category    text        not null default 'preference'
                check (category in ('preference','workflow','project','constraint','other')),
  tags        text[]      not null default '{}',
  source      text        not null default 'Unknown',
  confidence  numeric(3,2) not null default 0.90 check (confidence >= 0 and confidence <= 1),
  scope       text        not null default 'personal' check (scope in ('personal')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- The dashboard and every retrieval read one session's rows, newest first.
create index if not exists memories_user_created_idx
  on public.memories (user_id, created_at desc);

create index if not exists memories_user_category_idx
  on public.memories (user_id, category);

-- ---------------------------------------------------------------------------
-- activity_events — the WebMCP telemetry stream
-- ---------------------------------------------------------------------------

create table if not exists public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     text        not null,
  channel     text        not null,
  label       text        not null,
  detail      text        not null default '',
  -- 'agent' = a real WebMCP tool call, 'manual' = an on-page control,
  -- 'system' = Tether's own bookkeeping. Kept distinct so the UI never
  -- presents a manual invocation as agent activity.
  origin      text        not null default 'system'
                check (origin in ('agent','manual','system')),
  status      text        not null default 'ok' check (status in ('ok','error','info')),
  created_at  timestamptz not null default now()
);

create index if not exists activity_user_created_idx
  on public.activity_events (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
--
-- Tether reaches Postgres only from server-side route handlers using the
-- service role key, which bypasses RLS. RLS is still enabled so that if an
-- anon key is ever pointed at this project, it reads nothing by default.

alter table public.memories        enable row level security;
alter table public.activity_events enable row level security;

-- No permissive policies are defined on purpose: anon and authenticated roles
-- get zero rows. Add a policy here only alongside real authentication.
