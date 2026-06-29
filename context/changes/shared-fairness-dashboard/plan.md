# Shared Fairness Dashboard Implementation Plan

## Overview

Implement roadmap slice `S-04`: turn the existing `/dashboard` experience into the north-star shared fairness view by showing each household member's percentage share, supporting raw points, and the recent active chore completions from the rolling 14-day score window.

## Current State Analysis

F-01 already provides the score contract and the read-side primitives needed by S-04: `calculateFairnessScore`, `SCORE_WINDOW_DAYS`, `listActiveRecentCompletions`, score invariants, RLS-backed household visibility, and guard helpers for current household membership. `/dashboard` is currently a placeholder in source, while the S-03 plan is expected to replace it with the completion loop, active 14-day completion history, and server POST flows for completion and undo.

S-04 should therefore be a read-side dashboard composition layer over the existing contract and the S-03 completion loop. It should not add profile/display-name schema, realtime subscriptions, historical analytics, ranking, or new write flows.

Implementation precondition: do not start S-04 implementation until S-03 is implemented and verified. Before Phase 1 work begins, confirm that the dashboard already includes the S-03 completion loop and active 14-day history, `src/components/household/CompletionHistory.tsx` exists, and the completion/undo POST routes exist. If any of those are missing, abort S-04 and resume `member-completion-loop` first rather than pulling S-03 scope into this change.

## Desired End State

An authenticated household member opens `/dashboard` and sees a neutral shared score summary first: equal-weight member rows, exact percentages, raw points, and the visible 14-day window boundary. The same page still preserves the S-03 completion loop below the score summary. If there are no active completions in the current 14-day window, every member appears at `0%` with `0` raw points and a short explanation that the score only reflects recorded chores in this window.

### Key Discoveries:

- `context/foundation/roadmap.md` defines `shared-fairness-dashboard` as S-04 and scopes it to percentage share, raw points, and recent completed chores in the rolling two-week window.
- `context/foundation/prd.md` defines US-01 and FR-010 as the dashboard contract, with guardrails against presenting the Fairness Score as an objective verdict.
- `docs/reference/contract-surfaces.md` maps S-04 to `listActiveRecentCompletions`, `calculateFairnessScore`, `SCORE_WINDOW_DAYS`, and score invariants.
- `src/lib/household/score.ts` already calculates `window_start`, `window_end`, `total_points`, each member's `raw_points`, and each member's `percentage`.
- `src/lib/household/repository.ts` already lists active recent completions with chore name and weight, but it does not yet expose a household member list helper for rendering every member at equal visual weight.
- `src/lib/household/types.ts` currently has no user profile or display-name surface, so S-04 should use member/user identifiers as a clearly labeled fallback.
- `context/changes/member-completion-loop/plan.md` already reserves `/dashboard` for the S-03 completion loop and explicitly defers Fairness Score percentages to S-04.
- `src/middleware.ts` already protects `/dashboard`; S-04 can keep the route boundary unchanged unless implementation adds new protected API routes.

## What We're NOT Doing

- No member ranking, winner/loser language, leaderboard, badges, gamification, or judgemental fairness verdicts.
- No display-name/profile schema or auth user email lookup. Member identity uses the available user/member identifier until a later profile slice exists.
- No realtime subscriptions, polling, optimistic score updates, or cross-user live refresh. The score refreshes on the server-rendered `/dashboard` response after S-03 redirects.
- No historical charts, all-time totals, custom date ranges, or views outside the current rolling 14-day window.
- No schema migration unless implementation discovers a missing read contract that cannot be solved safely with the existing tables.
- No duplicate recent-history implementation if S-03 already renders the active 14-day history; S-04 should reuse or refactor that section.

## Implementation Approach

Keep S-04 as a server-rendered dashboard composition. Load the current household member with the existing guard, list all household members, list active recent completions using the current 14-day window, adapt completions into the score calculator input, and render a neutral score summary above the S-03 completion/history sections. Use equal visual weight for each member and avoid proportional ordering that implies ranking.

