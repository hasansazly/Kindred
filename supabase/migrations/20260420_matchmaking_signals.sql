create extension if not exists pgcrypto;

create table if not exists public.matchmaking_signals (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  signal_type text not null check (
    signal_type in (
      'profile_view',
      'like',
      'pass',
      'message_sent',
      'message_received',
      'spark_answered',
      'date_planned',
      'report'
    )
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists matchmaking_signals_actor_idx on public.matchmaking_signals(actor_user_id, created_at desc);
create index if not exists matchmaking_signals_target_idx on public.matchmaking_signals(target_user_id, created_at desc);
create index if not exists matchmaking_signals_pair_idx on public.matchmaking_signals(actor_user_id, target_user_id, created_at desc);

alter table public.matchmaking_signals enable row level security;

drop policy if exists matchmaking_signals_select_participants on public.matchmaking_signals;
create policy matchmaking_signals_select_participants
on public.matchmaking_signals
for select
to authenticated
using (auth.uid() = actor_user_id or auth.uid() = target_user_id);

drop policy if exists matchmaking_signals_insert_actor on public.matchmaking_signals;
create policy matchmaking_signals_insert_actor
on public.matchmaking_signals
for insert
to authenticated
with check (auth.uid() = actor_user_id);
