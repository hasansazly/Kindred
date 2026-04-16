-- Manual matches table for Vinculo milestone

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  matched_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  explanation text not null default '',
  compatibility_reasons text[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint matches_not_self check (user_id <> matched_user_id),
  constraint matches_user_pair_unique unique (user_id, matched_user_id)
);

create index if not exists matches_user_id_idx on public.matches(user_id);
create index if not exists matches_matched_user_id_idx on public.matches(matched_user_id);
create index if not exists matches_status_idx on public.matches(status);

alter table public.matches enable row level security;

drop policy if exists "matches_select_own" on public.matches;
create policy "matches_select_own"
on public.matches
for select
using (auth.uid() = user_id);

-- Allow reading matched users' basic profile fields when a match exists.
drop policy if exists "profiles_select_matched" on public.profiles;
create policy "profiles_select_matched"
on public.profiles
for select
using (
  exists (
    select 1
    from public.matches m
    where m.user_id = auth.uid()
      and m.matched_user_id = profiles.id
      and m.status = 'active'
  )
);

-- Allow reading matched users' limited onboarding payload for card/detail rendering.
drop policy if exists "onboarding_responses_select_matched_limited" on public.onboarding_responses;
create policy "onboarding_responses_select_matched_limited"
on public.onboarding_responses
for select
using (
  category in ('demographics', 'profile_meta')
  and exists (
    select 1
    from public.matches m
    where m.user_id = auth.uid()
      and m.matched_user_id = onboarding_responses.user_id
      and m.status = 'active'
  )
);
