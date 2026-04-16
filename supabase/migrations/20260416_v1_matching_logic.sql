-- Vinculo V1 rule-based matching support tables and fields

create extension if not exists "pgcrypto";

-- Profiles: fields needed for hard filters + completeness gating.
alter table public.profiles
  add column if not exists profile_completeness numeric not null default 0,
  add column if not exists relationship_intent text,
  add column if not exists preferred_min_age int,
  add column if not exists preferred_max_age int,
  add column if not exists max_distance_km int,
  add column if not exists gender_preferences text[] not null default '{}',
  add column if not exists dealbreaker_map jsonb not null default '{}'::jsonb,
  add column if not exists photos_count int not null default 0;

-- Safety + feed hygiene.
create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  constraint blocks_not_self check (blocker_user_id <> blocked_user_id),
  constraint blocks_unique_pair unique (blocker_user_id, blocked_user_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint reports_not_self check (reporter_user_id <> reported_user_id)
);

create table if not exists public.matches_shown_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  shown_at timestamptz not null default now(),
  ranking_score int,
  compatibility_score int,
  reasons text[] not null default '{}',
  constraint shown_history_not_self check (user_id <> candidate_user_id)
);

-- Optional manual queue for operators (mutual queue bonus source).
create table if not exists public.daily_match_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  candidate_user_id uuid not null references auth.users(id) on delete cascade,
  queue_date date not null default current_date,
  compatibility_score int,
  ranking_score int,
  explanation text,
  compatibility_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint daily_queue_not_self check (user_id <> candidate_user_id),
  constraint daily_queue_unique unique (user_id, candidate_user_id, queue_date)
);

create index if not exists blocks_blocker_user_id_idx on public.blocks(blocker_user_id);
create index if not exists blocks_blocked_user_id_idx on public.blocks(blocked_user_id);
create index if not exists reports_reporter_user_id_idx on public.reports(reporter_user_id);
create index if not exists reports_reported_user_id_idx on public.reports(reported_user_id);
create index if not exists shown_history_user_id_shown_at_idx on public.matches_shown_history(user_id, shown_at desc);
create index if not exists shown_history_candidate_idx on public.matches_shown_history(candidate_user_id);
create index if not exists daily_match_queue_user_date_idx on public.daily_match_queue(user_id, queue_date);

alter table public.blocks enable row level security;
alter table public.reports enable row level security;
alter table public.matches_shown_history enable row level security;
alter table public.daily_match_queue enable row level security;

drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own"
on public.blocks
for select
using (auth.uid() = blocker_user_id or auth.uid() = blocked_user_id);

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own"
on public.blocks
for insert
with check (auth.uid() = blocker_user_id);

drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
on public.reports
for select
using (auth.uid() = reporter_user_id);

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports
for insert
with check (auth.uid() = reporter_user_id);

drop policy if exists "shown_history_select_own" on public.matches_shown_history;
create policy "shown_history_select_own"
on public.matches_shown_history
for select
using (auth.uid() = user_id);

drop policy if exists "shown_history_insert_own" on public.matches_shown_history;
create policy "shown_history_insert_own"
on public.matches_shown_history
for insert
with check (auth.uid() = user_id);

drop policy if exists "daily_queue_select_own" on public.daily_match_queue;
create policy "daily_queue_select_own"
on public.daily_match_queue
for select
using (auth.uid() = user_id);

drop policy if exists "daily_queue_insert_own" on public.daily_match_queue;
create policy "daily_queue_insert_own"
on public.daily_match_queue
for insert
with check (auth.uid() = user_id);
