# Invite Lifecycle And Join Implementation Plan

## Overview

Implement roadmap slice `S-02`: let an authenticated household owner explicitly create an active invite link, let a second signed-in user join through that link after confirming, and let the owner disable the active link to stop future joins. This connects the S-01 owner setup output to a real second household member without pulling in member administration, removal, completion tracking, or dashboard scoring.

## Current State Analysis

The repo already has the F-01 household contract: household tables, owner/member roles, `household_invites`, one active invite per household, RLS policies, invite join RPC, active invite lookup RPC, request-scoped Supabase repository helpers, and guard helpers. The current UI has auth forms, a protected `/dashboard`, and server-posted Astro API route patterns, but no owner invite page, no create/disable invite API endpoints, and no join confirmation route.

## Desired End State

An authenticated owner with a household can open a protected invite page, explicitly create or view the one active invite link, copy it, and disable it. A signed-out invitee who opens the link is routed through auth with the invite token preserved; after signing in, they land on a neutral confirmation page and join only after pressing the join action. Invalid or disabled links show a neutral error state, and successful joins redirect to `/dashboard`.

### Key Discoveries:

- `context/foundation/roadmap.md:30` defines S-02 as owner invite path, second-member join, and owner disabling of the active link.
- `context/foundation/roadmap.md:105` warns against broadening the slice into member administration or multi-household support.
- `context/foundation/prd.md:98` through `context/foundation/prd.md:100` define invite links, owner-disabled active links, and stopping new joins as must-have requirements.
- `docs/reference/contract-surfaces.md:11` says `household_invites` stores one active invite token per household where `disabled_at is null`.
- `docs/reference/contract-surfaces.md:21` and `docs/reference/contract-surfaces.md:22` already name `join_household_with_invite` and `fetch_active_invite_by_token` as the join-side entry points.
- `src/lib/household/repository.ts:33` already exposes `joinCurrentUserHouseholdByInvite`; `src/lib/household/repository.ts:95` already exposes `fetchActiveInviteByToken`.
- `src/middleware.ts:5` currently protects only `/dashboard`; real S-02 routes must be added when introduced.
- `context/changes/owner-household-setup/plan.md:29` parks invite creation, disabling, and join flow for S-02.

## What We're NOT Doing

- No member list, member removal, resend controls, role editing, or member administration shell.
- No automatic invite creation on page load or during household setup.
- No anonymous join write; invitees must authenticate before joining.
- No auto-join on link open; signed-in invitees must confirm.
- No token expiry column, signed token format, email delivery, or notification system.
- No multi-household support.
- No completion recording, undo flow, recent history, or Fairness Score dashboard work.
- No full browser E2E framework setup unless the repo adds one separately.

## Implementation Approach

Keep invite lifecycle server-owned and explicit. Add a small S-02 domain layer for opaque token generation and invite actions, expose owner actions through protected Astro API routes, and keep join writes behind a signed-in confirmation POST. Reuse the existing F-01 table/RLS/RPC contracts wherever possible, adding only the helper surface needed to create or reuse an active invite and disable it.

## Critical Implementation Details

### Authentication Redirect Preservation

The invite token must survive sign-in and sign-up without creating membership before authentication. The join route should redirect signed-out users to auth with a safe `redirectTo` or equivalent query value pointing back to the invite confirmation route, and auth success handlers should honor only app-local redirect targets.

### Token Handling

Tokens stay opaque database tokens. Generate them with a cryptographically strong browser/runtime-safe API, trim only at the server boundary, never derive household identity from token contents, and use `fetch_active_invite_by_token` to resolve active invites.

## Phase 1: Invite Domain Contracts

### Overview

Add the missing S-02 domain contracts for explicit invite creation, active invite reuse, disabling, and token validation while preserving the F-01 schema shape.

### Changes Required:

#### 1. Invite domain helper

**File**: `src/lib/household/invites.ts`

**Intent**: Centralize S-02 invite token generation, token validation, and user-facing error mapping so routes do not duplicate security-sensitive string handling.

**Contract**: Export a token generator for opaque invite tokens, a validator/parser for route/form tokens, and typed result/error values for invalid, disabled, already-member, wrong-role, and repository failure cases. The generator must create tokens compatible with the existing `household_invites.token` minimum length and avoid client-visible household data.

#### 2. Repository invite lifecycle helpers

**File**: `src/lib/household/repository.ts`

**Intent**: Provide owner-facing invite lifecycle helpers beside the existing join and fetch helpers.

