drop policy if exists couple_date_plans_delete_own on public.couple_date_plans;
create policy couple_date_plans_delete_own
on public.couple_date_plans
for delete
to authenticated
using (
  auth.uid() = created_by_user_id
  and exists (
    select 1
    from public.couples c
    where c.id = couple_date_plans.couple_id
      and c.status = 'confirmed'
      and (auth.uid() = c.user_one_id or auth.uid() = c.user_two_id)
  )
);
