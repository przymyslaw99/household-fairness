# Household Contract Surfaces

This file records load-bearing household domain names introduced across implemented roadmap slices. Keep it short and update it only when a slice adds or changes a reusable contract surface.

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
- `createCurrentUserChoreCompletion(supabase, input)`
- `undoCurrentUserChoreCompletion(supabase, input)`
- `getCurrentUserHouseholdMembership(supabase)`
- `getActiveInviteForHousehold(supabase, householdId)`
- `createActiveInviteForCurrentOwner(supabase, householdId, token)`
- `disableActiveInviteForCurrentOwner(supabase, householdId)`
- `listHouseholdChores(supabase, householdId)`
- `listActiveRecentCompletions(supabase, householdId, windowStart)`
- `fetchActiveInviteByToken(supabase, inviteToken)`

All helpers accept the request-scoped Supabase client created by `src/lib/supabase.ts`. They do not use service-role credentials.

## Guard Helpers

- `requireCurrentHouseholdMember(supabase, options)` returns `unauthenticated`, `missing_membership`, `wrong_role`, `allowed`, or `error`.
- `resolveHouseholdGuard(input)` contains the pure guard decision logic used by tests.
- `resolveJoinRouteAccess(input)` decides whether invite links should send the visitor to auth, show join confirmation, or redirect an existing member away from duplicate join.
- `requiredRoles` accepts `owner` and/or `member` when a future route needs role-specific access.

## Invite Routes

- `/household/invite` is the owner-facing invite management route.
- `/api/household/invite/create` creates or reuses the active invite for the current owner household.
- `/api/household/invite/disable` disables the active invite for the current owner household.
- `/join/[token]` preserves auth redirect state, validates the active invite, and shows explicit join confirmation.
- `/api/household/join` performs the authenticated join write after confirmation.

## Completion Routes

- `/dashboard` shows household chore weights and the active 14-day completion history for members.
- `/api/household/completions` records a completion for the current authenticated household member.
- `/api/household/completions/undo` soft-undoes the current member's own active completion.

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
- `S-03 Chore completion`: use `chores`, `chore_completions`, `createCurrentUserChoreCompletion`, `undoCurrentUserChoreCompletion`, `getCurrentUserHouseholdMembership`, `listHouseholdChores`, `listActiveRecentCompletions`, `requireCurrentHouseholdMember`, `/dashboard`, `/api/household/completions`, and `/api/household/completions/undo`.
- `S-04 Dashboard scoring`: use `listHouseholdMembers`, `buildDashboardScore`, `FairnessSummary.astro`, `listActiveRecentCompletions`, `calculateFairnessScore`, `SCORE_WINDOW_DAYS`, and the score invariants above.
