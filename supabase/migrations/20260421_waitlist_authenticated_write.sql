-- Allow authenticated users to create/update their own waitlist row.
-- This keeps waitlist persistence reliable when server routes use user-session auth.

drop policy if exists "Users can insert own waitlist row" on public.matchmaking_waitlist;
create policy "Users can insert own waitlist row"
  on public.matchmaking_waitlist
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own waitlist row" on public.matchmaking_waitlist;
create policy "Users can update own waitlist row"
  on public.matchmaking_waitlist
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
