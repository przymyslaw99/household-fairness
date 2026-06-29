# Shared Fairness Dashboard - Plan Brief

> Full plan: `context/changes/shared-fairness-dashboard/plan.md`

## What & Why

S-04 delivers the north-star shared dashboard: each household member can see the current two-week Fairness Score, supporting raw points, and the recent recorded chores that produced it. The goal is a transparent contribution view, not a verdict about who is fair or unfair.

## Starting Point

F-01 already provides the score calculator, score-window constants, active completion query, household membership model, and guard helpers. S-03 is planned to replace `/dashboard` with the completion loop and active 14-day history, so S-04 extends that same route with read-only score presentation.

## Desired End State

An authenticated household member opens `/dashboard` and sees a neutral score summary first, followed by the existing completion/history flow. Every member appears with equal visual weight, exact percentage, raw points, a clear identifier fallback, and visible 14-day window copy. If there is no active recent activity, every member shows `0%` and the page explains why.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Score presentation | Equal visual weight list | Avoids leaderboard framing while still showing exact percentages and raw points. |
| Member labels | User/member identifier fallback | The current schema has no display names, and profile work would expand S-04. |
| Zero activity | Show all members at `0%` with explanation | Matches score math and keeps the rolling-window rule visible. |
| History detail | Full active 14-day history | The visible rows should explain the raw point totals. |
| Dashboard integration | Score summary above S-03 sections | Makes S-04 the first-view product value while preserving completion actions. |
| Refresh behavior | Server-rendered refresh after redirect | Fits the existing POST/redirect pattern without realtime complexity. |
| Verification | Focused helper tests plus manual seeded UI checks | Covers the new integration without inventing broad E2E infrastructure. |

## Scope

**In scope:**

- Add a household member listing helper if needed.
- Add a dashboard score composition helper and unit tests.
- Render a neutral Fairness Score summary on `/dashboard`.
- Show exact percentages, raw points, visible 14-day window copy, and zero-activity state.
- Reuse the active 14-day completion history as the score explanation.
- Preserve S-03 completion and undo behavior.
- Add verification notes and update contract references.

**Out of scope:**

- Ranking, leaderboards, gamification, winner/loser language, or verdict copy.
- Display-name/profile schema or email lookup.
- Realtime updates, polling, optimistic score updates, or separate dashboard routes.
- Historical charts, all-time totals, custom date ranges, or old-score carryover.
- Schema migration unless an existing read contract is proven insufficient.

## Architecture / Approach

The dashboard remains server-rendered on `/dashboard`. It loads the current household member, household members, and active score-window completions, then maps those inputs through `calculateFairnessScore` into a presentation model consumed by `FairnessSummary`. S-03's completion/history UI stays on the same page below the score summary.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Dashboard Score Data Contract | Member listing, score composition helper, unit tests | Accidentally omitting members with zero completions |
| 2. Neutral Fairness Summary UI | Equal-weight score rows, raw points, window and zero-state copy | Making the score feel like a ranking or verdict |
| 3. History Explanation Integration | Score history reuse and completion/undo refresh alignment | Displayed history not matching the computed raw points |
| 4. Verification And Handoff | Contract docs, verification log, final manual checks | Closing S-04 without seeded multi-member UI proof |

**Prerequisites:** F-01 remains implemented; S-03 should land or be available as the planned `/dashboard` completion loop before S-04 implementation.
**Estimated effort:** About 2 focused implementation sessions across 4 phases.

## Open Risks & Assumptions

- S-04 assumes S-03 owns the completion and undo forms on `/dashboard`.
- Member labels will be technical identifiers until a future profile/display-name feature exists.
- Manual verification needs seeded or implemented setup/invite/completion data with at least two household members.

## Success Criteria (Summary)

- `/dashboard` shows each household member's exact percentage share and raw points for the rolling 14-day window.
- Recent active completions visibly explain the raw point totals behind the score.
- The dashboard stays neutral: no ranking, no winner/loser framing, and no objective fairness verdict.
