# Household Domain Contract Implementation Plan

## Overview

Implement the F-01 foundation from `context/foundation/roadmap.md`: the smallest shared household domain contract needed before the owner setup, invite, completion, and dashboard slices can be planned safely. This change establishes the database schema, RLS rules, TypeScript domain contracts, score calculation, and verification surface without building the user-facing product flows.

## Current State Analysis

The project already has Astro server routes, Supabase SSR auth, protected-route middleware, and Cloudflare Workers configuration. It does not yet have any household, invite, chore, completion, score, migration, or domain test surface.

## Desired End State

After this plan is complete, the repo has a concrete contract for household ownership, membership, chore weights, completion ownership, rolling two-week score calculation, invite disabling, and household-only visibility. Future slices can build UI/API flows on top of named tables, TypeScript types, server-side helper contracts, and tests instead of inventing their own domain rules.

### Key Discoveries:

- `context/foundation/roadmap.md:45` defines F-01 as the household domain contract foundation, and `context/foundation/roadmap.md:61` warns against growing it into a full backend build.
- `context/foundation/prd.md:98` through `context/foundation/prd.md:112` name the required household, chore, completion, history, and score capabilities.
- `context/foundation/shape-notes.md` records accepted product decisions: owner/member roles, one household per user for MVP, self-completion only, undo own completion, stable chore weights, and a two-week score window.
- `src/lib/supabase.ts:5` provides the server-side Supabase client factory used by middleware and auth API routes.
- `src/middleware.ts:4` protects only `/dashboard` today; future household routes will need to extend this boundary.
- `package.json:5` exposes `build`, `lint`, and `sync:ai-rules`, but no unit or database test script exists yet.
- `supabase/` currently contains `config.toml` only, so this change creates the first product-specific migration/test surface.

## What We're NOT Doing

- No household setup UI, invite UI, completion UI, or dashboard UI.
- No full API route set for the later roadmap slices.
- No member removal, multi-household support, chore weight editing, historical analytics, templates, gamification, notifications, or expected-frequency model.
- No service-role bypass path in application code; household data access stays scoped to the authenticated user and RLS.
- No score ranking language or winner/loser framing.

## Implementation Approach

Build the contract from the data layer upward. First, define the Supabase schema, constraints, indexes, and RLS policies that make the MVP rules enforceable. Then add a small TypeScript domain layer that names the model, calculates Fairness Score, and provides server-only helper boundaries for future routes. Finally, add the minimum automated verification surface so score behavior and access rules can be checked before product slices start depending on them.

## Critical Implementation Details

### Security Model

RLS is part of the contract, not an optional hardening pass. Application checks may improve user-facing errors later, but table policies must prevent cross-household reads and unauthorized writes even if a future API route is implemented incorrectly.

### Score Window

Fairness Score uses a rolling two-week window based on completion timestamps and excludes rows where `undone_at` is not null. The TypeScript function must accept an explicit `now` argument so tests can pin the boundary exactly instead of depending on wall-clock time.

## Phase 1: Database Domain Contract

### Overview

Create the Supabase schema and RLS policies that encode the MVP household rules.

### Changes Required:

#### 1. Household migration

**File**: `supabase/migrations/20260616_household_domain_contract.sql`

**Intent**: Add the canonical tables for households, household membership, chores, completions, and invites. The schema should be small enough for MVP, but complete enough to unblock `S-01` through `S-04`.

**Contract**: Create `households`, `household_members`, `chores`, `chore_completions`, and `household_invites`. Include UUID primary keys, `created_at` timestamps, foreign keys, role constraints, positive chore weight constraints, `undone_at` for completion undo, and the MVP one-household-per-user uniqueness constraint on `household_members.user_id`.

#### 2. Invite constraints

**File**: `supabase/migrations/20260616_household_domain_contract.sql`

**Intent**: Encode the selected invite model: one active token per household that remains valid until the owner disables it.

**Contract**: `household_invites` stores `household_id`, unique `token`, `created_by`, `created_at`, and nullable `disabled_at`. Add a partial unique index so each household has at most one active invite where `disabled_at is null`.

#### 3. Completion ownership constraints

