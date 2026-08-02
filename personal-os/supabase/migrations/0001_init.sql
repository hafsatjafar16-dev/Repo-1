-- Hechwan OS / practice-management tool — initial schema
-- Run against a Supabase project (EU region recommended — see ../../SETUP.md).

create extension if not exists vector;

create table if not exists entities (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  kind text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists raw_captures (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  source text not null,
  raw_text text,
  audio_url text,
  classification jsonb,
  llm_source text,
  routed_to text,
  routed_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  description text,
  urgency text not null default 'this_week' check (urgency in ('today', 'this_week', 'this_month', 'someday')),
  key boolean not null default false,
  priority_score numeric not null default 0,
  time_estimate_min integer,
  tags text[] not null default '{}',
  due_date date,
  owner text,
  entity_id uuid references entities(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  log_date date not null,
  notes jsonb not null default '{}'::jsonb,
  mood integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);

create table if not exists memory_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  source_type text not null,
  source_id uuid,
  text text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists memory_chunks_embedding_idx
  on memory_chunks using ivfflat (embedding vector_cosine_ops);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table entities enable row level security;
alter table raw_captures enable row level security;
alter table tasks enable row level security;
alter table daily_logs enable row level security;
alter table memory_chunks enable row level security;
alter table audit_log enable row level security;

-- Deny-all by default: the app is single-user and talks to Supabase exclusively
-- via the service role key from server-side API routes, which bypasses RLS.
-- No policies are created, so the anon/authenticated roles get zero access.

-- Cosine-similarity search over memory_chunks, called via supabase-js .rpc().
create or replace function match_memory_chunks(
  query_embedding vector(1536),
  match_user_id text,
  match_count int default 20
)
returns table (
  id uuid,
  source_type text,
  source_id uuid,
  text text,
  created_at timestamptz,
  similarity float
)
language sql stable
as $$
  select
    id,
    source_type,
    source_id,
    text,
    created_at,
    1 - (embedding <=> query_embedding) as similarity
  from memory_chunks
  where user_id = match_user_id
    and embedding is not null
  order by embedding <=> query_embedding
  limit match_count;
$$;
