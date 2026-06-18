begin;

select plan(16);

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
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', true);

select lives_ok(
  $$select public.create_household_with_owner('Phase 3 Household')$$,
  'authenticated user can create their first household as owner'
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

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

select is(
  (select token from public.fetch_active_invite_by_token('phase-three-token-001')),
  'phase-three-token-001',
  'authenticated invitee can look up an active invite before joining'
);

select lives_ok(
  $$select public.join_household_with_invite('phase-three-token-001')$$,
  'authenticated invitee can join through an active invite'
);

select throws_ok(
  $$select public.join_household_with_invite('phase-three-token-001')$$,
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

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', true);

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

select * from finish();

rollback;
