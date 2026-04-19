create extension if not exists pgcrypto;

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user_one_id uuid not null references auth.users(id) on delete cascade,
  user_two_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'confirmed' check (status in ('confirmed', 'inactive')),
  match_id uuid null references public.matches(id) on delete set null,
  conversation_id uuid null references public.conversations(id) on delete set null,
  confirmed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint couples_not_self check (user_one_id <> user_two_id),
  constraint couples_pair_order check (user_one_id < user_two_id),
  constraint couples_pair_unique unique (user_one_id, user_two_id)
);

create index if not exists couples_status_idx on public.couples(status);
create index if not exists couples_user_one_idx on public.couples(user_one_id);
create index if not exists couples_user_two_idx on public.couples(user_two_id);
create index if not exists couples_match_idx on public.couples(match_id);
create index if not exists couples_conversation_idx on public.couples(conversation_id);

create table if not exists public.couple_love_notes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 600),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists couple_love_notes_couple_idx on public.couple_love_notes(couple_id, created_at desc);
create index if not exists couple_love_notes_sender_idx on public.couple_love_notes(sender_user_id);

create or replace function public.couples_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists couples_set_updated_at on public.couples;
create trigger couples_set_updated_at
before update on public.couples
for each row execute function public.couples_touch_updated_at();

alter table public.couples enable row level security;
alter table public.couple_love_notes enable row level security;

drop policy if exists couples_select_participants on public.couples;
create policy couples_select_participants
on public.couples
for select
to authenticated
using (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists couples_insert_participants on public.couples;
create policy couples_insert_participants
on public.couples
for insert
to authenticated
with check (
  auth.uid() = user_one_id
  or auth.uid() = user_two_id
);

drop policy if exists couples_update_participants on public.couples;
create policy couples_update_participants
on public.couples
for update
to authenticated
using (auth.uid() = user_one_id or auth.uid() = user_two_id)
with check (auth.uid() = user_one_id or auth.uid() = user_two_id);

drop policy if exists couple_love_notes_select_participants on public.couple_love_notes;
create policy couple_love_notes_select_participants
on public.couple_love_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.couples c
    where c.id = couple_love_notes.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);

drop policy if exists couple_love_notes_insert_sender on public.couple_love_notes;
create policy couple_love_notes_insert_sender
on public.couple_love_notes
for insert
to authenticated
with check (
  auth.uid() = sender_user_id
  and exists (
    select 1
    from public.couples c
    where c.id = couple_love_notes.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);