**Contract**: Export helpers such as `getActiveInviteForHousehold(supabase, householdId)`, `createActiveInviteForCurrentOwner(supabase, householdId, token)`, and `disableActiveInviteForCurrentOwner(supabase, householdId)`. All helpers accept the request-scoped Supabase client and return `RepositoryResult`, with no service-role credentials.

#### 3. Supabase type surface

**File**: `src/lib/household/types.ts`

**Intent**: Keep the local Supabase type surface aligned with any new S-02 RPC-style helpers or direct table fields used by the repository.

**Contract**: Update only the `household_invites` table/function types needed by S-02. Do not change the established F-01 table names, role literals, score types, or one-household-per-user assumptions.

#### 4. Database lifecycle function, if direct table operations are insufficient

**File**: `supabase/migrations/<timestamp>_invite_lifecycle.sql`

**Intent**: Add a single authenticated database entry point if the app needs atomic create-or-return-active behavior or a safer disable operation than separate table reads/writes.

**Contract**: Any new function must use `auth.uid()`, require owner role through existing owner checks, preserve one active invite per household, return the active invite row or invite id as needed, and disable only currently active invites for the owner household. It must be additive and must not rewrite the F-01 schema.

### Success Criteria:

#### Automated Verification:

- Invite domain unit tests pass with `npm run test:unit`.
- Migration applies cleanly with `npx supabase db reset` if a migration is added.
- Supabase DB tests pass with `npx supabase db test supabase/tests/household_domain_contract.sql` after adding S-02 invite cases.
- Linting passes with `npm run lint`.
- Production build passes with `npm run build`.

#### Manual Verification:

- Review the domain contract and confirm it exposes only active invite creation/reuse and disable behavior.
- Confirm no member administration, removal, token expiry, or multi-household scope was added.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase. Phase blocks use plain bullets; the corresponding checkboxes live only in `## Progress`.

---

## Phase 2: Owner Invite Page And API

### Overview

Build the owner-only surface for creating, copying, viewing, and disabling the current active invite link.

### Changes Required:

#### 1. Owner invite page

**File**: `src/pages/household/invite.astro`

**Intent**: Add a protected page where the household owner manages the current active invite link.

**Contract**: Use the request-scoped Supabase client and `requireCurrentHouseholdMember` with owner role. Missing membership redirects to `/setup/household` once S-01 exists, unauthenticated users are handled by middleware/auth, wrong-role users see a neutral forbidden state or redirect to `/dashboard`, and allowed owners see the current active invite link if one exists.

#### 2. Owner invite controls

**File**: `src/components/household/InviteControls.tsx`

**Intent**: Provide a focused owner UI for explicit invite creation, copy action, and disable action.

**Contract**: Render only the active invite lifecycle controls. Use familiar icon buttons where useful, shared button styling, `cn()` for conditional classes, and server-posted forms for create/disable actions. Do not include member list, removal, resend, or audit-history UI.

#### 3. Create invite API route

**File**: `src/pages/api/household/invite/create.ts`

**Intent**: Let an owner explicitly create or reuse the household's active invite link.

**Contract**: Accept POST only, require authenticated owner membership, generate an opaque token only when no active invite exists, call the repository lifecycle helper, and redirect back to `/household/invite` with a success or user-facing error query. Direct POST by a non-owner must not create an invite.

#### 4. Disable invite API route

**File**: `src/pages/api/household/invite/disable.ts`

**Intent**: Let an owner disable the active invite so future joins through that link fail.

**Contract**: Accept POST only, require authenticated owner membership, set `disabled_at` on the active invite through the repository/helper contract, and redirect back to `/household/invite` with a success or user-facing error query. Disabling an already-disabled or missing invite should be idempotent from the user's perspective.

### Success Criteria:

#### Automated Verification:

- Owner invite helper tests cover create-or-reuse behavior, disable behavior, invalid token rejection, and non-owner denial where testable.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Authenticated owner opens `/household/invite`, sees no active link before creation, clicks create, and sees a copyable link.
- Reloading the invite page does not create a second active invite.
- Owner disables the active link and the page no longer presents it as usable.
- A non-owner household member cannot create or disable household invites.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: Invite Join Route And Auth Preservation

### Overview

Build the invitee-facing route that preserves invite context through auth, shows a neutral confirmation state, and joins only after explicit confirmation.

### Changes Required:

#### 1. Join route

**File**: `src/pages/join/[token].astro`

**Intent**: Let a user open an invite link and either authenticate with the token preserved or confirm joining when already signed in.

**Contract**: Parse the token from the route, validate the token shape, use `fetchActiveInviteByToken` for active invite lookup, and render one of three states: signed-out redirect, signed-in confirmation, or neutral invalid/disabled message. Do not expose household details beyond what the invitee needs to decide to join.

