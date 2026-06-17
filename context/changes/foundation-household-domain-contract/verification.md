# Verification Log

## 2026-06-17 22:55 Europe/Warsaw - Phase 3

| Command | Result | Notes |
| --- | --- | --- |
| `npx supabase db test --help` | Passed | Confirmed local database tests run through pgTAP. Supabase CLI reported v2.98.2 installed and v2.107.0 available. |
| `npx supabase db reset` | Passed | Migration `20260616_household_domain_contract.sql` applied cleanly on local branch `master`. |
| `npx supabase db test supabase/tests/household_domain_contract.sql` | Passed | pgTAP reported `Files=1, Tests=15` and `Result: PASS`. Covers first-household creation, invite join, one-household-per-user, member visibility, outsider invisibility, owner-only chore/invite writes, self-completion, denial of another user's completion, denial of another user's undo, and own undo. |
| `npm run lint` | Passed | ESLint exited 0. |
| `npm run build` | Passed | Astro build exited 0. |

Implementation iterations:

- Iteration 1: Added `supabase/tests/household_domain_contract.sql` and this verification log.
- Iteration 2: Fixed the pgTAP test after the first run showed incorrect `throws_ok` argument shape and a data-modifying CTE in a subquery position.

Known warnings:

- `npx supabase db reset` reports `WARN: no files matched pattern: supabase/seed.sql`; the database reset still completes successfully.
- Supabase CLI reports v2.98.2 installed and v2.107.0 available.
- `npm run lint` prints the existing `astro-eslint-parser` warning that `projectService` is parsed as `project: true`.
- `npm run build` prints the existing Astro sitemap warning: the Sitemap integration requires the `site` config option and is skipped.
