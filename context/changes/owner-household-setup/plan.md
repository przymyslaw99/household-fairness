# Owner Household Setup Implementation Plan

## Overview

Implement roadmap slice `S-01`: let an authenticated owner create a household and define the first chore weights that the shared score will use. This turns the F-01 household contract into the first owner-visible product flow without pulling in invite lifecycle, completion tracking, or dashboard scoring.

## Current State Analysis

The project already has Astro pages, redirect-based Supabase auth handlers, a protected `/dashboard` route, and F-01 household schema/RLS/domain helpers. The missing piece is a setup route that uses those contracts to create a real household plus initial owner-defined chores.

## Desired End State

An authenticated user without household membership can open `/setup/household`, enter a household name, add one or more chore name/weight rows, and submit once. The system creates the household and initial chores as one setup operation, then redirects the new owner to `/dashboard`; users who already belong to a household are redirected away from setup.

### Key Discoveries:

- `context/foundation/roadmap.md:29` defines `owner-household-setup` as the S-01 slice for household creation plus first chore weights.
- `context/foundation/roadmap.md:85` warns that S-01 should not absorb member management or post-creation editing flows.
- `context/foundation/prd.md:80` through `context/foundation/prd.md:90` define US-03: the owner creates a household and visible point-weighted chores.
- `context/foundation/prd.md:98` and `context/foundation/prd.md:105` make household creation and owner-created weighted chores must-have requirements.
- `context/foundation/prd.md:146` and `context/foundation/prd.md:149` explicitly park post-creation weight editing and starter chore templates.
- `docs/reference/contract-surfaces.md:61` says S-01 builds on `create_household_with_owner`, `createCurrentUserHousehold`, `households`, and `household_members`.
- `src/lib/household/repository.ts:22` exposes `createCurrentUserHousehold`, but no helper currently inserts owner-created chores.
- `src/middleware.ts:5` protects only `/dashboard`; `/setup/household` must be added once the route exists.
- `src/pages/auth/signup.astro:11` and `src/pages/api/auth/signup.ts:4` show the current pattern: Astro page, hydrated React form, POST handler, redirect with query errors.

## What We're NOT Doing

- No invite creation, invite disabling, or member join flow; that remains S-02.
- No completion recording, own undo, or recent history; that remains S-03.
- No live Fairness Score dashboard or score explanation UI; that remains S-04.
- No member removal, multi-household support, starter templates, or post-creation chore weight editing.
- No client-side Supabase write flow; setup writes stay behind server/API boundaries.
- No dashboard redesign beyond the redirect destination needed after setup.

## Implementation Approach

Keep the owner experience as one simple setup form, but make the write contract resistant to partial setup state. Add a small S-01 domain contract that validates setup input and creates the household plus initial chores as one atomic operation. Then expose it through `/setup/household` using the existing Astro page plus hydrated React form pattern.

## Critical Implementation Details

### Atomic Setup Write

A plain app-side sequence of `create household` followed by `insert chores` can leave a user with a household but no initial scoring model if the second write fails. The implementation should provide one server-facing setup helper backed by one database operation so household creation and initial chore insertion succeed or fail together.

### Existing Membership Redirect

`/setup/household` must distinguish authenticated users without a household from authenticated users who already have membership. Missing membership may enter setup; existing membership redirects to `/dashboard`; unauthenticated users redirect to `/auth/signin`.

## Phase 1: Setup Domain Contracts

### Overview

Add the S-01 validation and data contracts needed before building the route.

### Changes Required:

#### 1. Setup validation helper

**File**: `src/lib/household/setup.ts`

**Intent**: Centralize setup input rules so the React form and server handler follow the same behavior. This keeps duplicate-name, empty-name, missing-chore, and invalid-weight rules testable without route mocks.

**Contract**: Export setup input/result types and a pure validation function for `householdName` plus an array of chore rows. The validator trims names, requires at least one chore, requires positive integer weights, and rejects duplicate chore names after trimming and case normalization.

#### 2. Atomic setup database function

