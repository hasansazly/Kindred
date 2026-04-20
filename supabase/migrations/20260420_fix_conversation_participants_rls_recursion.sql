-- Fix recursive RLS evaluation for conversation_participants.
-- The previous policy queried conversation_participants from inside its own USING/WITH CHECK.
-- That can trigger: "infinite recursion detected in policy for relation conversation_participants".

create or replace function public.is_conversation_participant(
  p_conversation_id uuid,
  p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id = p_user_id
  );
$$;

revoke all on function public.is_conversation_participant(uuid, uuid) from public;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;

drop policy if exists conversation_participants_select_visible on public.conversation_participants;
create policy conversation_participants_select_visible
on public.conversation_participants
for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_conversation_participant(conversation_id, auth.uid())
);

drop policy if exists conversation_participants_insert_allowed on public.conversation_participants;
create policy conversation_participants_insert_allowed
on public.conversation_participants
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.conversations c
    where c.id = conversation_participants.conversation_id
      and c.created_by = auth.uid()
  )
  or public.is_conversation_participant(conversation_id, auth.uid())
);
