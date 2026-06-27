# Owner Household Setup Verification

Date: 2026-06-25

## Automated Checks

| Command | Result | Notes |
| --- | --- | --- |
| `npm run test:unit` | Pass | `3` test files passed, `16` tests passed. |
| `npm run lint` | Pass | Completed successfully. ESLint printed repeated `astro-eslint-parser` `projectService` warnings but exited `0`. |
| `npm run build` | Pass | Build completed successfully. Astro emitted the existing sitemap warning about missing `site` config. |
| `npx supabase db reset` | Pass | Completed successfully after Docker Desktop was started. Supabase CLI noted a newer version is available, but the reset itself passed. |
| `npx supabase db test supabase/tests/household_domain_contract.sql` | Pass | pgTAP suite passed: `Files=1, Tests=19, Result: PASS`. |

## Manual Scope Checks

- Confirmed from source review that S-01 adds only the owner setup flow: `/setup/household`, `/api/household/setup`, setup validation/parsing, and the atomic `create_household_with_initial_chores` contract.
- Confirmed the setup flow leaves the expected handoff state for later slices: household membership lookup is used in middleware/page/API guards, the owner membership is created by the RPC, and at least one weighted chore is required by validation and database checks.
- Confirmed no invite lifecycle, completion recording, undo flow, or fairness dashboard score UI was added as part of S-01.

## Local Environment Caveats

- Docker Desktop must be running before `npx supabase db reset` and `npx supabase db test supabase/tests/household_domain_contract.sql` can pass locally.
- `npm run build` still prints the pre-existing Astro sitemap warning because `astro.config` does not set `site`.

## Implementation Review Fix Verification

Date: 2026-06-27

| Command | Result | Notes |
| --- | --- | --- |
| `npm run test:unit` | Pass | `3` test files passed, `19` tests passed after setup validation limits were added. |
| `npx supabase db reset` | Pass | Applied `20260616_household_domain_contract.sql` and `20260618_owner_household_setup.sql`; Supabase CLI noted a newer version is available. |
| `npx supabase db test supabase/tests/household_domain_contract.sql` | Pass | pgTAP suite passed: `Files=1, Tests=24, Result: PASS`. |
| `npm run lint` | Pass | Completed successfully. ESLint printed repeated `astro-eslint-parser` `projectService` warnings but exited `0`. |
| `npm run build` | Pass | Build completed successfully. Astro emitted the existing sitemap warning about missing `site` config. |

Review fixes applied:

- Normalized missing, null, invalid, and out-of-range setup RPC chore weights to the same validation error.
- Added setup payload bounds: household names and chore names are capped at 80 characters, and initial chores are capped at 20.
- Capped parsed chore rows before validation to avoid carrying oversized malformed form submissions.
- Replaced raw setup repository/RPC error reflection with a stable user-facing setup failure message.
