# Member Completion Loop Implementation Plan

## Overview

Implement roadmap slice `S-03`: let a household member use `/dashboard` to see visible chore weights, mark a chore as completed for themselves, undo their own active completion from recent history, and see the recent completion history that will feed the later shared Fairness Score dashboard.

## Current State Analysis

The repo already has the F-01 household domain contract: `chores`, `chore_completions`, RLS policies for self-completion and own undo, typed household models, score constants, repository helpers for chores/recent completions, and guard helpers for authenticated household members. `/dashboard` is currently a protected placeholder page, and the existing UI/API pattern uses Astro pages with server-posted React forms and redirect-based query-string errors.

S-01 has a plan for owner setup, but its implementation is not visible in the current source tree. S-02 currently has a change folder but no plan. This S-03 plan therefore treats S-01/S-02 as prerequisites that must leave a real household, at least one weighted chore, and at least one joined member before manual S-03 verification can complete.

## Desired End State

An authenticated household member opens `/dashboard`, sees the household's chore names and point weights, records a completion for themselves with a server POST, and returns to the refreshed dashboard. The dashboard also shows active completions from the rolling 14-day score window, with Undo available only on the current user's active completions. If there are no chores yet, the dashboard shows a clear blocked state explaining that the household owner must add chores first.

### Key Discoveries:

- `context/foundation/roadmap.md` defines `member-completion-loop` as S-03 and scopes it to self-completion, own undo, and recent history.
- `context/foundation/prd.md` defines US-02 plus FR-007, FR-008, and FR-009 as must-have completion capabilities.
- `docs/reference/contract-surfaces.md` maps S-03 to `chores`, `chore_completions`, `getCurrentUserHouseholdMembership`, `listHouseholdChores`, and `requireCurrentHouseholdMember`.
- `src/lib/household/repository.ts` already exposes `listHouseholdChores` and `listActiveRecentCompletions`, but it does not yet expose route-facing helpers to create or undo completions.
- `src/lib/household/guards.ts` already distinguishes unauthenticated, missing-membership, wrong-role, allowed, and error states.
- `src/pages/dashboard.astro` is currently a placeholder protected page, making it the fastest route for S-03 and the natural handoff point for S-04.
- `src/pages/api/auth/signin.ts` and auth forms establish the server POST plus redirect-with-error pattern that S-03 should follow.
- F-01 pgTAP tests already cover the core RLS allow/deny cases for member self-completion and own undo; S-03 should extend that coverage around the route-facing contracts rather than replacing it.

## What We're NOT Doing

- No full Fairness Score dashboard, member percentage comparison, raw-point summary, or neutral score explanation; that remains S-04.
- No invite creation, invite disabling, or invite join UI; that remains S-02.
- No owner chore creation or post-creation chore editing in this slice.
- No member removal, multi-household support, notifications, gamification, templates, expected-frequency model, or historical views outside the current 14-day window.
- No client-side Supabase write path; completion and undo writes stay behind server API handlers.
- No automatic redirects from missing chores into setup, because non-owner members cannot create chores in MVP.

## Implementation Approach

Build S-03 as a server-rendered `/dashboard` flow with small hydrated controls only where useful. Add narrow repository helpers for completion creation and own undo, add pure parsing/validation helpers for form submissions, then replace the dashboard placeholder with data loading and forms that post to API routes. Keep history scoped to active completions in the rolling 14-day window so the list is already aligned with the future S-04 score explanation.

## Critical Implementation Details

### Own Completion And Own Undo

The application should pass only the selected `chore_id` from the browser. The current user and household must be resolved server-side from the request-scoped Supabase client and household guard. `completed_by`, `undone_by`, and `household_id` must not be trusted from submitted form data.

### History Boundary

S-03 history is the active contribution history for the rolling 14-day window. Soft-undone rows remain in `chore_completions` for database history and RLS verification, but the user-facing contribution list should exclude them because they no longer feed the score.

### Prerequisite Reality

