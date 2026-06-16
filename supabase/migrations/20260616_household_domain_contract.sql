create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) > 0),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (user_id),
  unique (household_id, user_id)
);

create table public.chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  weight integer not null check (weight > 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (household_id, id),
  foreign key (household_id, created_by)
    references public.household_members(household_id, user_id)
    on delete restrict
);

create table public.chore_completions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  chore_id uuid not null,
  completed_by uuid not null references auth.users(id) on delete restrict,
  completed_at timestamptz not null default now(),
  undone_at timestamptz,
  undone_by uuid references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (
    (undone_at is null and undone_by is null)
    or (undone_at is not null and undone_by is not null)
  ),
  unique (household_id, id),
  foreign key (household_id, chore_id)
    references public.chores(household_id, id)
    on delete cascade,
  foreign key (household_id, completed_by)
    references public.household_members(household_id, user_id)
    on delete restrict,
  foreign key (household_id, undone_by)
    references public.household_members(household_id, user_id)
    on delete restrict
);

create table public.household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  token text not null unique check (length(btrim(token)) >= 16),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  disabled_at timestamptz,
  foreign key (household_id, created_by)
    references public.household_members(household_id, user_id)
    on delete restrict
);

create unique index household_members_owner_per_household_idx
  on public.household_members(household_id)
  where role = 'owner';

create unique index household_invites_one_active_per_household_idx
  on public.household_invites(household_id)
  where disabled_at is null;

create index household_members_household_id_idx
  on public.household_members(household_id);

create index chores_household_id_idx
  on public.chores(household_id);

create index chore_completions_household_completed_at_idx
  on public.chore_completions(household_id, completed_at desc);

create index chore_completions_active_household_completed_at_idx
  on public.chore_completions(household_id, completed_at desc)
  where undone_at is null;

create index household_invites_active_token_idx
  on public.household_invites(token)
  where disabled_at is null;

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.chores enable row level security;
alter table public.chore_completions enable row level security;
alter table public.household_invites enable row level security;

create function public.is_household_member(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
  );
$$;

create function public.is_household_owner(target_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = target_household_id
      and hm.user_id = auth.uid()
      and hm.role = 'owner'
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
revoke all on function public.is_household_owner(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;
grant execute on function public.is_household_owner(uuid) to authenticated;

create policy "Members can read their household"
  on public.households
  for select
  to authenticated
  using (public.is_household_member(id));

create policy "Members can read household membership"
  on public.household_members
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy "Members can read household chores"
  on public.chores
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy "Owners can create household chores"
  on public.chores
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and public.is_household_owner(household_id)
  );

create policy "Members can read household completions"
  on public.chore_completions
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy "Members can create own completions"
  on public.chore_completions
  for insert
  to authenticated
  with check (
    completed_by = auth.uid()
    and undone_at is null
    and undone_by is null
    and public.is_household_member(household_id)
  );

create policy "Members can undo own completions"
  on public.chore_completions
  for update
  to authenticated
  using (
    completed_by = auth.uid()
    and undone_at is null
    and public.is_household_member(household_id)
  )
  with check (
    completed_by = auth.uid()
    and undone_by = auth.uid()
    and undone_at is not null
    and public.is_household_member(household_id)
  );

create policy "Members can read household invites"
  on public.household_invites
  for select
  to authenticated
  using (public.is_household_member(household_id));

create policy "Owners can create household invites"
  on public.household_invites
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and disabled_at is null
    and public.is_household_owner(household_id)
  );

create policy "Owners can disable household invites"
  on public.household_invites
  for update
  to authenticated
  using (
    disabled_at is null
    and public.is_household_owner(household_id)
  )
  with check (
    disabled_at is not null
    and public.is_household_owner(household_id)
  );

create function public.create_household_with_owner(household_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_household_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if length(btrim(household_name)) = 0 then
    raise exception 'Household name is required';
  end if;

  insert into public.households (name, owner_id)
  values (btrim(household_name), current_user_id)
  returning id into new_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (new_household_id, current_user_id, 'owner');

  return new_household_id;
end;
$$;

create function public.join_household_with_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  target_household_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  select hi.household_id
  into target_household_id
  from public.household_invites hi
  where hi.token = btrim(invite_token)
    and hi.disabled_at is null;

  if target_household_id is null then
    raise exception 'Invite is invalid or disabled';
  end if;

  insert into public.household_members (household_id, user_id, role)
  values (target_household_id, current_user_id, 'member');

  return target_household_id;
end;
$$;

revoke all on function public.create_household_with_owner(text) from public;
revoke all on function public.join_household_with_invite(text) from public;
grant execute on function public.create_household_with_owner(text) to authenticated;
grant execute on function public.join_household_with_invite(text) to authenticated;