**File**: `supabase/migrations/20260618_owner_household_setup.sql`

**Intent**: Create a single database entry point for first-time owner setup so a failed chore insert cannot leave an empty household behind.

**Contract**: Add an authenticated RPC-style function such as `create_household_with_initial_chores(household_name text, chores jsonb)` that creates the household, owner membership, and owner-created chores in one transaction. It must use `auth.uid()`, reject unauthenticated calls, reject empty household names, reject empty chore arrays, enforce positive weights, and preserve the one-household-per-user invariant.

#### 3. TypeScript database contract

**File**: `src/lib/household/types.ts`

**Intent**: Name the new S-01 function in the local Supabase type surface so repository code can call it without untyped string-only contracts.

**Contract**: Extend `HouseholdDatabase.public.Functions` with the setup function args and return value. Preserve existing F-01 function contracts.

#### 4. Repository setup helper

**File**: `src/lib/household/repository.ts`

**Intent**: Provide one server-side helper for the setup route to create the household and initial chores without using service-role credentials.

**Contract**: Export a function such as `createCurrentUserHouseholdSetup(supabase, input)` that accepts a request-scoped Supabase client and validated setup input, calls the atomic setup function, and returns `RepositoryResult<Uuid>`.

### Success Criteria:

#### Automated Verification:

- Migration applies cleanly with `npx supabase db reset`.
- Supabase DB tests pass with `npx supabase db test supabase/tests/household_domain_contract.sql`.
- S-01 validation unit tests pass with `npm run test:unit`.
- Existing unit tests continue to pass with `npm run test:unit`.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Review the setup contract and confirm it creates a household plus at least one owner chore without service-role access.
- Confirm the contract does not introduce invite, member-management, or chore-editing scope.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Setup Route And Form

### Overview

Build the owner-facing setup page, dynamic chore form, and POST endpoint.

### Changes Required:

#### 1. Setup page

**File**: `src/pages/setup/household.astro`

**Intent**: Add the authenticated first-run setup screen for users who do not yet belong to a household.

**Contract**: Render a setup page under `/setup/household` using the existing `Layout` and card/form visual language. Read `?error=` from the URL and pass it to the setup form, following the auth page pattern.

#### 2. Setup React form

**File**: `src/components/household/HouseholdSetupForm.tsx`

**Intent**: Let the owner enter a household name and dynamically add/remove chore rows before submitting once.

**Contract**: Render a server-posted form targeting `/api/household/setup`. Start with one chore row. Allow adding and removing rows while keeping at least one row. Use the shared `FormField`, `SubmitButton`, `ServerError`, `Button`, and `cn()` patterns where they fit. Client validation mirrors the Phase 1 setup validation helper.

#### 3. Setup POST handler

**File**: `src/pages/api/household/setup.ts`

**Intent**: Convert submitted form data into validated setup input and call the repository setup helper from the server.

**Contract**: Accept POST form fields for household name and chore rows, reject unauthenticated or unconfigured Supabase states with redirects, run server-side validation, call `createCurrentUserHouseholdSetup`, redirect success to `/dashboard`, and redirect validation/repository failures back to `/setup/household?error=...`.

#### 4. Form data parsing utility

**File**: `src/lib/household/setup.ts`

**Intent**: Keep form parsing and validation predictable for both the API handler and tests.

**Contract**: Add a small parser that reads repeated or indexed chore fields from `FormData` into the setup input shape. The handler must not rely only on client-side state because users can submit malformed requests.

### Success Criteria:

#### Automated Verification:

- Setup validation tests cover empty household name, zero chores, empty chore name, non-positive weight, non-integer weight, duplicate names after trimming/case normalization, and a valid multi-chore payload.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Authenticated user without a household can open `/setup/household`, add multiple chore rows, submit, and land on `/dashboard`.
- Form blocks duplicate chore names, missing names, and invalid weights before submission where possible.
- Server-side validation returns a clear `?error=` state when malformed form data is submitted.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Guards And Redirects

### Overview

Wire the setup route into the existing protected-route and membership guard boundaries.