**File**: `supabase/migrations/20260616_household_domain_contract.sql`

**Intent**: Store completion events in a way that supports self-completion, own undo, history explanation, and score calculation without deleting evidence.

**Contract**: `chore_completions` references `chores`, `households`, and the completing member user id. It keeps `completed_at`, nullable `undone_at`, and nullable `undone_by`, with indexes for household + completion window queries and active completions.

#### 4. RLS policies

**File**: `supabase/migrations/20260616_household_domain_contract.sql`

**Intent**: Make household-only visibility and role-limited writes enforceable in the database.

**Contract**: Enable RLS on all domain tables. Policies allow household members to read their household data, owners to create chores and manage invites, members to create completions only for themselves, and members to undo only their own completions. Use `auth.uid()` and membership subqueries rather than trusting client-supplied role claims.

**Policy note**: Avoid recursive RLS on `household_members`. Policies on the membership table itself should use direct `auth.uid() = user_id` checks where possible, or a reviewed non-recursive helper/security-definer pattern when cross-member household checks are required. Cross-table policies may use membership lookups only when the referenced policy path does not recurse back into the same table.

#### 5. Bootstrap access contracts

**File**: `supabase/migrations/20260616_household_domain_contract.sql`

**Intent**: Define the RLS-safe entry points for users before they have a household membership row.

**Contract**: Add explicit database contracts for creating the first household with the authenticated user as `owner`, and for joining a household through an active invite while enforcing the one-household-per-user rule. These contracts may be narrowly scoped RLS policies, SQL functions, or RPC-friendly functions, but they must not require service-role credentials and must not allow a user to create or join on behalf of another user.

### Success Criteria:

#### Automated Verification:

- Migration file exists under `supabase/migrations/` and defines all five F-01 tables.
- Migration applies cleanly in a local Supabase database with `npx supabase db reset`.
- RLS smoke checks pass for member-only visibility, owner-only chore/invite writes, self-completion, and own undo.
- Bootstrap smoke checks pass for first-household owner creation and invite-based join without service-role access.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Review the migration and confirm it encodes the agreed MVP constraints: one household per user, one active invite per household, stable chore weight storage, soft undo, and household-only visibility.
- Confirm F-01 did not introduce user-facing UI scope.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: TypeScript Domain Layer

### Overview

Create the server-side TypeScript contract that future Astro API routes and pages can reuse.

### Changes Required:

#### 1. Domain types and constants

**File**: `src/lib/household/types.ts`

**Intent**: Give future slices stable names for household roles, chore weights, completion records, invite state, and score output.

**Contract**: Export types for `HouseholdRole`, `Household`, `HouseholdMember`, `Chore`, `ChoreCompletion`, `HouseholdInvite`, `FairnessScoreMember`, and `FairnessScoreResult`. Export constants for owner/member role values and the two-week score window.

#### 2. Fairness Score calculator

**File**: `src/lib/household/score.ts`

**Intent**: Implement the selected score contract in testable TypeScript: each member's percentage share of active completed chore points in the rolling two-week window.

**Contract**: Export `calculateFairnessScore(input, now)` or equivalent. It must ignore completions outside the window, ignore completions with `undone_at`, sum point weights per completing member, return raw points and exact percentage values, and handle the zero-total case without divide-by-zero output.

#### 3. Server-side household data boundary

**File**: `src/lib/household/repository.ts`

**Intent**: Provide thin, server-only helper contracts over the existing Supabase SSR client pattern so later routes do not repeat table names or RLS assumptions.

**Contract**: Export functions for the minimum future-facing operations: create the current user's first household owner record through the Phase 1 bootstrap contract, join the current user through an active invite, get current user's household membership, list household chores, list active recent completions for score/history, and fetch active invite by token. These helpers accept a Supabase client returned by `createClient()` and return typed results without using service-role credentials.

#### 4. Contract surface registry

**File**: `docs/reference/contract-surfaces.md`

**Intent**: Record load-bearing table names, role names, helper names, and score invariants so future changes do not accidentally rename or reinterpret the domain contract.

