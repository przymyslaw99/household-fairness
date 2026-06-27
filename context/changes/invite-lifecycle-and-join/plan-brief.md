# Invite Lifecycle And Join - Plan Brief

> Full plan: `context/changes/invite-lifecycle-and-join/plan.md`
> Research sources: `context/foundation/roadmap.md`, `context/foundation/prd.md`, `docs/reference/contract-surfaces.md`

## What & Why

S-02 lets an owner create a shareable household invite, lets a second signed-in user join through it, and lets the owner disable the active link. This connects the owner setup slice to the first real multi-member household while keeping member administration, completion tracking, and dashboard scoring parked.

## Starting Point

F-01 already created the invite table, one-active-invite invariant, RLS policies, join RPC, active invite lookup RPC, repository helpers, and household guard helpers. The app has auth forms and server-posted route patterns, but no owner invite page, create/disable API, or join confirmation route.

## Desired End State

An authenticated owner can open `/household/invite`, explicitly create or view the current active invite link, copy it, and disable it. A signed-out invitee keeps the token through auth, returns to a confirmation page after sign-in, joins only after pressing the join action, and lands on `/dashboard`. Invalid or disabled invite links show a neutral error state.

## Key Decisions Made

| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Owner surface | Active invite controls only | Matches S-02 and avoids member-admin scope creep. | Planning questions |
| Invite creation | Explicit button | Avoids surprising database state from passive navigation. | Planning questions |
| Signed-out invitees | Preserve token through auth | Makes real sharing usable without anonymous writes. | Planning questions |
| Join behavior | Confirmation page | Prevents accidental membership writes from opening a link. | Planning questions |
| Invalid links | Neutral error page | Gives clear feedback without leaking household details. | Planning questions |
| Token model | Opaque DB token | Fits F-01 schema and keeps disable/revocation simple. | Planning questions |
| Test depth | DB/domain tests plus targeted helper/API checks | Covers risky access rules without inventing broad E2E infrastructure. | Planning questions |

## Scope

**In scope:**

- Owner-only invite management route.
- Explicit invite create/reuse action.
- Copyable active invite link.
- Owner disable action for the active link.
- Signed-out invite auth preservation.
- Signed-in join confirmation.
- Neutral invalid/disabled invite state.
- Focused domain/helper/DB tests and manual verification log.

**Out of scope:**

- Member list, removal, resend, role editing, or audit history.
- Automatic invite creation on page load or during setup.
- Anonymous join writes or auto-join on link open.
- Token expiry, signed tokens, email delivery, or notifications.
- Multi-household support.
- Completion tracking, undo, dashboard score, or history UI.

## Architecture / Approach

The plan keeps invite lifecycle server-owned and explicit. Owner actions go through protected Astro pages and POST API routes using request-scoped Supabase clients and owner guards. Join links remain publicly open enough to preserve signed-out users through auth, but membership is written only by an authenticated confirmation POST using the existing invite join contract.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. Invite Domain Contracts | Token helpers, owner create/reuse/disable helpers, DB contract tests | Over-changing the F-01 schema instead of adding only S-02 lifecycle behavior |
| 2. Owner Invite Page And API | `/household/invite`, create/copy/disable controls, owner POST routes | Accidentally adding member-admin scope |
| 3. Invite Join Route And Auth Preservation | `/join/<token>`, auth return flow, confirmation POST | Losing token context or auto-joining accidentally |
| 4. Route Guards, Redirects, And Handoff | Protected owner route, public join route behavior, role/membership edge cases | Blocking valid no-household invitees or allowing duplicate joins |
| 5. Verification And Documentation | Verification log, contract reference updates, implementation handoff | Closing S-02 before manual link/auth checks are proven |

**Prerequisites:** F-01 remains implemented and S-01 produces an owner household with at least one chore.
**Estimated effort:** ~3 focused implementation sessions across 5 phases.

## Open Risks & Assumptions

- The plan assumes S-01 will land before S-02 implementation begins or that implementers will account for its route/helper names during integration.
- If auth redirect preservation is implemented too broadly, it can create an open redirect risk; only app-local paths should be accepted.
- If direct table operations cannot provide clean create-or-reuse semantics, S-02 may need one small additive Supabase function.

## Success Criteria (Summary)

- Owner can explicitly create/reuse and disable the active invite link.
- Signed-out invitee preserves the token through auth, confirms joining, and lands on `/dashboard`.
- Disabled, invalid, non-owner, and already-member edge cases are blocked with neutral user-facing behavior.