### Changes Required:

#### 1. Protected route list

**File**: `src/middleware.ts`

**Intent**: Require authentication before users can access the setup route or submit setup data.

**Contract**: Add `/setup/household` to `PROTECTED_ROUTES`. Keep the existing `/dashboard` behavior unchanged.

#### 2. Setup page membership redirect

**File**: `src/pages/setup/household.astro`

**Intent**: Prevent users who already belong to a household from seeing first-run setup again.

**Contract**: Use the request-scoped Supabase client and `getCurrentUserHouseholdMembership` or `requireCurrentHouseholdMember` to redirect existing members to `/dashboard`. Allow authenticated users with missing membership to see setup. Surface unexpected guard errors as a setup error state rather than exposing raw stack traces.

#### 3. Setup API membership guard

**File**: `src/pages/api/household/setup.ts`

**Intent**: Prevent duplicate household creation attempts from stale forms or direct POSTs.

**Contract**: Before calling the setup helper, confirm the current user is authenticated and has no existing household membership. Existing membership redirects to `/dashboard`; missing membership may create setup; guard/repository errors redirect back to setup with a user-facing message.

### Success Criteria:

#### Automated Verification:

- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Anonymous request to `/setup/household` redirects to `/auth/signin`.
- Authenticated user with no household sees setup.
- Authenticated user with an existing household is redirected to `/dashboard`.
- Direct POST by a user with existing membership does not create a second household.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Verification And Handoff

### Overview

Document the new S-01 contracts and verify the slice against roadmap scope.

### Changes Required:

#### 1. Contract reference update

**File**: `docs/reference/contract-surfaces.md`

**Intent**: Record the new setup helper/function names that later slices may depend on.

**Contract**: Update the S-01 section and repository/database helper lists only if the implementation introduces new public contract names. Keep the document short and focused on load-bearing names.

#### 2. Change verification log

**File**: `context/changes/owner-household-setup/verification.md`

**Intent**: Preserve the commands and manual checks used to validate S-01.

**Contract**: Record command results for `npm run test:unit`, `npm run lint`, `npm run build`, and Supabase reset/test commands if the implementation adds the migration function. Record manual setup checks and any known local-environment caveats.

#### 3. Roadmap status note

**File**: `context/foundation/roadmap.md`

**Intent**: Keep roadmap status current after implementation lands.

**Contract**: During implementation, update S-01 status only when the slice is actually complete and manually verified. Planning alone does not change roadmap status.

### Success Criteria:

#### Automated Verification:

- `context/changes/owner-household-setup/verification.md` exists and lists the commands run.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- If a migration is added, `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` pass.

#### Manual Verification:

- Confirm S-01 delivers only household setup plus initial chore weights.
- Confirm later slices can rely on the setup output: household membership exists, owner role exists, and at least one visible weighted chore exists.
- Confirm no invite, completion, or dashboard-score behavior was added accidentally.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to change review.

---

## Testing Strategy

### Unit Tests:

- Test pure setup validation in `src/lib/household/setup.test.ts`.
- Cover household name trimming, one-or-more chore requirement, positive integer weights, duplicate-name rejection, and valid multi-row input.
- Keep existing `score.test.ts` and `guards.test.ts` passing.

### Database Tests:

- If the implementation adds the atomic setup RPC, extend `supabase/tests/household_domain_contract.sql` with one S-01 smoke check for household plus initial chores and one failure check for invalid input.
- Keep existing F-01 RLS and bootstrap tests passing.

### Manual Testing Steps:

1. Sign in as a user with no household and open `/setup/household`.
2. Submit a household name with one chore and confirm redirect to `/dashboard`.
3. Repeat locally with multiple chores and confirm each chore is visible in Supabase under the created household.
4. Try duplicate chore names with different casing or whitespace and confirm the form/server rejects them.
5. Reopen `/setup/household` as the newly set-up owner and confirm redirect to `/dashboard`.
6. Open `/setup/household` anonymously and confirm redirect to `/auth/signin`.

## Performance Considerations