## Critical Implementation Details

### Neutral Score Semantics

The dashboard must present Fairness Score as a limited indicator based on recorded chores in the current 14-day window. Equal-weight member rows are intentional: do not sort members by percentage, do not label a leader, and do not use winner/loser copy.

### Member Identity Fallback

The current domain model has `household_members.user_id` but no display names. S-04 should label this clearly, for example as a member identifier, rather than adding profile schema or fetching auth emails in this slice.

### Server Refresh Boundary

S-03 writes use server POST plus redirect. S-04 should rely on the redirected `/dashboard` request to recompute score from the database. Realtime and polling are out of scope for this MVP slice.

## Phase 1: Dashboard Score Data Contract

### Overview

Add the small read-side data contract needed to compute and render a full household score summary for every member.

### Precondition

Confirm S-03 is implemented and verified before editing files for this phase. Required evidence: `/dashboard` is no longer the placeholder-only authenticated page, `CompletionHistory.tsx` exists, and the completion/undo POST routes from `member-completion-loop` exist. If this check fails, stop and implement S-03 first.

### Changes Required:

#### 1. Household member listing helper

**File**: `src/lib/household/repository.ts`

**Intent**: Give the dashboard a typed way to load every current household member so members with zero active completions still appear in the score summary.

**Contract**: Export `listHouseholdMembers(supabase, householdId)` or equivalent. It must query `household_members` for the guarded household, order by a stable field such as `created_at`, and return `RepositoryResult<HouseholdMember[]>`.

#### 2. Dashboard score composition helper

**File**: `src/lib/household/dashboard-score.ts`

**Intent**: Keep the Astro page thin by centralizing the mapping from members plus active completions into a presentation-ready score model.

**Contract**: Export a pure helper that accepts household members, active completions, and `now`, then calls `calculateFairnessScore`. The returned model should include every member, `user_id`, role when available, raw points, percentage, total points, `window_start`, and `window_end`. If an active completion has no joined chore or chore weight, fail closed with a typed unavailable/error result for the dashboard instead of silently dropping the completion or treating it as zero points.

#### 3. Score composition tests

**File**: `src/lib/household/dashboard-score.test.ts`

**Intent**: Prove S-04 dashboard composition behavior independently from Astro rendering.

**Contract**: Cover equal inclusion of members with and without completions, 0% output when total active points are zero, exclusion of completions already filtered or outside the score window through the score calculator, stable member ordering matching the input member order, and the fail-closed result when an active completion is missing joined chore weight.

#### 4. Type updates if needed

**File**: `src/lib/household/types.ts`

**Intent**: Add only the minimal exported types needed by the dashboard score helper and UI components.

**Contract**: Prefer composing existing `HouseholdMember`, `ActiveCompletionWithChore`, and `FairnessScoreResult` types. Do not add profile or display-name fields.

### Success Criteria:

#### Automated Verification:

- Dashboard score helper tests pass with `npm run test:unit`.
- Existing score and guard tests continue to pass with `npm run test:unit`.
- Repository helper types compile through `npm run build`.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Review the data contract and confirm members with no active completions are still represented.
- Confirm Phase 1 adds no dashboard UI, profile schema, realtime, or ranking behavior.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 2: Neutral Fairness Summary UI

### Overview

Render the shared Fairness Score summary above the existing S-03 completion loop on `/dashboard`.

### Changes Required:

#### 1. Dashboard server data loading

**File**: `src/pages/dashboard.astro`

**Intent**: Extend the S-03 dashboard data load with score inputs and computed score output.

**Contract**: Reuse the request-scoped Supabase client, `requireCurrentHouseholdMember`, S-03 chore/completion loading, `SCORE_WINDOW_DAYS`, `listHouseholdMembers`, and the dashboard score helper. Keep `/dashboard` as the route and place the score summary before completion controls/history.

#### 2. Fairness summary component