Manual verification depends on S-01 and S-02 existing as product flows or on equivalent seeded local data. The implementation should not re-create setup or invite scope just to make S-03 manually testable.

## Phase 1: Completion Domain Contracts

### Overview

Add the route-facing helper contracts for parsing completion submissions, creating current-user completions, undoing current-user completions, and listing dashboard history.

### Changes Required:

#### 1. Completion form helpers

**File**: `src/lib/household/completions.ts`

**Intent**: Centralize small form parsing and validation rules so API handlers do not hand-parse raw `FormData`.

**Contract**: Export input/result types plus pure helpers for reading `chore_id` and `completion_id` from `FormData`. The helpers should trim values, reject missing values, and return user-facing error messages without assuming UUID validation beyond what the database will enforce.

#### 2. Repository create-completion helper

**File**: `src/lib/household/repository.ts`

**Intent**: Give the completion API one typed helper that inserts a completion for the authenticated household member without service-role access.

**Contract**: Export `createCurrentUserChoreCompletion(supabase, input)` or equivalent. It resolves the current authenticated user and membership server-side, inserts into `chore_completions` with `household_id`, `chore_id`, and `completed_by`, and returns `RepositoryResult<Uuid>`. It must not accept `completed_by` from the caller.

#### 3. Repository undo helper

**File**: `src/lib/household/repository.ts`

**Intent**: Give the undo API one typed helper that soft-undoes only the current user's active completion.

**Contract**: Export `undoCurrentUserChoreCompletion(supabase, input)` or equivalent. It resolves the current authenticated user and membership server-side, updates only rows matching `id`, current `household_id`, `completed_by = current user`, and `undone_at is null`, then sets `undone_at` and `undone_by`. Return a repository error when no row was updated.

#### 4. Dashboard history helper

**File**: `src/lib/household/repository.ts`

**Intent**: Keep dashboard data loading explicit and avoid duplicating score-window query logic in the Astro page.

**Contract**: Either reuse `listActiveRecentCompletions(supabase, householdId, windowStart)` directly or add a thin `listDashboardCompletionHistory` helper if the page needs a more presentation-ready shape. The returned rows must include chore name, chore weight, completing user id, and completion timestamp.

#### 5. Completion helper tests

**File**: `src/lib/household/completions.test.ts`

**Intent**: Prove parser behavior without route mocks.

**Contract**: Cover missing `chore_id`, missing `completion_id`, trimmed valid values, and the user-facing message returned on invalid input.

### Success Criteria:

#### Automated Verification:

- Completion form helper tests pass with `npm run test:unit`.
- Existing score and guard tests continue to pass with `npm run test:unit`.
- Repository helper types compile through `npm run build`.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Review repository helpers and confirm they derive `household_id`, `completed_by`, and `undone_by` from authenticated server context rather than request body fields.
- Confirm Phase 1 adds no dashboard UI, invite UI, or score dashboard behavior.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Dashboard Completion UI

### Overview

Replace the placeholder `/dashboard` with the member-facing chore list, completion controls, 14-day history, and empty/error states.

### Changes Required:

#### 1. Dashboard server data loading

**File**: `src/pages/dashboard.astro`

**Intent**: Turn `/dashboard` into the S-03 member screen while preserving its protected-route role.

**Contract**: Create the request-scoped Supabase client, require a current household member, load household chores, compute `windowStart` from `SCORE_WINDOW_DAYS`, and load active recent completions. Read `?error=` and optional success status from the URL and render a user-facing message when present.

**Existing behavior note**: `/dashboard` is linked from `src/components/Topbar.astro`, and the current placeholder includes sign-out UI plus `Astro.locals.user`. Preserve the global authenticated navigation/signout behavior through `Layout`/`Topbar`; do not duplicate it in the dashboard body unless the implementation needs a local action.

#### 2. Missing membership state

**File**: `src/pages/dashboard.astro`

**Intent**: Handle authenticated users who do not yet belong to a household without pretending they can complete chores.

