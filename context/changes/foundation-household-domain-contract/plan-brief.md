# Household Domain Contract — Plan Brief

> Full plan: `context/changes/foundation-household-domain-contract/plan.md`

## What & Why

F-01 creates the shared household domain contract needed before product slices build setup, invites, completions, and the dashboard. It turns the PRD's owner/member, chore-weight, self-completion, soft-undo, two-week score, and household-only visibility rules into concrete schema, RLS, TypeScript, and tests.

## Starting Point

The app already has Astro, React, Supabase SSR auth, protected `/dashboard`, and Cloudflare Workers runtime wiring. It has no household-specific tables, migrations, domain helpers, score calculator, or domain tests yet.

## Desired End State

Future roadmap slices can rely on stable table names, role literals, helper contracts, and score behavior. The database enforces household-only access through RLS, the app has a testable score function, and the contract is documented in `docs/reference/contract-surfaces.md`.

## Key Decisions Made

| Decision | Choice | Why |
| --- | --- | --- |
| Schema breadth | Full minimal model | One contract should unblock `S-01` through `S-04` without later foundation redesign. |
| Membership rule | DB-enforced one household per user | It matches the MVP non-goal and prevents inconsistent state. |
| Score location | TypeScript domain function | It is easier to test and reason about before dashboard/API complexity exists. |
| Undo model | Soft undo with `undone_at` | It preserves history while keeping active score filtering explicit. |
| Access control | RLS in the migration | Household visibility must be enforced by the database, not only future API code. |
| Invite model | One active token per household | It matches the PRD while keeping owner control simple. |
| Test level | Unit + migration/RLS smoke | It verifies the risky contract parts without building full E2E before UI exists. |

## Scope

**In scope:**

- Supabase migration for households, members, chores, completions, and invites.
- RLS policies for member visibility, owner-only chore/invite actions, self-completion, and own undo.
- TypeScript domain types, score calculator, repository helpers, and guard contracts.
- Minimal unit and database smoke verification.
- Contract surface registry for future slices.

**Out of scope:**

- Household setup UI, invite UI, completion UI, and dashboard UI.
- Full product API routes for the later slices.
- Member removal, multi-household support, weight editing, historical charts, templates, notifications, or expected-frequency logic.
- Service-role access from application code.

## Architecture / Approach

Implement bottom-up: schema and RLS first, TypeScript domain contracts second, verification third, and route-readiness guards last. The database owns access safety; TypeScript owns score calculation and future server-route contracts.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Database Domain Contract | Product tables, constraints, indexes, and RLS | RLS gets too permissive or too hard to use. |
| 2. TypeScript Domain Layer | Types, score function, repository helpers, contract registry | Helpers become a premature full backend. |
| 3. Verification Contract | Unit tests, database smoke checks, verification notes | Test tooling grows beyond MVP needs. |
| 4. Protected Route Readiness | Guard contract and handoff notes for future routes | Route placeholders accidentally create UI/API scope. |

**Prerequisites:** Existing Supabase auth wiring and F-01 change folder.
**Estimated effort:** About 2-3 focused implementation sessions across 4 phases.

## Open Risks & Assumptions

- Local Supabase database testing must be available for migration/RLS smoke checks.
- Supabase policy SQL must be reviewed carefully because future slices will rely on it for security.
- The TypeScript score function is enough for MVP scale; SQL aggregation can be revisited only if data volume grows.

## Success Criteria (Summary)

- The migration creates the agreed five-table household contract with RLS and MVP constraints.
- Score tests prove the two-week percentage-share rule, soft undo, and zero-total behavior.
- Future slices can read `docs/reference/contract-surfaces.md` and know which tables, fields, helpers, and invariants to use.