**File**: `src/components/household/FairnessSummary.astro`

**Intent**: Show each household member's percentage and raw points with equal visual weight.

**Contract**: Render one row/card per member in stable input order. Use an Astro component because the summary is static server-rendered UI unless implementation adds real client-side interactivity. Each row must show exact percentage, raw points, and the fallback member identifier. Do not sort by score, do not emphasize the highest score, and do not use proportional bars unless the implementation can prove they do not imply ranking; the plan default is equal-weight rows.

#### 3. Score window explanation

**File**: `src/components/household/FairnessSummary.astro`

**Intent**: Make the two-week boundary visible so users understand what the score includes.

**Contract**: Display the current `SCORE_WINDOW_DAYS` window and the computed `window_start`/`window_end` in user-readable copy. The copy should state that the score reflects recorded, active completions in this rolling window.

#### 4. Zero activity state

**File**: `src/components/household/FairnessSummary.astro`

**Intent**: Handle households with members but no active score-window completions without hiding the score contract.

**Contract**: When `total_points` is `0`, show all members at `0%` and `0` raw points plus a short empty-state explanation. Do not carry forward old scores from outside the window.

#### 5. Styling alignment

**File**: `src/components/household/FairnessSummary.astro`

**Intent**: Keep the UI consistent with the existing component rules and avoid decorative marketing layout.

**Contract**: Use shared UI primitives where appropriate, `cn()` for conditional Tailwind classes, and restrained dashboard styling. Use icons only where they clarify the score/window concept.

### Success Criteria:

#### Automated Verification:

- Dashboard and `FairnessSummary.astro` compile through `npm run build`.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Authenticated household member opens `/dashboard` and sees the score summary before completion controls/history.
- Every household member appears with equal visual weight, exact percentage, and raw points.
- A household with no active 14-day completions shows all members at `0%` plus an explanatory empty state.
- The visible copy explains that the score is limited to recorded chores in the rolling 14-day window.
- The UI does not rank, highlight a winner, or present the score as an objective verdict.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 3: History Explanation Integration

### Overview

Ensure the recent completed chores shown on `/dashboard` clearly explain the score without duplicating or contradicting the S-03 history.

### Changes Required:

#### 1. Recent history reuse

**File**: `src/pages/dashboard.astro`

**Intent**: Reuse the S-03 active 14-day history as the explanation for the S-04 score.

**Contract**: Pass the same active recent completions used for score calculation to the existing or refactored history component. Do not introduce a second history query with different filters.

#### 2. History component copy

**File**: `src/components/household/CompletionHistory.tsx`

**Intent**: Make the history section read as score evidence, not a separate archive.

**Contract**: Label the list as recent recorded chores or equivalent. Each item should show chore name, weight, completing member/user identifier, and timestamp. The section should communicate that these active rows are what feed the current score.

#### 3. Full active window behavior

**File**: `src/components/household/CompletionHistory.tsx`

**Intent**: Keep the displayed history complete enough to explain raw points.

**Contract**: Show the full active 14-day result set returned by the bounded query. Do not truncate to latest 10 in this slice unless implementation adds an explicit "show all" behavior that still preserves score explainability.

#### 4. Undo interaction alignment

**File**: `src/components/household/CompletionHistory.tsx`

**Intent**: Preserve S-03 undo controls while making the score refresh behavior obvious after redirect.

**Contract**: Keep Undo visible only for the current user's active completions. After undo redirect, the server-rendered dashboard recomputes the score and removes the undone row from active history.

### Success Criteria:

#### Automated Verification:

- History component changes compile through `npm run build`.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.

#### Manual Verification:

- Recent history shows the full active 14-day completion set returned by the dashboard query.
- Raw point totals in the score summary can be traced back to visible history items.
- Undoing an own active completion redirects back to `/dashboard`, removes the row, and updates the score.
- History copy does not imply an all-time archive or include completions outside the score window.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to the next phase.

---

## Phase 4: Verification And Handoff