**Contract**: If the guard returns `missing_membership`, show a clear page state that points them to the setup/join prerequisite already owned by S-01/S-02. Do not create household or invite behavior in this slice.

#### 3. No-chores blocked state

**File**: `src/pages/dashboard.astro`

**Intent**: Make the no-chore case understandable for members.

**Contract**: When the household has zero chores, show a blocked state explaining that no chores are available yet and the owner must add chores first. Do not link non-owner users into setup as if they could create chores.

#### 4. Completion form component

**File**: `src/components/household/ChoreCompletionPanel.astro`

**Intent**: Let a member scan chore weights and submit a completion using familiar controls.

**Contract**: Render each chore name and weight with a server-posted form targeting `/api/household/completions`. Each form submits only `chore_id`. Prefer an Astro component because this is static server-posted UI; introduce React only if implementation adds real client-side interactivity such as local validation or pending state. Use shared UI primitives and `cn()` for conditional Tailwind classes. Use lucide icons where they clarify actions.

#### 5. Recent history component

**File**: `src/components/household/CompletionHistory.astro`

**Intent**: Show the contribution events that currently feed the future score and expose own undo actions.

**Contract**: Render active completions from the current 14-day window with chore name, point weight, completing member/user identifier available from the data shape, and completed timestamp. Show an Undo form only when `completed_by` equals the current user id and the completion is active. The form posts only `completion_id` to `/api/household/completions/undo`. Prefer an Astro component because this is static server-posted UI; introduce React only if implementation adds real client-side interactivity.

### Success Criteria:

#### Automated Verification:

- Dashboard and new household components compile through `npm run build`.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Authenticated household member can open `/dashboard` and see chore names plus point weights.
- A household with no chores shows the owner-focused blocked state.
- Recent history shows active completions from the rolling 14-day window.
- Undo controls appear only on the current user's active completions.
- Completion and undo failures display short query-string error messages on return to `/dashboard`.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Completion API Routes

### Overview

Add server POST endpoints for completion creation and own undo using the Phase 1 helpers.

### Changes Required:

#### 1. Create completion endpoint

**File**: `src/pages/api/household/completions.ts`

**Intent**: Accept a server-posted chore completion request and record it for the current authenticated household member.

**Contract**: Accept POST only. Create the request-scoped Supabase client, reject unconfigured Supabase with a redirect to `/dashboard?error=...`, require an authenticated household member, parse `chore_id`, call the repository create helper, and redirect back to `/dashboard` with either a short success state or `?error=...`.

#### 2. Undo completion endpoint

**File**: `src/pages/api/household/completions/undo.ts`

**Intent**: Accept a server-posted undo request and soft-undo only the current user's active completion.

**Contract**: Accept POST only. Create the request-scoped Supabase client, require an authenticated household member, parse `completion_id`, call the repository undo helper, and redirect back to `/dashboard` with either a short success state or `?error=...`.

#### 3. Route guard alignment

**File**: `src/middleware.ts`

**Intent**: Keep S-03 routes protected by the existing authentication middleware.

**Contract**: `/dashboard` is already protected. Add `/api/household/completions` to `PROTECTED_ROUTES` if API routes are not already covered by an authenticated guard inside the handler. Keep route protection narrow and only add real routes introduced by this slice.

### Success Criteria:

#### Automated Verification:

- Completion API routes compile through `npm run build`.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Marking a chore complete redirects back to `/dashboard` and the new completion appears in recent history.
- Undoing an own active completion redirects back to `/dashboard` and removes that completion from active history.
- Direct POST with a missing `chore_id` or `completion_id` redirects back with a clear error.
- Direct POST attempting to undo another member's completion fails and does not mutate the row.
- API route behavior confirms form parsing, redirects, query-string errors, and household guard handling outside pgTAP.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Verification And Handoff

### Overview

Extend database verification around S-03, document the completed checks, and update contract references for future S-04 work.

### Changes Required:

#### 1. Database smoke checks

**File**: `supabase/tests/household_domain_contract.sql`

