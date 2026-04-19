create extension if not exists pgcrypto;

create table if not exists public.pre_date_briefings (
  id uuid primary key default gen_random_uuid(),
  pair_key text not null unique,
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid null references public.matches(id) on delete set null,
  briefing jsonb not null,
  provider text not null default 'fallback',
  model text null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists pre_date_briefings_user_one_idx on public.pre_date_briefings(user_one_id);
create index if not exists pre_date_briefings_user_two_idx on public.pre_date_briefings(user_two_id);

alter table public.pre_date_briefings enable row level security;

drop policy if exists pre_date_briefings_select_participants on public.pre_date_briefings;
create policy pre_date_briefings_select_participants on public.pre_date_briefings
for select using (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists pre_date_briefings_insert_participants on public.pre_date_briefings;
create policy pre_date_briefings_insert_participants on public.pre_date_briefings
for insert with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists pre_date_briefings_update_participants on public.pre_date_briefings;
create policy pre_date_briefings_update_participants on public.pre_date_briefings
for update using (auth.uid() = user_one_id or auth.uid() = user_two_id)
with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

create or replace function public.touch_pre_date_briefings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists pre_date_briefings_touch_updated_at on public.pre_date_briefings;
create trigger pre_date_briefings_touch_updated_at
before update on public.pre_date_briefings
for each row execute function public.touch_pre_date_briefings_updated_at();
