begin;

select plan(36);

insert into auth.users (id, email, role, aud, email_confirmed_at, created_at, updated_at)
values
  (
    '00000000-0000-4000-8000-000000000001',
    'household-owner@example.test',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000002',
    'household-member@example.test',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000003',
    'household-outsider@example.test',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000004',
    'setup-owner@example.test',
    'authenticated',
    'authenticated',
    now(),
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$select public.create_household_with_owner('Phase 3 Household')$$,
  'authenticated user can create their first household as owner'
);

select set_config(
  'test.phase_three_household_id',
  (
    select id::text
    from public.households
    where owner_id = '00000000-0000-4000-8000-000000000001'
  ),
  true
);

select lives_ok(
  $$
    insert into public.household_invites (household_id, token, created_by)
    select id, 'phase-three-token-001', '00000000-0000-4000-8000-000000000001'
    from public.households
    where owner_id = '00000000-0000-4000-8000-000000000001'
  $$,
  'owner can create an active invite'
);

select throws_ok(
  $$
    insert into public.household_invites (household_id, token, created_by)
    select id, 'phase-three-token-002', '00000000-0000-4000-8000-000000000001'
    from public.households
    where owner_id = '00000000-0000-4000-8000-000000000001'
  $$,
  '23505',
  'duplicate key value violates unique constraint "household_invites_one_active_per_household_idx"',
  'one active invite per household is enforced'
);

select is(
  (
    select token
    from public.create_or_get_active_invite(
      (
        select id
        from public.households
        where owner_id = '00000000-0000-4000-8000-000000000001'
      ),
      'phase-three-token-004'
    )
  ),
  'phase-three-token-001',
  'owner create-or-get returns the existing active invite'
);

select is(
  (
    select token
    from public.disable_active_invite(
      (
        select id
        from public.households
        where owner_id = '00000000-0000-4000-8000-000000000001'
      )
    )
  ),
  'phase-three-token-001',
  'owner can disable the current active invite'
);

select is(
  (select count(*) from public.fetch_active_invite_by_token('phase-three-token-001')),
  0::bigint,
  'disabled invite is no longer returned from the active invite lookup'
);

