-- Repair conversations RLS in case policies drifted or were removed in remote DB.
-- This fixes: "new row violates row-level security policy for table conversations".

alter table public.conversations enable row level security;

drop policy if exists conversations_select_participant on public.conversations;
create policy conversations_select_participant
on public.conversations
for select
to authenticated
using (
  exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = conversations.id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists conversations_insert_owner on public.conversations;
create policy conversations_insert_owner
on public.conversations
for insert
to authenticated
with check (created_by = auth.uid());
