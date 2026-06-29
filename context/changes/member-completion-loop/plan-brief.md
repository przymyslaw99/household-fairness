# Member Completion Loop - Plan Brief

> Full plan: `context/changes/member-completion-loop/plan.md`

## What & Why

S-03 lets a household member record real contribution events: see chore weights, mark a chore complete for themselves, undo their own mistake, and see the recent active history. This creates the trustworthy event stream that S-04 will use for the shared Fairness Score dashboard.

## Starting Point

F-01 already created the core household tables, completion RLS rules, score-window constants, repository helpers, and guard helpers. `/dashboard` is still a placeholder, S-01 is planned but not visible in source yet, and S-02 has no plan yet, so S-03 implementation depends on those earlier slices leaving a household, chores, and joined members.

## Desired End State

An authenticated household member opens `/dashboard`, sees chore names and point weights, records a completion through a server POST, and returns to refreshed history. The member can undo only their own active completions shown in the 14-day history, and households with no chores get a clear owner-focused blocked state.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Route | Use `/dashboard` | It is already protected and currently only a placeholder, making it the fastest path to a real product loop. |
| Write flow | Server POST plus redirect | This matches existing auth/setup form patterns and avoids client-side Supabase writes. |
| Undo rule | Undo any active own completion shown in recent history | It follows F-01's soft-undo contract while keeping other members' history protected. |
| History window | Current 14-day score window | It aligns the list with the future Fairness Score explanation. |
| No-chore state | Owner-focused blocked state | It avoids pretending non-owner members can create chores in this slice. |
| Error handling | Redirect back with short `?error=` messages | It is consistent with existing server-posted flows. |
| Verification | Vitest helper tests plus pgTAP/RLS smoke checks | It covers both local parsing behavior and the ownership trust boundary. |

## Scope

**In scope:**

- Replace placeholder `/dashboard` with the member completion loop.
- Show household chore names and point weights.
- Add server API routes for current-user completion creation and own undo.
- Show active recent completions from the rolling 14-day window.
- Show Undo only for the current user's active completions.
- Add helper tests, DB smoke checks, contract docs, and verification log.

**Out of scope:**

- Full Fairness Score percentages, member ranking, or raw-point dashboard.
- Invite lifecycle or join UI.
- Owner chore creation/editing.
- Historical views outside the current score window.
- Client-side Supabase writes or optimistic UI.

## Architecture / Approach

The dashboard loads the current household member with the existing guard, lists household chores, computes the 14-day window from the score constants, and loads active recent completions. Chore completion and undo are server-posted forms that submit only IDs; API handlers resolve the authenticated user and household server-side before calling repository helpers backed by RLS.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Completion Domain Contracts | Form parsers and repository helpers for create/undo/history | Accidentally trusting user/household fields from the browser |
| 2. Dashboard Completion UI | `/dashboard` chore list, history, undo controls, empty/error states | Expanding into S-04 score dashboard scope |
| 3. Completion API Routes | POST endpoints for completion and undo | Weak ownership checks around undo |
| 4. Verification And Handoff | pgTAP coverage, contract docs, verification log | Missing manual seeded-data prerequisites |

**Prerequisites:** F-01 complete; S-01/S-02 or seeded local data must provide a household with at least one weighted chore and at least one member.
**Estimated effort:** About 2-3 implementation sessions across 4 phases.

## Open Risks & Assumptions

- S-01/S-02 are not fully visible in source yet, so manual S-03 verification may need seeded data until those slices land.
- The completion history initially identifies members by available user id unless a later slice introduces display names.
- S-03 intentionally shows active score-window history only; undone rows remain in the database but do not appear as active contributions.

## Success Criteria (Summary)

- A household member can complete a chore for themselves from `/dashboard`.
- The same member can undo their own active completion, while other members cannot undo it.
- Recent history shows active completions from the 14-day score window without showing Fairness Score percentages yet.
