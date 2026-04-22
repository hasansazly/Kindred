-- Vinculo IRL Date Track (additive)

create extension if not exists "pgcrypto";

alter table public.matches
add column if not exists irl_unlocked_at timestamptz null default null;

create table if not exists public.irl_readiness (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  ready_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint irl_readiness_unique unique (match_id, user_id)
);

create index if not exists irl_readiness_match_idx on public.irl_readiness(match_id);
create index if not exists irl_readiness_user_idx on public.irl_readiness(user_id);

create table if not exists public.irl_intentions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  revealed_at timestamptz null default null,
  created_at timestamptz not null default now(),
  constraint irl_intentions_unique unique (match_id, user_id)
);

create index if not exists irl_intentions_match_idx on public.irl_intentions(match_id);
create index if not exists irl_intentions_user_idx on public.irl_intentions(user_id);

create table if not exists public.irl_reflections (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  feeling varchar(32) not null check (feeling in ('Spark', 'Friendly', 'Not quite')),
  note text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint irl_reflections_unique unique (match_id, user_id)
);

create index if not exists irl_reflections_match_idx on public.irl_reflections(match_id);
create index if not exists irl_reflections_user_idx on public.irl_reflections(user_id);

alter table public.irl_readiness enable row level security;
alter table public.irl_intentions enable row level security;
alter table public.irl_reflections enable row level security;

drop policy if exists irl_readiness_select_participants on public.irl_readiness;
create policy irl_readiness_select_participants
on public.irl_readiness
for select
to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = irl_readiness.match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  )
);

drop policy if exists irl_readiness_insert_own on public.irl_readiness;
create policy irl_readiness_insert_own
on public.irl_readiness
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = irl_readiness.match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  )
);

drop policy if exists irl_intentions_select_participants on public.irl_intentions;
create policy irl_intentions_select_participants
on public.irl_intentions
for select
to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = irl_intentions.match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  )
);

drop policy if exists irl_intentions_insert_own on public.irl_intentions;
create policy irl_intentions_insert_own
on public.irl_intentions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = irl_intentions.match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  )
);

drop policy if exists irl_intentions_update_own on public.irl_intentions;
create policy irl_intentions_update_own
on public.irl_intentions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists irl_reflections_select_participants on public.irl_reflections;
create policy irl_reflections_select_participants
on public.irl_reflections
for select
to authenticated
using (
  exists (
    select 1
    from public.matches m
    where m.id = irl_reflections.match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  )
);

drop policy if exists irl_reflections_insert_own on public.irl_reflections;
create policy irl_reflections_insert_own
on public.irl_reflections
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.matches m
    where m.id = irl_reflections.match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  )
);

create or replace function public.irl_mark_intentions_revealed(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  is_participant boolean;
  submitted_count int;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and m.status = 'active'
      and (m.user_id = auth.uid() or m.matched_user_id = auth.uid())
  ) into is_participant;

  if not is_participant then
    raise exception 'Forbidden';
  end if;

  select count(*)
  into submitted_count
  from public.irl_intentions ii
  where ii.match_id = p_match_id
    and ii.submitted_at is not null;

  if submitted_count >= 2 then
    update public.irl_intentions
    set revealed_at = coalesce(revealed_at, now())
    where match_id = p_match_id;
  end if;
end;
$$;

revoke all on function public.irl_mark_intentions_revealed(uuid) from public;
grant execute on function public.irl_mark_intentions_revealed(uuid) to authenticated;