**Intent**: Preserve the trust boundary around self-completion and own undo as the UI/API layer starts depending on it.

**Contract**: Extend the existing pgTAP coverage only where needed for S-03 database/RLS ownership boundaries: member can create own active completion, outsider cannot create completion in another household, member cannot complete as another user, member can soft-undo own active completion, and member cannot soft-undo another user's active completion. Route-facing behavior such as form parsing, redirects, query-string errors, and household guard handling belongs in API/manual verification, not pgTAP.

#### 2. Contract reference update

**File**: `docs/reference/contract-surfaces.md`

**Intent**: Record the new S-03 helper and route names that S-04 can reuse when building the shared dashboard.

**Contract**: Add only load-bearing names introduced by S-03, such as completion repository helpers and API routes. Keep the document short and avoid duplicating implementation details from this plan.

#### 3. Verification log

**File**: `context/changes/member-completion-loop/verification.md`

**Intent**: Preserve command results and manual checks for the S-03 slice.

**Contract**: Record command, result, date, and relevant notes for `npm run test:unit`, `npm run lint`, `npm run build`, `npx supabase db reset`, and `npx supabase db test supabase/tests/household_domain_contract.sql`. Record manual completion and undo checks, including any seeded-data prerequisites.

#### 4. Roadmap status note

**File**: `context/foundation/roadmap.md`

**Intent**: Keep roadmap status current only after implementation is actually complete.

**Contract**: Do not update S-03 status during planning. During implementation, update S-03 only after the slice is implemented, automated checks pass, and manual verification is confirmed.

### Success Criteria:

#### Automated Verification:

- `supabase/tests/household_domain_contract.sql` passes with `npx supabase db test supabase/tests/household_domain_contract.sql`.
- Local migrations apply with `npx supabase db reset`.
- `context/changes/member-completion-loop/verification.md` exists and lists the commands run.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Confirm S-03 delivers only chore visibility, self-completion, own undo, and recent active history.
- Confirm the dashboard does not present Fairness Score percentages or rank members.
- Confirm S-04 can reuse the S-03 history and repository surface for the future shared fairness dashboard.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to change review.

---

## Testing Strategy

### Unit Tests:

- Test `src/lib/household/completions.ts` parsing for valid and invalid `chore_id` and `completion_id` fields.
- Keep existing `score.test.ts` and `guards.test.ts` passing.
- Add small pure tests only where the implementation introduces pure helper logic; avoid route mocks unless handlers gain non-trivial branching that cannot be covered by manual/API checks.

### Database Tests:

- Extend `supabase/tests/household_domain_contract.sql` around S-03 ownership rules.
- Keep F-01 tests passing for member-only visibility, owner-only chore/invite writes, self-completion, own undo, invite lookup, and bootstrap contracts.

### Manual Testing Steps:

1. Start from a signed-in household member in a household with at least one owner-created chore.
2. Open `/dashboard` and confirm chore names and weights are visible.
3. Mark a chore complete and confirm the page returns to `/dashboard` with the completion in recent history.
4. Confirm another member can see the active completion in recent history but cannot undo it.
5. Undo the current user's active completion and confirm it disappears from active history.
6. Submit malformed direct POST requests missing `chore_id` or `completion_id` and confirm user-facing errors.
7. Use or seed a household with no chores and confirm the blocked state is clear.

## Performance Considerations

The MVP target is small and low-QPS. The dashboard should make bounded queries: list chores for one household and list active completions for one household inside the 14-day window. F-01 already added indexes on `chore_completions(household_id, completed_at desc)` and active completions, so the page should avoid broad unbounded history queries.

## Migration Notes

No schema migration is expected for S-03 because F-01 already created `chore_completions`, soft undo fields, constraints, indexes, and RLS policies. If implementation discovers a missing database contract, prefer an additive migration and update `docs/reference/contract-surfaces.md` plus pgTAP tests in the same phase.

## References