**Contract**: Create the `docs/reference/` folder if needed and document F-01 surfaces: table names, role literals, key constraints, score window, soft undo field, invite token rule, and repository helper names.

#### 5. Unit test setup

**File**: `package.json`

**Intent**: Add a lightweight unit test path for pure TypeScript domain logic while introducing the score contract.

**Contract**: Add a dev dependency such as `vitest` and a script such as `test:unit` that runs domain tests. Keep existing `lint` and `build` scripts unchanged.

#### 6. Score tests

**File**: `src/lib/household/score.test.ts`

**Intent**: Prove the score contract directly before UI/API code depends on it.

**Contract**: Cover included completions, completions outside the rolling two-week window, soft-undone completions, multiple members, and the zero-completion case.

### Success Criteria:

#### Automated Verification:

- TypeScript domain files compile through `npm run build`.
- `npm run lint` passes.
- Score unit tests cover two-week filtering, undone completion exclusion, zero-total behavior, and raw point/percentage output.
- Repository helper tests or type checks prove the helpers use the typed table contracts and do not require service-role access.

#### Manual Verification:

- Review `docs/reference/contract-surfaces.md` and confirm it is short, concrete, and aligned with F-01 rather than documenting future UI flows.
- Confirm future slices can identify which helper/table/field to use for household setup, invite join, completion recording, and dashboard scoring.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Verification Contract

### Overview

Add the minimum database verification and implementation log needed to keep the domain contract from drifting.

### Changes Required:

#### 1. Database policy smoke tests

**File**: `supabase/tests/household_domain_contract.sql`

**Intent**: Provide a repeatable check for the RLS contract created in Phase 1.

**Contract**: Seed representative owner/member/outsider identities in the local test context and assert the important allow/deny cases: authenticated user can create their first household as owner, authenticated invitee can join through an active invite, one-household-per-user is enforced during join, member read within household, outsider cannot read, owner can create chores/invites, member cannot create chores, member can create own completion, member cannot create or undo another user's completion.

#### 2. Verification docs

**File**: `context/changes/foundation-household-domain-contract/verification.md`

**Intent**: Record the exact commands and outcomes used while implementing F-01 so later reviewers can distinguish automated checks from manual review.

**Contract**: Document command, result, timestamp, and any known warnings such as the existing Astro sitemap `site` warning if it appears during build.

### Success Criteria:

#### Automated Verification:

- Local database migration and RLS smoke test commands are documented and pass on a local Supabase instance.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Review the test list and confirm it covers the agreed decisions from the planning questions.
- Confirm verification output is recorded in the change folder.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Protected Route Readiness

### Overview

Prepare the integration boundary for later household routes without building those routes now.

### Changes Required:

#### 1. Membership guard contract

**File**: `src/lib/household/guards.ts`

**Intent**: Define reusable guard behavior for future pages and API routes that need a current authenticated household member.

**Contract**: Export a guard helper or typed result shape that distinguishes unauthenticated, missing household membership, wrong role, and allowed access. It should be usable from Astro server routes and pages.

#### 2. Middleware route note

**File**: `src/middleware.ts`

**Intent**: Keep the protected-route boundary visible for future household screens.

**Contract**: Either leave code unchanged with a nearby comment only if useful, or update `PROTECTED_ROUTES` only for real routes introduced in this phase. Do not add nonexistent product routes just to reserve names.

#### 3. Integration handoff note

**File**: `docs/reference/contract-surfaces.md`

**Intent**: Make the handoff to `S-01` through `S-04` explicit.

**Contract**: Add a short "Used by roadmap slices" section mapping `S-01`, `S-02`, `S-03`, and `S-04` to the contract surfaces they should consume.

### Success Criteria:

#### Automated Verification:

- Guard module compiles through `npm run build`.
- `npm run lint` passes.
- No nonexistent route is added to `PROTECTED_ROUTES`.

#### Manual Verification:

- Confirm the guard contract is enough for later slices to distinguish unauthenticated users from authenticated users without a household.
- Confirm no UI route, API flow, or product behavior outside F-01 was implemented.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Testing Strategy

### Unit Tests:

