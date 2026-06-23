# Owner Household Setup - Plan Brief

> Full plan: `context/changes/owner-household-setup/plan.md`
> Research sources: `context/foundation/roadmap.md`, `context/foundation/prd.md`, `docs/reference/contract-surfaces.md`

## What & Why

S-01 lets an authenticated owner create a household and define the first chore weights that the shared score will use. This is the first owner-visible product slice after F-01, turning the household contract into a usable setup flow while keeping invite, completion, and dashboard work parked.

## Starting Point

F-01 already created the household tables, owner/member roles, RLS policies, score contracts, repository helpers, and guard helpers. The app has auth pages, a protected `/dashboard`, and server-side Supabase clients, but no setup route or initial chore creation flow.

## Desired End State

An authenticated user without a household can open `/setup/household`, enter a household name, add one or more chore rows with point weights, submit once, and land on `/dashboard`. Users who already belong to a household are redirected away from setup. The created household has an owner membership and at least one weighted chore, ready for later invite and completion slices.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Setup route | `/setup/household` | Keeps first-run setup separate from the later dashboard experience. | Plan |
| Initial chores | Require at least one chore | S-01 must create the first scoring model, not only an empty household. | Plan |
| Form shape | Dynamic add/remove chore rows | Supports realistic manual setup without starter templates. | Plan |
| Duplicate chore names | Reject duplicates after trimming/case normalization | Prevents confusing score inputs without changing global DB uniqueness. | Plan |
| Submit behavior | One browser POST | Keeps the owner experience simple and follows existing server-posted form patterns. | Plan |
| Write safety | Atomic setup contract | Avoids a partial state where a household exists but initial chores failed. | Plan |
| Existing members | Redirect to `/dashboard` | Respects one-household-per-user and avoids duplicate setup attempts. | Plan |
| Test focus | Pure validation tests plus existing quality gates | Gives high-signal coverage without inventing a route-test framework. | Plan |

## Scope

**In scope:**

- `/setup/household` protected setup route.
- Dynamic household/chore setup form.
- Server POST handler for setup.
- Setup validation helper and unit tests.
- Repository/database contract for household plus initial chore creation.
- Redirect behavior for anonymous users and existing household members.
- Contract documentation and verification log.

**Out of scope:**

- Invite link creation, joining, or disabling.
- Member management or removal.
- Completion recording or undo.
- Fairness dashboard UI.
- Starter chore templates.
- Post-creation chore weight editing.
- Multi-household support.

## Architecture / Approach

The flow follows the existing auth pattern: Astro page renders a hydrated React form, the form posts to an Astro API route, the route uses the request-scoped Supabase client, and errors redirect back through `?error=`. The main addition is an S-01 setup contract that validates input and creates household plus initial chores atomically, so the owner cannot land in a half-created setup state.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Setup Domain Contracts | Validation, atomic setup DB function, types, repository helper | Over-expanding F-01 instead of adding only S-01 setup contracts |
| 2. Setup Route And Form | `/setup/household`, dynamic form, POST handler | Form/server validation drifting apart |
| 3. Guards And Redirects | Auth protection and existing-membership redirects | Blocking the intended no-household setup path |
| 4. Verification And Handoff | Tests, docs, verification log, roadmap handoff | Marking S-01 complete before manual setup checks |

**Prerequisites:** F-01 household domain contract remains implemented and verified.
**Estimated effort:** ~2-3 focused implementation sessions across 4 phases.

## Open Risks & Assumptions

- The plan assumes adding one S-01 database function is acceptable to avoid partial setup writes.
- The dashboard is still a placeholder, so successful setup redirects there as a handoff point rather than a complete product destination.
- Route-level automated tests remain out of scope unless the repo later adopts a route-test pattern.

## Success Criteria (Summary)

- A signed-in user without a household creates a household and at least one weighted chore from `/setup/household`.
- Invalid setup input is rejected consistently on client and server, especially duplicate chore names and invalid weights.
- Existing household members cannot run setup again, and anonymous users are redirected to sign in.