#### 2. Join confirmation component

**File**: `src/components/household/JoinHouseholdForm.tsx`

**Intent**: Provide the explicit signed-in confirmation action before membership is written.

**Contract**: Render a server-posted form targeting `/api/household/join` with the token in a hidden field. Show neutral copy for joining and invalid states. Do not auto-submit on page load.

#### 3. Join API route

**File**: `src/pages/api/household/join.ts`

**Intent**: Join the signed-in current user to the invite household only after confirmation.

**Contract**: Accept POST only, require Supabase configuration and authenticated user, validate the submitted token, call `joinCurrentUserHouseholdByInvite`, map invalid/disabled/already-member failures to user-facing redirects, and redirect success to `/dashboard`.

#### 4. Auth redirect preservation

**File**: `src/pages/api/auth/signin.ts`

**Intent**: Preserve app-local invite redirect targets after successful sign-in.

**Contract**: Read an optional redirect target from the submitted form or query flow, validate it is an app-local path, and redirect there after successful sign-in. Default behavior remains unchanged when no redirect target is present.

#### 5. Sign-in form redirect support

**File**: `src/pages/auth/signin.astro`

**Intent**: Pass a safe invite return target into the sign-in form when the join route sends a signed-out user through auth.

**Contract**: Read and validate a local redirect target from URL search params and pass it to the sign-in form as hidden form data.

#### 6. Sign-in form hidden field

**File**: `src/components/auth/SignInForm.tsx`

**Intent**: Preserve the invite redirect through the existing server-posted sign-in form without changing normal sign-in behavior.

**Contract**: Accept an optional redirect target prop and include it as a hidden field only when present and already validated by the page/API boundary.

#### 7. Sign-up page redirect support

**File**: `src/pages/auth/signup.astro`

**Intent**: Preserve the invite return target when a signed-out invitee needs to create a new account before joining.

**Contract**: Read and validate the same app-local redirect target accepted by the sign-in page, pass it to the sign-up form as hidden form data, and keep the sign-in/sign-up footer links carrying the safe target so switching auth modes does not drop invite context.

#### 8. Sign-up form hidden field

**File**: `src/components/auth/SignUpForm.tsx`

**Intent**: Preserve the invite redirect through the existing server-posted sign-up form without changing normal sign-up behavior.

**Contract**: Accept an optional redirect target prop and include it as a hidden field only when present and already validated by the page/API boundary.

#### 9. Sign-up API redirect preservation

**File**: `src/pages/api/auth/signup.ts`

**Intent**: Preserve app-local invite redirect targets for newly created invitees, including the email-confirmation handoff when confirmation is required.

**Contract**: Read an optional redirect target from submitted form data, validate it is an app-local path, and carry it through the post-sign-up result without redirecting to external URLs. Default behavior remains unchanged when no redirect target is present.

### Success Criteria:

#### Automated Verification:

- Redirect-target validation tests reject external URLs and allow only safe local paths across sign-in and sign-up flows.
- Join helper tests cover invalid token, disabled invite, already-member join, and successful join mapping where practical.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Signed-out invitee opening a valid invite link is sent to sign-in with the invite return preserved.
- After sign-in, invitee lands back on the join confirmation page.
- New invitee can switch to sign-up with the invite return preserved and still reach the join confirmation path after account creation or email confirmation.
- Signed-in invitee sees a confirmation action and joins only after pressing it.
- Invalid or disabled invite link shows a neutral error page and does not reveal household-only data.
- Successful join redirects to `/dashboard`.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Route Guards, Redirects, And Handoff

### Overview

Wire the invite routes into the protected-route boundary and finalize edge-case redirects so S-02 composes cleanly with S-01 and later slices.

### Changes Required:

#### 1. Protected route registration

**File**: `src/middleware.ts`

**Intent**: Protect real owner invite and join POST surfaces without reserving nonexistent routes.

**Contract**: Add `/household/invite` to `PROTECTED_ROUTES` once the route exists. Keep `/join/[token]` publicly reachable enough to preserve signed-out invite links, while its POST join action remains authenticated inside the API route.

#### 2. Existing household handling

**File**: `src/pages/join/[token].astro`

**Intent**: Prevent confusing or duplicate joins for users who already belong to a household.

**Contract**: Use `getCurrentUserHouseholdMembership` or `requireCurrentHouseholdMember` to distinguish missing membership from existing membership. Existing members are redirected to `/dashboard` or shown a neutral already-member state; missing-membership users can confirm join.

#### 3. Owner route guard behavior

**File**: `src/pages/household/invite.astro`

