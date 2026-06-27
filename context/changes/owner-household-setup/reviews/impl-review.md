<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Owner Household Setup

- **Plan**: `context/changes/owner-household-setup/plan.md`
- **Scope**: Phases 1-4 of 4
- **Date**: 2026-06-27
- **Initial Verdict**: NEEDS ATTENTION
- **Final Verdict**: APPROVED after triage fixes
- **Fix Commit**: `0135778` (`Fix owner household setup review findings`)
- **Findings**: 0 critical, 2 warnings, 2 observations

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
| `npm run test:unit` | Passed | Vitest reported 3 files and 19 tests passing after review fixes. |
| `npx supabase db reset` | Passed | Applied `20260616_household_domain_contract.sql` and `20260618_owner_household_setup.sql`; Supabase CLI printed the known update notice. |
| `npx supabase db test supabase/tests/household_domain_contract.sql` | Passed | pgTAP reported 1 file, 24 tests, `Result: PASS`. |
| `npm run lint` | Passed | Printed the known `astro-eslint-parser` `projectService` warning. |
| `npm run build` | Passed | Printed the known Astro sitemap `site` warning. |

## Findings

No open findings.

## Resolved During Review

### F1 - RPC lets missing chore weights fall through to DB constraint

- **Previous severity**: WARNING
- **Previous dimension**: Safety & Quality
- **Location**: `supabase/migrations/20260618_owner_household_setup.sql:54`
- **Resolution**: FIXED - changed RPC validation to reject `chore_weight is null or chore_weight <= 0`, and normalized out-of-range integer casts to the same validation error.
- **Evidence**: `supabase/tests/household_domain_contract.sql` now covers missing chore weights and out-of-range chore weights; pgTAP passes with 24 tests.

### F2 - Setup payload size is unbounded

- **Previous severity**: WARNING
- **Previous dimension**: Safety & Quality
- **Location**: `src/lib/household/setup.ts:55`
- **Resolution**: FIXED - added setup limits of 80 characters for household names, 80 characters for chore names, and 20 initial chores. Mirrored those limits in TypeScript validation, form parsing, SQL RPC validation, unit tests, and DB tests.
- **Evidence**: `src/lib/household/setup.test.ts` covers overlong household names, overlong chore names, and too many chores; pgTAP covers the SQL-side limits.

### F3 - Raw repository errors are reflected into `?error=`

- **Previous severity**: OBSERVATION
- **Previous dimension**: Safety & Quality
- **Location**: `src/pages/api/household/setup.ts:49`
- **Resolution**: FIXED - replaced raw setup repository/RPC error reflection with a stable user-facing setup failure message.
- **Evidence**: `src/pages/api/household/setup.ts` now redirects repository failures with `SETUP_FAILED_MESSAGE`.

### F4 - DB verification could not run in the first local review session

- **Previous severity**: OBSERVATION
- **Previous dimension**: Success Criteria
- **Location**: N/A
- **Resolution**: FIXED - reran the previously blocked Supabase commands after the local Docker/Supabase environment was available.
- **Evidence**: `npx supabase db reset` passed, and `npx supabase db test supabase/tests/household_domain_contract.sql` passed with 24 tests.