### Overview

Verify the S-04 dashboard contract, preserve command/manual results, and update references for future work.

### Changes Required:

#### 1. Contract reference update

**File**: `docs/reference/contract-surfaces.md`

**Intent**: Record the S-04 load-bearing helper/component names that future dashboard work should treat as the score surface.

**Contract**: Add concise references to `listHouseholdMembers`, the dashboard score helper, and `FairnessSummary.astro` if introduced. Keep the document short and avoid duplicating plan detail.

#### 2. Verification log

**File**: `context/changes/shared-fairness-dashboard/verification.md`

**Intent**: Preserve the automated and manual evidence for this slice.

**Contract**: Record command, result, date, and relevant notes for `npm run test:unit`, `npm run lint`, `npm run build`, and any Supabase verification run if implementation changes database contracts. Record manual seeded-data checks for two members, zero activity, score-window copy, completion/undo refresh, and neutral presentation.

#### 3. Roadmap status note

**File**: `context/foundation/roadmap.md`

**Intent**: Keep roadmap status current only after implementation is actually complete.

**Contract**: Do not update S-04 status during planning. During implementation, update S-04 only after the slice is implemented, automated checks pass, and manual verification is confirmed.

#### 4. Plan closure

**File**: `context/changes/shared-fairness-dashboard/change.md`

**Intent**: Keep change status aligned with actual implementation state.

**Contract**: This planning pass sets status to `planned`. Implementation should move it to the appropriate later status only after the planned phases complete.

### Success Criteria:

#### Automated Verification:

- `context/changes/shared-fairness-dashboard/verification.md` exists and lists the commands run.
- `npm run test:unit` passes.
- `npm run lint` passes.
- `npm run build` passes.
- If database contracts change, `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` pass.

#### Manual Verification:

- Confirm S-04 delivers percentage share, raw points, visible 14-day window, and recent chore explanation.
- Confirm the dashboard preserves S-03 completion/undo behavior.
- Confirm member identity uses the explicit identifier fallback and does not add profile scope.
- Confirm the dashboard does not rank members or present the score as an objective fairness verdict.

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding to change review.

---

## Testing Strategy

### Unit Tests:

- Test dashboard score composition for members with no completions, mixed raw-point totals, zero total points, and stable member ordering.
- Keep existing `src/lib/household/score.test.ts` coverage for two-week filtering, undone exclusions, raw points, percentages, and divide-by-zero behavior.
- Keep existing guard tests passing.

### Integration / Database Tests:

- No new database test is expected if S-04 only reads existing member/completion data and uses existing RLS-backed helpers.
- If implementation adds a database read contract or changes existing helper behavior, extend `supabase/tests/household_domain_contract.sql` and run `npx supabase db reset` plus `npx supabase db test supabase/tests/household_domain_contract.sql`.

### Manual Testing Steps:

1. Start from a signed-in household member in a household with at least two members and weighted chore completions inside the current 14-day window.
2. Open `/dashboard` and confirm the score summary appears above completion controls/history.
3. Confirm every household member appears with exact percentage, raw points, and a clearly labeled identifier fallback.
4. Confirm the visible history items explain the raw point totals.
5. Mark a chore complete through the S-03 flow and confirm the redirected dashboard recomputes the score.
6. Undo an own active completion and confirm the redirected dashboard removes that row and recomputes the score.
7. Test a household with members but no active 14-day completions and confirm every member shows `0%` and `0` raw points with explanatory copy.
8. Review the page copy and layout for neutral language: no ranking, winner, loser, verdict, or gamification language.

## Performance Considerations

The MVP target is small, low-QPS, and one household per user. S-04 should make bounded per-household reads: current membership, active completions inside the 14-day window, and any S-03 chore data already required by the dashboard. F-01 already added indexes for active completions by household and completed time, so avoid unbounded historical queries or client-side polling.

## Migration Notes