**Intent**: Keep invite management owner-only while preserving useful navigation for authenticated non-owners.

**Contract**: Owners are allowed, authenticated members without owner role are redirected to `/dashboard` or see a neutral forbidden state, authenticated users without membership are sent to setup once S-01 exists, and guard errors are surfaced as user-facing messages.

#### 4. Contract reference update

**File**: `docs/reference/contract-surfaces.md`

**Intent**: Document any new S-02 repository helpers or route names that later slices should rely on.

**Contract**: Add only load-bearing helper/route names introduced by S-02. Do not turn the reference into implementation notes or duplicate the full plan.

### Success Criteria:

#### Automated Verification:

- Guard/helper tests cover owner allowed, member denied for invite management, missing membership allowed for join confirmation, and existing membership blocked from duplicate join where practical.
- Anonymous request to `/household/invite` redirects to `/auth/signin`.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Owner can manage invites from the owner route.
- Member cannot manage invites.
- User with no household can join from a valid invite.
- User who already belongs to a household cannot join again through the same or another invite.
- `/join/<token>` remains usable as a shareable link for signed-out users.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 5: Verification And Documentation

### Overview

Record verification evidence, keep the roadmap handoff clear, and ensure later slices can depend on S-02 without inheriting hidden invite assumptions.

### Changes Required:

#### 1. Verification log

**File**: `context/changes/invite-lifecycle-and-join/verification.md`

**Intent**: Capture the concrete automated and manual checks used to validate S-02.

**Contract**: Record command results for `npm run test:unit`, `npm run lint`, `npm run build`, and Supabase reset/test commands if DB contracts changed. Record manual owner invite, signed-out invite, signed-in join, disabled-link, non-owner, and already-member checks.

#### 2. Plan and change status handoff

**File**: `context/changes/invite-lifecycle-and-join/plan.md`

**Intent**: Keep progress checkboxes as the implementation source of truth.

**Contract**: During implementation, update only the `## Progress` section as phases land, appending commit SHAs to completed items. Do not rename progress items after implementation starts.

#### 3. Change metadata

**File**: `context/changes/invite-lifecycle-and-join/change.md`

**Intent**: Mark the change as implemented only after all planned phases and manual confirmations are complete.

**Contract**: Keep `status: planned` until implementation and manual verification finish; then update to `implemented` in the implementation closure step.

### Success Criteria:

#### Automated Verification:

- `context/changes/invite-lifecycle-and-join/verification.md` exists and lists all commands run.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- If migrations changed, `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` pass.

#### Manual Verification:

- Confirm S-02 delivers only invite link creation/reuse, invite disabling, preserved auth redirect, and confirmed join.
- Confirm S-03 can rely on at least two household members after a successful join.
- Confirm no member-removal, completion, or dashboard-score behavior was added accidentally.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before closing the change.

---

## Testing Strategy

### Unit Tests:

- Test invite token validation and safe local redirect validation.
- Test owner invite domain helpers for create/reuse/disable result mapping.
- Test join result mapping for invalid token, disabled token, already-member, and success where practical.
- Keep existing `score.test.ts` and `guards.test.ts` passing.

### Integration Tests:

- Extend `supabase/tests/household_domain_contract.sql` for owner invite create, one-active enforcement, owner disable, disabled invite rejection, authenticated invite lookup before join, successful join, and one-household-per-user rejection.
- If new database functions are added, include both allowed owner and denied member/outsider cases.

### Manual Testing Steps:

1. Sign in as an owner with a household and open `/household/invite`.
2. Create the invite explicitly and confirm the page shows one copyable link.
3. Reload the page and confirm a second active invite is not created.
4. Open the invite link in a signed-out session and confirm the token survives sign-in.
5. Confirm join as a signed-in user without a household and verify redirect to `/dashboard`.
6. Open the same invite after disabling it and confirm the neutral invalid/disabled state.
7. Try invite management as a non-owner member and confirm create/disable is denied.
8. Try joining as an existing household member and confirm duplicate membership is blocked.

## Performance Considerations

The MVP target is small and low-QPS. Invite lifecycle operations are single-household reads/writes backed by existing indexes on active invite token and one active invite per household. The main performance constraint is avoiding client-side polling or repeated passive creation; explicit POST actions and server-side redirects keep the flow predictable.

## Migration Notes

S-02 should prefer existing F-01 tables and functions. Add a migration only if the owner lifecycle needs a database function for atomic create-or-return-active or disable behavior. Any migration must be additive and safe for future real household data; do not drop or rewrite the F-01 tables.

## References

