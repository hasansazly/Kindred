-- Add image message support.

alter table public.messages
  add column if not exists message_type text not null default 'text';

alter table public.messages
  add column if not exists media_url text;

alter table public.messages
  alter column body drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_message_type_check'
      and conrelid = 'public.messages'::regclass
  ) then
    alter table public.messages
      add constraint messages_message_type_check
      check (message_type in ('text', 'image'));
  end if;
end
$$;

alter table public.messages
  drop constraint if exists messages_body_not_empty;

alter table public.messages
  drop constraint if exists messages_content_valid;

alter table public.messages
  add constraint messages_content_valid check (
    (
      message_type = 'text'
      and body is not null
      and length(trim(body)) > 0
      and media_url is null
    )
    or
    (
      message_type = 'image'
      and media_url is not null
      and (body is null or length(trim(body)) = 0)
    )
  );