The MVP target is small and low-QPS. The setup form submits one household and a small list of chores once per owner, so performance risk is low. The important performance choice is avoiding repeated network writes from the client; one server POST and one database operation keeps the flow predictable.

## Migration Notes

This change may add an S-01-specific Supabase function on top of the existing F-01 tables. It should be additive and should not rewrite the established table shape. There is no existing production household data expected for this slice, but later changes should treat setup data as durable once users create real households.

## References

- Roadmap: `context/foundation/roadmap.md`
- PRD: `context/foundation/prd.md`
- Shape notes: `context/foundation/shape-notes.md`
- F-01 contract reference: `docs/reference/contract-surfaces.md`
- Existing form pattern: `src/pages/auth/signup.astro`, `src/components/auth/SignUpForm.tsx`, `src/pages/api/auth/signup.ts`
- Existing household repository: `src/lib/household/repository.ts`
- Existing guard helper: `src/lib/household/guards.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` - <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Setup Domain Contracts

#### Automated

- [x] 1.1 Migration applies cleanly with `npx supabase db reset`. — 09acea6
- [x] 1.2 Supabase DB tests pass with `npx supabase db test supabase/tests/household_domain_contract.sql`. — 09acea6
- [x] 1.3 S-01 validation unit tests pass with `npm run test:unit`. — 09acea6
- [x] 1.4 Existing unit tests continue to pass with `npm run test:unit`. — 09acea6
- [x] 1.5 `npm run lint` passes. — 09acea6
- [x] 1.6 `npm run build` passes. — 09acea6

#### Manual

- [x] 1.7 Review the setup contract and confirm it creates a household plus at least one owner chore without service-role access. — 09acea6
- [x] 1.8 Confirm the contract does not introduce invite, member-management, or chore-editing scope. — 09acea6

### Phase 2: Setup Route And Form

#### Automated

- [x] 2.1 Setup validation tests cover empty household name, zero chores, empty chore name, non-positive weight, non-integer weight, duplicate names after trimming/case normalization, and a valid multi-chore payload.
- [x] 2.2 `npm run test:unit` passes.
- [x] 2.3 `npm run lint` passes.
- [x] 2.4 `npm run build` passes.

#### Manual

- [x] 2.5 Authenticated user without a household can open `/setup/household`, add multiple chore rows, submit, and land on `/dashboard`.
- [x] 2.6 Form blocks duplicate chore names, missing names, and invalid weights before submission where possible.
- [x] 2.7 Server-side validation returns a clear `?error=` state when malformed form data is submitted.

### Phase 3: Guards And Redirects

#### Automated

- [x] 3.1 `npm run test:unit` passes. — 1d51c77
- [x] 3.2 `npm run lint` passes. — 1d51c77
- [x] 3.3 `npm run build` passes. — 1d51c77

#### Manual

- [x] 3.4 Anonymous request to `/setup/household` redirects to `/auth/signin`. — 1d51c77
- [x] 3.5 Authenticated user with no household sees setup. — 1d51c77
- [x] 3.6 Authenticated user with an existing household is redirected to `/dashboard`. — 1d51c77
- [x] 3.7 Direct POST by a user with existing membership does not create a second household. — 1d51c77
- [x] 3.8 Anonymous POST to `/api/household/setup` redirects to `/auth/signin` or otherwise fails without creating a household. — 1d51c77

### Phase 4: Verification And Handoff

#### Automated

- [x] 4.1 `context/changes/owner-household-setup/verification.md` exists and lists the commands run.
- [x] 4.2 `npm run test:unit` passes.
- [x] 4.3 `npm run lint` passes.
- [x] 4.4 `npm run build` passes.
- [x] 4.5 If a migration is added, `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` pass.

#### Manual

- [x] 4.6 Confirm S-01 delivers only household setup plus initial chore weights.
- [x] 4.7 Confirm later slices can rely on the setup output: household membership exists, owner role exists, and at least one visible weighted chore exists.
- [x] 4.8 Confirm no invite, completion, or dashboard-score behavior was added accidentally.