- Roadmap slice: `context/foundation/roadmap.md:30`
- S-02 detail: `context/foundation/roadmap.md:89`
- PRD invite requirements: `context/foundation/prd.md:98`
- Existing contract reference: `docs/reference/contract-surfaces.md`
- Existing household repository: `src/lib/household/repository.ts`
- Existing guard helper: `src/lib/household/guards.ts`
- Existing household migration: `supabase/migrations/20260616_household_domain_contract.sql`
- Existing DB smoke tests: `supabase/tests/household_domain_contract.sql`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Invite Domain Contracts

#### Automated

- [x] 1.1 Invite domain unit tests pass with `npm run test:unit`. — 720d636
- [x] 1.2 Migration applies cleanly with `npx supabase db reset` if a migration is added. — 720d636
- [x] 1.3 Supabase DB tests pass with `npx supabase db test supabase/tests/household_domain_contract.sql` after adding S-02 invite cases. — 720d636
- [x] 1.4 Linting passes with `npm run lint`. — 720d636
- [x] 1.5 Production build passes with `npm run build`. — 720d636

#### Manual

- [x] 1.6 Review the domain contract and confirm it exposes only active invite creation/reuse and disable behavior. — 720d636
- [x] 1.7 Confirm no member administration, removal, token expiry, or multi-household scope was added. — 720d636

### Phase 2: Owner Invite Page And API

#### Automated

- [x] 2.1 Owner invite helper tests cover create-or-reuse behavior, disable behavior, invalid token rejection, and non-owner denial where testable.
- [x] 2.2 `npm run test:unit` passes.
- [x] 2.3 `npm run lint` passes.
- [x] 2.4 `npm run build` passes.

#### Manual

- [x] 2.5 Authenticated owner opens `/household/invite`, sees no active link before creation, clicks create, and sees a copyable link.
- [x] 2.6 Reloading the invite page does not create a second active invite.
- [x] 2.7 Owner disables the active link and the page no longer presents it as usable.
- [x] 2.8 A non-owner household member cannot create or disable household invites.

### Phase 3: Invite Join Route And Auth Preservation

#### Automated

- [ ] 3.1 Redirect-target validation tests reject external URLs and allow only safe local paths across sign-in and sign-up flows.
- [ ] 3.2 Join helper tests cover invalid token, disabled invite, already-member join, and successful join mapping where practical.
- [ ] 3.3 `npm run test:unit` passes.
- [ ] 3.4 `npm run lint` passes.
- [ ] 3.5 `npm run build` passes.

#### Manual

- [ ] 3.6 Signed-out invitee opening a valid invite link is sent to sign-in with the invite return preserved.
- [ ] 3.7 After sign-in, invitee lands back on the join confirmation page.
- [ ] 3.8 New invitee can switch to sign-up with the invite return preserved and still reach the join confirmation path after account creation or email confirmation.
- [ ] 3.9 Signed-in invitee sees a confirmation action and joins only after pressing it.
- [ ] 3.10 Invalid or disabled invite link shows a neutral error page and does not reveal household-only data.
- [ ] 3.11 Successful join redirects to `/dashboard`.

### Phase 4: Route Guards, Redirects, And Handoff

#### Automated

- [ ] 4.1 Guard/helper tests cover owner allowed, member denied for invite management, missing membership allowed for join confirmation, and existing membership blocked from duplicate join where practical.
- [ ] 4.2 Anonymous request to `/household/invite` redirects to `/auth/signin`.
- [ ] 4.3 `npm run test:unit` passes.
- [ ] 4.4 `npm run lint` passes.
- [ ] 4.5 `npm run build` passes.

#### Manual

- [ ] 4.6 Owner can manage invites from the owner route.
- [ ] 4.7 Member cannot manage invites.
- [ ] 4.8 User with no household can join from a valid invite.
- [ ] 4.9 User who already belongs to a household cannot join again through the same or another invite.
- [ ] 4.10 `/join/<token>` remains usable as a shareable link for signed-out users.

### Phase 5: Verification And Documentation

#### Automated

- [ ] 5.1 `context/changes/invite-lifecycle-and-join/verification.md` exists and lists all commands run.
- [ ] 5.2 `npm run test:unit` passes.
- [ ] 5.3 `npm run lint` passes.
- [ ] 5.4 `npm run build` passes.
- [ ] 5.5 If migrations changed, `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` pass.

#### Manual

- [ ] 5.6 Confirm S-02 delivers only invite link creation/reuse, invite disabling, preserved auth redirect, and confirmed join.
- [ ] 5.7 Confirm S-03 can rely on at least two household members after a successful join.
- [ ] 5.8 Confirm no member-removal, completion, or dashboard-score behavior was added accidentally.
