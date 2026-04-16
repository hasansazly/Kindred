-- Vinculo onboarding schema
-- Run in Supabase SQL editor or migration pipeline

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  age int,
  gender text,
  location text,
  occupation text,
  bio text,
  interests text[] not null default '{}',
  core_values text[] not null default '{}',
  lifestyle_tags text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, category)
);

create table if not exists public.match_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  relationship_intent text,
  communication_style text,
  values text[] not null default '{}',
  lifestyle text[] not null default '{}',
  pace text,
  dealbreakers text[] not null default '{}',
  interested_in text[] not null default '{}',
  min_age int not null default 21,
  max_age int not null default 40,
  distance_km int not null default 50,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

drop trigger if exists onboarding_responses_updated_at on public.onboarding_responses;
create trigger onboarding_responses_updated_at
before update on public.onboarding_responses
for each row execute procedure public.handle_updated_at();

drop trigger if exists match_preferences_updated_at on public.match_preferences;
create trigger match_preferences_updated_at
before update on public.match_preferences
for each row execute procedure public.handle_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.match_preferences enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "onboarding_responses_select_own" on public.onboarding_responses;
create policy "onboarding_responses_select_own"
on public.onboarding_responses
for select
using (auth.uid() = user_id);

drop policy if exists "onboarding_responses_insert_own" on public.onboarding_responses;
create policy "onboarding_responses_insert_own"
on public.onboarding_responses
for insert
with check (auth.uid() = user_id);

drop policy if exists "onboarding_responses_update_own" on public.onboarding_responses;
create policy "onboarding_responses_update_own"
on public.onboarding_responses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "match_preferences_select_own" on public.match_preferences;
create policy "match_preferences_select_own"
on public.match_preferences
for select
using (auth.uid() = user_id);

drop policy if exists "match_preferences_insert_own" on public.match_preferences;
create policy "match_preferences_insert_own"
on public.match_preferences
for insert
with check (auth.uid() = user_id);

drop policy if exists "match_preferences_update_own" on public.match_preferences;
create policy "match_preferences_update_own"
on public.match_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
