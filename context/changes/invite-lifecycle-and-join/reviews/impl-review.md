<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Invite Lifecycle And Join

- **Plan**: `context/changes/invite-lifecycle-and-join/plan.md`
- **Scope**: Phases 1-5 of 5
- **Date**: 2026-06-29
- **Initial Verdict**: APPROVED with warning
- **Final Verdict**: APPROVED after triage fixes
- **Fix Commits**: `0bdfaa8` (`fix(invite-lifecycle-and-join): map disabled invite join errors`), `c441660` (`fix(invite-lifecycle-and-join): add unavailable invite error code`)
- **Findings**: 0 critical, 1 warning, 0 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification

| Command | Result | Notes |
|---------|--------|-------|
| `npm run test:unit` | PASS | Escalated run passed: 9 test files, 39 tests. Initial sandboxed `cmd` run failed before tests because Vite could not read `.env` (`EPERM`). |
| `npm run lint` | PASS | Exited successfully with repeated known `astro-eslint-parser` `projectService` compatibility warnings. |
| `npm run build` | PASS | Exited successfully with the existing sitemap warning about missing `site` config. |
| `npx supabase db reset` | PASS | Applied migrations through `20260627_invite_lifecycle.sql`; warned that no `supabase/seed.sql` matched and that a newer Supabase CLI is available. |
| `npx supabase db test supabase/tests/household_domain_contract.sql` | PASS | `Files=1, Tests=30, Result: PASS`; warned that a newer Supabase CLI is available. |

## Findings

No open findings.

## Resolved During Review

### F1 - Join RPC invalid-or-disabled error falls through to generic copy

- **Previous severity**: WARNING
- **Previous impact**: LOW - quick decision; fix is obvious and narrowly scoped
- **Previous dimension**: Safety & Quality
- **Location**: `src/lib/household/invites.ts:61`
- **Detail**: The join API maps repository errors through `mapInviteRepositoryError`, but the existing `join_household_with_invite` RPC raises `Invite is invalid or disabled` while the mapper only checks exact `Invite is invalid` and `Invite is disabled` messages. If an invite is disabled or becomes invalid between confirmation page load and POST, the user is redirected back to the join route with the generic `We could not update the invite right now.` message instead of the planned neutral invalid/disabled invite copy. Unit tests cover the two split strings, but not the actual DB string at `supabase/migrations/20260616_household_domain_contract.sql:274`.
- **Resolution**: FIXED - added the exact `Invite is invalid or disabled` backend string to `mapInviteRepositoryError`, mapped it to the distinct `INVITE_ERROR_CODES.unavailableInvite` code, and returned the user-facing message `Invite link is invalid or no longer active.`.
- **Evidence**: `src/lib/household/invites.test.ts` covers the combined backend message; `npx vitest run src/lib/household/invites.test.ts` passed with 6 tests, and `npm run test:unit` passed with 9 files and 39 tests.