- Test `calculateFairnessScore` with fixed `now` values so the rolling two-week boundary is deterministic.
- Test active vs undone completions.
- Test multiple members, no completions, and exact raw point/percentage output.
- Test guard result shapes if they contain decision logic beyond simple typing.

### Integration Tests:

- Use Supabase local database checks for migration application and RLS allow/deny behavior.
- Keep integration tests focused on the contract, not full UI flows.

### Manual Testing Steps:

1. Read the migration and confirm every PRD access-control rule used by F-01 is represented in either constraints or RLS.
2. Read the score tests and confirm they match the two-week percentage-share definition.
3. Read `docs/reference/contract-surfaces.md` and confirm future roadmap slices can find the canonical contract names.
4. Confirm no user-facing UI scope was added.

## Performance Considerations

The MVP target is small and low-QPS, so the main performance requirement is avoiding obviously inefficient score queries. Add indexes for household membership lookups, active invite lookup, and completion history by `household_id` plus `completed_at`. Keep score calculation in TypeScript for testability; future optimization can move aggregation closer to SQL if data volume grows.

## Migration Notes

This is the first household-specific schema migration, so there is no existing household data to migrate. Rollback during development can drop the new domain tables, but once production data exists, later changes must use additive migrations or explicit data migration steps.

## References

- Roadmap F-01: `context/foundation/roadmap.md:45`
- F-01 scope risk: `context/foundation/roadmap.md:61`
- PRD user stories and requirements: `context/foundation/prd.md:52`, `context/foundation/prd.md:67`, `context/foundation/prd.md:80`, `context/foundation/prd.md:98`
- Product decisions: `context/foundation/shape-notes.md`
- Supabase server client boundary: `src/lib/supabase.ts:5`
- Protected route boundary: `src/middleware.ts:4`
- Existing scripts: `package.json:5`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles.

### Phase 1: Database Domain Contract

#### Automated

- [x] 1.1 Migration file exists under `supabase/migrations/` and defines all five F-01 tables.
- [x] 1.2 Migration applies cleanly in a local Supabase database with `npx supabase db reset`.
- [x] 1.3 RLS smoke checks pass for member-only visibility, owner-only chore/invite writes, self-completion, and own undo.
- [x] 1.4 Bootstrap smoke checks pass for first-household owner creation and invite-based join without service-role access.
- [x] 1.5 `npm run lint` passes.
- [x] 1.6 `npm run build` passes.

#### Manual

- [x] 1.7 Review migration against agreed MVP constraints.
- [x] 1.8 Confirm F-01 did not introduce user-facing UI scope.

### Phase 2: TypeScript Domain Layer

#### Automated

- [ ] 2.1 TypeScript domain files compile through `npm run build`.
- [ ] 2.2 `npm run lint` passes.
- [ ] 2.3 Score unit tests cover two-week filtering, undone completion exclusion, zero-total behavior, and raw point/percentage output.
- [ ] 2.4 Repository helper tests or type checks prove helpers use typed table contracts and do not require service-role access.
- [ ] 2.5 `npm run test:unit` passes.

#### Manual

- [ ] 2.6 Review `docs/reference/contract-surfaces.md` for concise F-01 alignment.
- [ ] 2.7 Confirm future slices can identify the correct helper, table, and field names.

### Phase 3: Verification Contract

#### Automated

- [ ] 3.1 Local database migration and RLS smoke test commands are documented and pass on a local Supabase instance.
- [ ] 3.2 `npm run lint` passes.
- [ ] 3.3 `npm run build` passes.

#### Manual

- [ ] 3.5 Review the test list against the agreed planning decisions.
- [ ] 3.6 Confirm verification output is recorded in the change folder.

### Phase 4: Protected Route Readiness

#### Automated

- [ ] 4.1 Guard module compiles through `npm run build`.
- [ ] 4.2 `npm run lint` passes.
- [ ] 4.3 No nonexistent route is added to `PROTECTED_ROUTES`.

#### Manual

- [ ] 4.4 Confirm the guard contract distinguishes unauthenticated users from authenticated users without a household.
- [ ] 4.5 Confirm no UI route, API flow, or product behavior outside F-01 was implemented.