No schema migration is expected. The current tables already store household members, chore weights, active/undone completions, and timestamps required for the Fairness Score. If implementation discovers missing member identity data, keep the S-04 fallback identifier rather than adding profile schema in this slice.

## References

- Roadmap S-04: `context/foundation/roadmap.md`
- PRD US-01 and FR-010: `context/foundation/prd.md`
- F-01 contract reference: `docs/reference/contract-surfaces.md`
- Score calculator: `src/lib/household/score.ts`
- Household repository: `src/lib/household/repository.ts`
- Household types: `src/lib/household/types.ts`
- Household guards: `src/lib/household/guards.ts`
- Dashboard route: `src/pages/dashboard.astro`
- S-03 plan: `context/changes/member-completion-loop/plan.md`
- Protected-route boundary: `src/middleware.ts`

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` - <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Dashboard Score Data Contract

#### Automated

- [x] 1.1 Dashboard score helper tests pass with `npm run test:unit`. — 6c1f891
- [x] 1.2 Existing score and guard tests continue to pass with `npm run test:unit`. — 6c1f891
- [x] 1.3 Repository helper types compile through `npm run build`. — 6c1f891
- [x] 1.4 `npm run lint` passes. — 6c1f891
- [x] 1.5 `npm run build` passes. — 6c1f891

#### Manual

- [x] 1.6 Review the data contract and confirm members with no active completions are still represented. — 6c1f891
- [x] 1.7 Confirm Phase 1 adds no dashboard UI, profile schema, realtime, or ranking behavior. — 6c1f891

### Phase 2: Neutral Fairness Summary UI

#### Automated

- [x] 2.1 Dashboard and `FairnessSummary.astro` compile through `npm run build`. — b3b76ab
- [x] 2.2 `npm run test:unit` passes. — b3b76ab
- [x] 2.3 `npm run lint` passes. — b3b76ab
- [x] 2.4 `npm run build` passes. — b3b76ab

#### Manual

- [x] 2.5 Authenticated household member opens `/dashboard` and sees the score summary before completion controls/history. — b3b76ab
- [x] 2.6 Every household member appears with equal visual weight, exact percentage, and raw points. — b3b76ab
- [x] 2.7 A household with no active 14-day completions shows all members at `0%` plus an explanatory empty state. — b3b76ab
- [x] 2.8 The visible copy explains that the score is limited to recorded chores in the rolling 14-day window. — b3b76ab
- [x] 2.9 The UI does not rank, highlight a winner, or present the score as an objective verdict. — b3b76ab

### Phase 3: History Explanation Integration

#### Automated

- [x] 3.1 History component changes compile through `npm run build`.
- [x] 3.2 `npm run test:unit` passes.
- [x] 3.3 `npm run lint` passes.
- [x] 3.4 `npm run build` passes.

#### Manual

- [x] 3.5 Recent history shows the full active 14-day completion set returned by the dashboard query.
- [x] 3.6 Raw point totals in the score summary can be traced back to visible history items.
- [x] 3.7 Undoing an own active completion redirects back to `/dashboard`, removes the row, and updates the score.
- [x] 3.8 History copy does not imply an all-time archive or include completions outside the score window.

### Phase 4: Verification And Handoff

#### Automated

- [ ] 4.1 `context/changes/shared-fairness-dashboard/verification.md` exists and lists the commands run.
- [ ] 4.2 `npm run test:unit` passes.
- [ ] 4.3 `npm run lint` passes.
- [ ] 4.4 `npm run build` passes.
- [ ] 4.5 If database contracts change, `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` pass.

#### Manual

- [ ] 4.6 Confirm S-04 delivers percentage share, raw points, visible 14-day window, and recent chore explanation.
- [ ] 4.7 Confirm the dashboard preserves S-03 completion/undo behavior.
- [ ] 4.8 Confirm member identity uses the explicit identifier fallback and does not add profile scope.
- [ ] 4.9 Confirm the dashboard does not rank members or present the score as an objective fairness verdict.
