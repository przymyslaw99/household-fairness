<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Member Completion Loop

- **Plan**: `context/changes/member-completion-loop/plan.md`
- **Scope**: Phases 1-4 of 4
- **Date**: 2026-06-29
- **Initial Verdict**: NEEDS ATTENTION
- **Final Verdict**: APPROVED after triage fixes
- **Findings**: 0 critical, 3 warnings, 1 observation

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
| `npm run test:unit` | Passed | Vitest reported 10 files and 46 tests passing. Initial sandboxed run failed with `EPERM` reading `.env`; escalated rerun passed. |
| `npm run lint` | Passed | Printed repeated known `astro-eslint-parser` `projectService` warnings and exited successfully. |
| `npm run build` | Passed | Astro server build completed. Printed known Cloudflare/image/session and sitemap `site` warnings. |
| `npx supabase db reset` | Passed | Local database reset completed on branch `master`; printed known missing seed and Supabase CLI update warnings. |
| `npx supabase db test supabase/tests/household_domain_contract.sql` | Passed | Rerun after F1 fix reported 1 file, 31 tests, `Result: PASS`. |

## Findings

No open findings.

## Resolved During Review

### F1 - Missing outsider completion pgTAP case

- **Previous severity**: WARNING
- **Previous impact**: LOW - quick decision; fix is obvious and narrowly scoped
- **Previous dimension**: Success Criteria
- **Location**: `supabase/tests/household_domain_contract.sql:232`
- **Detail**: Phase 4 required pgTAP coverage for "outsider cannot create completion in another household." The current completion block covers member own create, member cannot create as another user, own undo, and cannot undo another user's completion, but it does not attempt a completion insert as outsider user `00000000-0000-4000-8000-000000000003`.
- **Resolution**: FIXED - added a pgTAP `throws_ok` completion insert while authenticated as the outsider, targeting the household chore, and asserting the RLS denial.
- **Evidence**: `npx supabase db test supabase/tests/household_domain_contract.sql` passed with 31 tests.

### F2 - S-03 roadmap status still proposed

- **Previous severity**: WARNING
- **Previous impact**: LOW - quick decision; fix is obvious and narrowly scoped
- **Previous dimension**: Plan Adherence
- **Location**: `context/foundation/roadmap.md:31`
- **Detail**: Phase 4 required the roadmap status note to update S-03 only after implementation and manual confirmation. Those gates are marked complete, but S-03 still says `proposed` in the at-a-glance row, detailed slice section, and backlog handoff. The Phase 4 commit message says roadmap S-03 was marked implemented, but the current roadmap does not reflect that.
- **Resolution**: FIXED - changed the three S-03 roadmap status entries from `proposed` to `implemented`.
- **Evidence**: `context/foundation/roadmap.md` now marks S-03 implemented in the at-a-glance table, detailed slice section, and backlog handoff.

### F3 - Verification log omits detailed manual completion evidence

- **Previous severity**: WARNING
- **Previous impact**: LOW - quick decision; fix is obvious and narrowly scoped
- **Previous dimension**: Success Criteria
- **Location**: `context/changes/member-completion-loop/verification.md:26`
- **Detail**: Phase 4 required the verification log to record manual completion and undo checks, including seeded-data prerequisites. The log records broad S-03 scope confirmations and prerequisites, but it does not preserve the Phase 2/3 manual evidence for mark-complete, own undo, other-member no-undo, and malformed direct POST error checks that are marked complete in the plan.
- **Resolution**: FIXED - expanded `verification.md` with dated manual completion-loop rows for dashboard access, mark-complete, own undo, other-member no-undo, malformed direct POST errors, and the available account/seeded-data context.
- **Evidence**: `context/changes/member-completion-loop/verification.md` now records the detailed route-level manual checks and notes that concrete account emails or row ids were not preserved in the original manual run.

### F4 - Contract reference title still frames the document as F-01 only

- **Previous severity**: OBSERVATION
- **Previous impact**: LOW - quick decision; fix is obvious and narrowly scoped
- **Previous dimension**: Pattern Consistency
- **Location**: `docs/reference/contract-surfaces.md:1`
- **Detail**: The reference now includes S-03 completion helpers and routes, but its title and intro still say it records names introduced by `foundation-household-domain-contract`. That is not a runtime problem, but it makes the reference slightly misleading for S-04 readers.
- **Resolution**: FIXED - retitled `docs/reference/contract-surfaces.md` and updated its intro to describe household contract surfaces across implemented roadmap slices.
- **Evidence**: `docs/reference/contract-surfaces.md` now uses the cross-slice `Household Contract Surfaces` heading and intro.

## Positive Coverage Notes

- Runtime completion creation derives `household_id` and `completed_by` from authenticated server context in `src/lib/household/repository.ts`.
- Runtime undo derives `undone_by` server-side and scopes the update by completion id, current household, current user, and `undone_at is null`.
- Dashboard history is bounded by the rolling score window and excludes undone completions.
- Forms submit only `chore_id` or `completion_id`; no client-side Supabase write path was introduced.
- No Fairness Score percentages, rankings, owner chore editing, invite management expansion, or history outside the active 14-day window was found in S-03 runtime UI.