select is(
  (
    select token
    from public.create_or_get_active_invite(
      (
        select id
        from public.households
        where owner_id = '00000000-0000-4000-8000-000000000001'
      ),
      'phase-three-token-004'
    )
  ),
  'phase-three-token-004',
  'owner can create a new active invite after disabling the previous one'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is(
  (select token from public.fetch_active_invite_by_token('phase-three-token-004')),
  'phase-three-token-004',
  'authenticated invitee can look up an active invite before joining'
);

select lives_ok(
  $$select public.join_household_with_invite('phase-three-token-004')$$,
  'authenticated invitee can join through an active invite'
);

select throws_ok(
  $$select public.join_household_with_invite('phase-three-token-004')$$,
  '23505',
  'duplicate key value violates unique constraint "household_members_user_id_key"',
  'one-household-per-user is enforced during join'
);

select is(
  (select count(*) from public.households),
  1::bigint,
  'member can read their household'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    select public.create_or_get_active_invite(
      current_setting('test.phase_three_household_id')::uuid,
      'phase-three-token-005'
    )
  $$,
  'P0001',
  'Only household owners can manage invites',
  'non-owner cannot create or reuse an active invite'
);

select throws_ok(
  $$
    select public.disable_active_invite(
      current_setting('test.phase_three_household_id')::uuid
    )
  $$,
  'P0001',
  'Only household owners can manage invites',
  'non-owner cannot disable an active invite'
);

select is(
  (select count(*) from public.households),
  0::bigint,
  'outsider cannot read another household'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    insert into public.chores (household_id, name, weight, created_by)
    select id, 'Take out trash', 3, '00000000-0000-4000-8000-000000000001'
    from public.households
    where owner_id = '00000000-0000-4000-8000-000000000001'
  $$,
  'owner can create chores'
);

select set_config(
  'test.take_out_trash_chore_id',
  (
    select id::text
    from public.chores
    where household_id = current_setting('test.phase_three_household_id')::uuid
      and name = 'Take out trash'
  ),
  true
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000003', true);

select throws_ok(
  $$
    update public.chores
    set
      name = 'Outsider edit attempt',
      weight = 9
    where id = current_setting('test.take_out_trash_chore_id')::uuid
  $$,
  '42501',
  'new row violates row-level security policy for table "chores"',
  'outsider cannot edit chores in another household'
);

select throws_ok(
  $$
    insert into public.chore_completions (household_id, chore_id, completed_by)
    values (
      current_setting('test.phase_three_household_id')::uuid,
      current_setting('test.take_out_trash_chore_id')::uuid,
      '00000000-0000-4000-8000-000000000003'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "chore_completions"',
  'outsider cannot create completion in another household'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select throws_ok(
  $$
    update public.chores
    set
      name = 'Member edit attempt',
      weight = 4
    where id = current_setting('test.take_out_trash_chore_id')::uuid
  $$,
  '42501',
  'new row violates row-level security policy for table "chores"',
  'member cannot edit chores'
);

select throws_ok(
  $$
    insert into public.chores (household_id, name, weight, created_by)
    select id, 'Member chore insert', 1, '00000000-0000-4000-8000-000000000002'
    from public.households
    limit 1
  $$,
  '42501',
  'new row violates row-level security policy for table "chores"',
  'member cannot create chores'
);

select throws_ok(
  $$
    insert into public.household_invites (household_id, token, created_by)
    select id, 'phase-three-token-003', '00000000-0000-4000-8000-000000000002'
    from public.households
    limit 1
  $$,
  '42501',
  'new row violates row-level security policy for table "household_invites"',
  'member cannot create invites'
);

select throws_ok(
  $$
    update public.chores
    set archived_at = now()
    where id = current_setting('test.take_out_trash_chore_id')::uuid
  $$,
  '42501',
  'new row violates row-level security policy for table "chores"',
  'member cannot archive chores'
);

select lives_ok(
  $$
    insert into public.chore_completions (household_id, chore_id, completed_by)
    select c.household_id, c.id, '00000000-0000-4000-8000-000000000002'
    from public.chores c
    where c.name = 'Take out trash'
  $$,
  'member can create own completion'
);

select throws_ok(
  $$
    insert into public.chore_completions (household_id, chore_id, completed_by)
    select c.household_id, c.id, '00000000-0000-4000-8000-000000000001'
    from public.chores c
    where c.name = 'Take out trash'
  $$,
  '42501',
  'new row violates row-level security policy for table "chore_completions"',
  'member cannot create another user completion'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$
    update public.chores
    set
      name = 'Kitchen reset',
      weight = 4
    where id = current_setting('test.take_out_trash_chore_id')::uuid
  $$,
  'owner can edit an active chore'
);

select lives_ok(
  $$
    update public.chores
    set archived_at = now()
    where id = current_setting('test.take_out_trash_chore_id')::uuid
  $$,
  'owner can archive an active chore'
);

select lives_ok(
  $$
    insert into public.chores (household_id, name, weight, created_by)
    select id, 'Kitchen reset', 4, '00000000-0000-4000-8000-000000000001'
    from public.households
    where owner_id = '00000000-0000-4000-8000-000000000001'
  $$,
  'owner can reuse an archived chore name for a replacement chore'
);

select set_config(
  'test.take_out_trash_chore_id',
  (
    select id::text
    from public.chores
    where household_id = current_setting('test.phase_three_household_id')::uuid
      and name = 'Kitchen reset'
      and archived_at is null
  ),
  true
);

select lives_ok(
  $$
    insert into public.chore_completions (household_id, chore_id, completed_by)
    select c.household_id, c.id, '00000000-0000-4000-8000-000000000001'
    from public.chores c
    where c.name = 'Take out trash'
  $$,
  'owner can create own completion'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

update public.chore_completions
set
  undone_at = now(),
  undone_by = '00000000-0000-4000-8000-000000000002'
where completed_by = '00000000-0000-4000-8000-000000000001';

select is(
  (
    select count(*)
    from public.chore_completions
    where completed_by = '00000000-0000-4000-8000-000000000001'
      and undone_at is null
  ),
  1::bigint,
  'member cannot undo another user completion'
);

update public.chore_completions
set
  undone_at = now(),
  undone_by = '00000000-0000-4000-8000-000000000002'
where completed_by = '00000000-0000-4000-8000-000000000002';

select is(
  (
    select count(*)
    from public.chore_completions
    where completed_by = '00000000-0000-4000-8000-000000000002'
      and undone_by = '00000000-0000-4000-8000-000000000002'
      and undone_at is not null
  ),
  1::bigint,
  'member can undo own completion'
);

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000004', true);

select lives_ok(
  $$
    select public.create_household_with_initial_chores(
      'Setup Household',
      jsonb_build_array(
        jsonb_build_object('name', 'Take out trash', 'weight', 3),
        jsonb_build_object('name', 'Vacuum', 'weight', 5)
      )
    )
  $$,
  'authenticated owner can create a household with initial chores atomically'
);

select is(
  (
    select count(*)
    from public.chores c
    inner join public.households h
      on h.id = c.household_id
    where h.owner_id = '00000000-0000-4000-8000-000000000004'
  ),
  2::bigint,
  'setup RPC creates the initial chore rows in the new household'
);

select throws_ok(
  $$
    select public.create_household_with_initial_chores(
      'Broken Setup Household',
      jsonb_build_array(
        jsonb_build_object('name', '  ', 'weight', 1)
      )
    )
  $$,
  'P0001',
  'Chore name is required',
  'setup RPC rejects invalid chore input before leaving partial setup state'
);

select throws_ok(
  $$
    select public.create_household_with_initial_chores(
      'Missing Weight Household',
      jsonb_build_array(
        jsonb_build_object('name', 'Dishes')
      )
    )
  $$,
  'P0001',
  'Chore weight must be a positive integer',
  'setup RPC rejects missing chore weight before leaving partial setup state'
);

select throws_ok(
  $$
    select public.create_household_with_initial_chores(
      'Out Of Range Weight Household',
      jsonb_build_array(
        jsonb_build_object('name', 'Dishes', 'weight', '999999999999999999999999')
      )
    )
  $$,
  'P0001',
  'Chore weight must be a positive integer',
  'setup RPC normalizes out-of-range chore weight to validation failure'
);

select throws_ok(
  $$
    select public.create_household_with_initial_chores(
      repeat('A', 81),
      jsonb_build_array(
        jsonb_build_object('name', 'Dishes', 'weight', 1)
      )
    )
  $$,
  'P0001',
  'Household name must be 80 characters or fewer',
  'setup RPC rejects overlong household names'
);

select throws_ok(
  $$
    select public.create_household_with_initial_chores(
      'Overlong Chore Household',
      jsonb_build_array(
        jsonb_build_object('name', repeat('A', 81), 'weight', 1)
      )
    )
  $$,
  'P0001',
  'Chore name must be 80 characters or fewer',
  'setup RPC rejects overlong chore names'
);

select throws_ok(
  $$
    select public.create_household_with_initial_chores(
      'Too Many Chores Household',
      (
        select jsonb_agg(jsonb_build_object('name', 'Chore ' || item, 'weight', 1))
        from generate_series(1, 21) as item
      )
    )
  $$,
  'P0001',
  'Add no more than 20 chores',
  'setup RPC rejects oversized chore arrays'
);

select * from finish();

rollback;
