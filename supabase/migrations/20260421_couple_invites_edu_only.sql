-- Update couple invite insert policy to Temple-only inviters.
-- Only @temple.edu inviters can create invite links; invited partner email remains .edu.

drop policy if exists couple_invites_insert_inviter on public.couple_invites;
create policy couple_invites_insert_inviter
on public.couple_invites
for insert
with check (
  auth.uid() = inviter_user_id
  and lower(coalesce((auth.jwt() ->> 'email'), '')) like '%@temple.edu'
  and lower(trim(partner_email)) like '%.edu'
);
