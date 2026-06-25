# F-01 Household Contract Surfaces

This file records the load-bearing names introduced by `foundation-household-domain-contract`. Keep it short and update it only when the contract itself changes.

## Tables

- `households` stores the household name, owner id, and creation timestamp.
- `household_members` stores the one-household-per-user membership row with role `owner` or `member`.
- `chores` stores owner-created chore names and stable positive point weights.
- `chore_completions` stores member completion events, including `undone_at` and `undone_by` for soft undo.
- `household_invites` stores one active invite token per household where `disabled_at is null`.

## Role Literals

- `owner`: can create the household, create chores, create invites, and disable active invites.
- `member`: can view household data, create their own completions, undo their own completions, and view score inputs.

## Database Entry Points

- `create_household_with_owner(household_name text)`: authenticated user creates their first household and owner membership without service-role access.
- `create_household_with_initial_chores(household_name text, chores jsonb)`: authenticated user creates their first household, owner membership, and initial weighted chores in one atomic operation without service-role access.
- `join_household_with_invite(invite_token text)`: authenticated user joins through an active invite as `member` without service-role access.
- `fetch_active_invite_by_token(invite_token text)`: authenticated user reads one active invite by token without requiring existing household membership.

## Repository Helpers

- `createCurrentUserHousehold(supabase, householdName)`
- `createCurrentUserHouseholdSetup(supabase, input)`
- `joinCurrentUserHouseholdByInvite(supabase, inviteToken)`
- `getCurrentUserHouseholdMembership(supabase)`
- `listHouseholdChores(supabase, householdId)`
- `listActiveRecentCompletions(supabase, householdId, windowStart)`
- `fetchActiveInviteByToken(supabase, inviteToken)`

All helpers accept the request-scoped Supabase client created by `src/lib/supabase.ts`. They do not use service-role credentials.

## Guard Helpers

- `requireCurrentHouseholdMember(supabase, options)` returns `unauthenticated`, `missing_membership`, `wrong_role`, `allowed`, or `error`.
- `resolveHouseholdGuard(input)` contains the pure guard decision logic used by tests.
- `requiredRoles` accepts `owner` and/or `member` when a future route needs role-specific access.

## Score Invariants

- Fairness Score uses a rolling 14-day window.
- The score includes only completions with `completed_at` inside the window.
- The score excludes any completion where `undone_at` is not null.
- Each member's percentage is `member raw points / household total active points * 100`.
- When total active points are zero, every member returns `0` percent.
- Raw points remain visible as supporting context for the percentage.

## MVP Constraints

- A user belongs to only one household in the MVP.
- Chore weights are positive and stable after creation.
- Completion attribution is self-only.
- Undo is soft; completion rows are not deleted.
- Household data remains visible only to authenticated members of that household.
- Invite links remain active until the owner disables them.

## Used by Roadmap Slices

- `S-01 Household setup`: use `create_household_with_initial_chores`, `createCurrentUserHouseholdSetup`, `getCurrentUserHouseholdMembership`, `households`, `household_members`, and `chores`.
- `S-02 Invite joining`: use `join_household_with_invite`, `joinCurrentUserHouseholdByInvite`, `fetchActiveInviteByToken`, and `household_invites`.
- `S-03 Chore completion`: use `chores`, `chore_completions`, `getCurrentUserHouseholdMembership`, `listHouseholdChores`, and `requireCurrentHouseholdMember`.
- `S-04 Dashboard scoring`: use `listActiveRecentCompletions`, `calculateFairnessScore`, `SCORE_WINDOW_DAYS`, and the score invariants above.