- Roadmap S-03: `context/foundation/roadmap.md`
- PRD US-02 and FR-007 through FR-009: `context/foundation/prd.md`
- F-01 contract reference: `docs/reference/contract-surfaces.md`
- Existing household repository: `src/lib/household/repository.ts`
- Existing household guards: `src/lib/household/guards.ts`
- Dashboard placeholder: `src/pages/dashboard.astro`
- Existing redirect-based auth API pattern: `src/pages/api/auth/signin.ts`
- Existing protected-route boundary: `src/middleware.ts`
- Existing database/RLS smoke tests: `supabase/tests/household_domain_contract.sql`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` - <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Completion Domain Contracts

#### Automated

- [x] 1.1 Completion form helper tests pass with `npm run test:unit`. — 2e8167d
- [x] 1.2 Existing score and guard tests continue to pass with `npm run test:unit`. — 2e8167d
- [x] 1.3 Repository helper types compile through `npm run build`. — 2e8167d
- [x] 1.4 `npm run lint` passes. — 2e8167d
- [x] 1.5 `npm run build` passes. — 2e8167d

#### Manual

- [x] 1.6 Review repository helpers for server-derived household/user fields. — 2e8167d
- [x] 1.7 Confirm Phase 1 adds no dashboard UI, invite UI, or score dashboard behavior. — 2e8167d

### Phase 2: Dashboard Completion UI

#### Automated

- [x] 2.1 Dashboard and new household components compile through `npm run build`.
- [x] 2.2 `npm run test:unit` passes.
- [x] 2.3 `npm run lint` passes.
- [x] 2.4 `npm run build` passes.

#### Manual

- [x] 2.5 Authenticated household member can open `/dashboard` and see chore names plus point weights.
- [x] 2.6 A household with no chores shows the owner-focused blocked state.
- [x] 2.7 Recent history shows active completions from the rolling 14-day window.
- [x] 2.8 Undo controls appear only on the current user's active completions.
- [x] 2.9 Completion and undo failures display short query-string error messages on return to `/dashboard`.

### Phase 3: Completion API Routes

#### Automated

- [x] 3.1 Completion API routes compile through `npm run build`. — 84d2ade
- [x] 3.2 `npm run test:unit` passes. — 84d2ade
- [x] 3.3 `npm run lint` passes. — 84d2ade
- [x] 3.4 `npm run build` passes. — 84d2ade

#### Manual

- [x] 3.5 Marking a chore complete redirects back to `/dashboard` and the new completion appears in recent history. — 84d2ade
- [x] 3.6 Undoing an own active completion redirects back to `/dashboard` and removes that completion from active history. — 84d2ade
- [x] 3.7 Direct POST with a missing `chore_id` or `completion_id` redirects back with a clear error. — 84d2ade
- [x] 3.8 Direct POST attempting to undo another member's completion fails and does not mutate the row. — 84d2ade
- [x] 3.9 API route behavior confirms form parsing, redirects, query-string errors, and household guard handling outside pgTAP. — 84d2ade

### Phase 4: Verification And Handoff

#### Automated

- [x] 4.1 `supabase/tests/household_domain_contract.sql` passes with `npx supabase db test supabase/tests/household_domain_contract.sql`. — f2c6160
- [x] 4.2 Local migrations apply with `npx supabase db reset`. — f2c6160
- [x] 4.3 `context/changes/member-completion-loop/verification.md` exists and lists the commands run. — f2c6160
- [x] 4.4 `npm run test:unit` passes. — f2c6160
- [x] 4.5 `npm run lint` passes. — f2c6160
- [x] 4.6 `npm run build` passes. — f2c6160

#### Manual

- [x] 4.7 Confirm S-03 delivers only chore visibility, self-completion, own undo, and recent active history. — f2c6160
- [x] 4.8 Confirm the dashboard does not present Fairness Score percentages or rank members. — f2c6160
- [x] 4.9 Confirm S-04 can reuse the S-03 history and repository surface for the future shared fairness dashboard. — f2c6160
