-- Storage bucket + RLS for chat photo messages.

insert into storage.buckets (id, name, public)
values ('message-photos', 'message-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "message_photos_public_read" on storage.objects;
create policy "message_photos_public_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'message-photos'
  and split_part(name, '/', 1) = 'messages'
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id::text = split_part(name, '/', 2)
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "message_photos_insert_participant" on storage.objects;
create policy "message_photos_insert_participant"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'message-photos'
  and split_part(name, '/', 1) = 'messages'
  and split_part(name, '/', 3) = auth.uid()::text
  and exists (
    select 1
    from public.conversation_participants cp
    where cp.conversation_id::text = split_part(name, '/', 2)
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "message_photos_update_own" on storage.objects;
create policy "message_photos_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'message-photos'
  and split_part(name, '/', 1) = 'messages'
  and split_part(name, '/', 3) = auth.uid()::text
)
with check (
  bucket_id = 'message-photos'
  and split_part(name, '/', 1) = 'messages'
  and split_part(name, '/', 3) = auth.uid()::text
);

drop policy if exists "message_photos_delete_own" on storage.objects;
create policy "message_photos_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'message-photos'
  and split_part(name, '/', 1) = 'messages'
  and split_part(name, '/', 3) = auth.uid()::text
);
