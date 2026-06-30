alter table public.chores
  add column archived_at timestamptz;

drop index if exists public.chores_household_normalized_name_idx;

create unique index chores_household_active_normalized_name_idx
  on public.chores (household_id, lower(btrim(name)))
  where archived_at is null;

drop policy if exists "Owners can create household chores" on public.chores;

create policy "Owners can create household chores"
  on public.chores
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and archived_at is null
    and public.is_household_owner(household_id)
  );

create policy "Owners can update active household chores"
  on public.chores
  for update
  to authenticated
  using (
    archived_at is null
    and public.is_household_owner(household_id)
  )
  with check (
    public.is_household_owner(household_id)
  );
