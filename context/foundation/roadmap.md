---
project: "A smieci wyniosles?"
version: 1
status: proposed
created: 2026-06-15
updated: 2026-06-15
prd_version: 1
main_goal: speed
top_blocker: time
---

## Vision recap

This MVP exists to give household members one shared view of who contributed how much work in the last two weeks, so discussions about fairness start from recorded facts instead of memory.

The roadmap is sequenced for speed: ship the shortest path from account creation to a live Fairness Score, while keeping the score understandable, access-controlled, and limited to the recorded chores that produced it.

## North star

The north star here means the first complete user-visible outcome that proves the product's core value. For this project, that outcome is a live dashboard where a real household can see a two-week Fairness Score and the recent chore history that produced it after an owner set up the household, a member joined, and someone recorded a completed chore.

**North star slice:** `S-04` - Shared fairness dashboard over live household activity.

## At a glance

| ID | Type | Change ID | Outcome | Prerequisites | PRD refs | Status |
| --- | --- | --- | --- | --- | --- | --- |
| F-01 | foundation | `foundation-household-domain-contract` | Define the smallest shared household domain contract needed for household ownership, membership, chore weights, completion ownership, two-week score calculation, and household-only visibility. | `None` | `US-01`, `US-02`, `US-03`, `FR-002`, `FR-006`, `FR-007`, `FR-009`, `FR-010` | `ready` |
| S-01 | slice | `owner-household-setup` | Let an authenticated owner create a household and define the first chore weights that the shared score will use. | `F-01` | `US-03`, `FR-001`, `FR-002`, `FR-006` | `implemented` |
| S-02 | slice | `invite-lifecycle-and-join` | Let the owner open an invite path, let a second member join the household through it, and let the owner stop new joins by disabling the active link. | `F-01`, `S-01` | `US-03`, `FR-003`, `FR-004`, `FR-005` | `proposed` |
| S-03 | slice | `member-completion-loop` | Let a household member see chore weights, record their own completion, undo a mistake, and create the recent history entry that feeds the shared score. | `F-01`, `S-01`, `S-02` | `US-02`, `FR-007`, `FR-008`, `FR-009` | `implemented` |
| S-04 | slice | `shared-fairness-dashboard` | Show each household member's current percentage share, supporting raw points, and recent completed chores from the rolling two-week window in a neutral shared dashboard. | `F-01`, `S-03` | `US-01`, `FR-010` | `implemented` |

## Baseline

- Frontend: present. The project already has an Astro and React UI scaffold with routed pages and shared UI primitives.
- Backend/API: partial. Server-side request handling exists for auth flows, but there is no household, invite, chore, completion, or score domain surface yet.
- Data: partial. Supabase client wiring exists, but no household-specific domain model or migrations exist yet.
- Auth: present. Account auth, protected-route middleware, and sign-in and sign-up flows already exist.
- Deploy/infra: present. Cloudflare Workers deployment and GitHub Actions CI are already in place.
- Observability: partial. Platform-level observability exists, but there is no product-specific error or domain event layer yet.

## Foundations

### F-01: Household domain contract (foundation)

Outcome: Define the smallest shared household domain contract needed for household ownership, membership, chore weights, completion ownership, two-week score calculation, and household-only visibility.

Change ID: `foundation-household-domain-contract`

PRD refs: `US-01`, `US-02`, `US-03`, `FR-002`, `FR-006`, `FR-007`, `FR-009`, `FR-010`

Prerequisites: `None`

Parallel with: `None`

Blockers: `None`

Unknowns: `None`

Risk: If this contract grows into a full "build the whole backend" effort, the roadmap loses its speed bias and delays the first real household flow.

Status: `ready`

Unlocks: `S-01`, `S-02`, `S-03`, `S-04`

## Slices

### S-01: Owner household setup

Outcome: Let an authenticated owner create a household and define the first chore weights that the shared score will use.

Change ID: `owner-household-setup`

PRD refs: `US-03`, `FR-001`, `FR-002`, `FR-006`

Prerequisites: `F-01`

Parallel with: `None`

Blockers: `None`

Unknowns: `None`

Risk: If this slice includes polished member-management or post-creation editing flows, it will absorb later scope that the MVP explicitly parked.

Status: `implemented`

### S-02: Invite lifecycle and join

Outcome: Let the owner open an invite path, let a second member join the household through it, and let the owner stop new joins by disabling the active link.

Change ID: `invite-lifecycle-and-join`

PRD refs: `US-03`, `FR-003`, `FR-004`, `FR-005`

Prerequisites: `F-01`, `S-01`

Parallel with: `None`

Blockers: `None`

Unknowns: `None`

Risk: If the invite flow is broadened into full member-administration or multi-household support, it will slow the path to the first shared score without improving the core validation.

Status: `implemented`

### S-03: Member completion loop

Outcome: Let a household member see chore weights, record their own completion, undo a mistake, and create the recent history entry that feeds the shared score.

Change ID: `member-completion-loop`

PRD refs: `US-02`, `FR-007`, `FR-008`, `FR-009`

Prerequisites: `F-01`, `S-01`, `S-02`

Parallel with: `None`

Blockers: `None`

Unknowns: `None`

Risk: If completion recording is allowed to mutate other members' work or loses the undo path, the score stops being trustworthy enough for shared household use.

Status: `implemented`

### S-04: Shared fairness dashboard

Outcome: Show each household member's current percentage share, supporting raw points, and recent completed chores from the rolling two-week window in a neutral shared dashboard.

Change ID: `shared-fairness-dashboard`

PRD refs: `US-01`, `FR-010`

Prerequisites: `F-01`, `S-03`

Parallel with: `None`

Blockers: `None`

Unknowns: `None`

Risk: If this slice ships without clear explanation of the recent chores behind the score or without the two-week boundary made visible, users may read the result as an objective verdict instead of a limited indicator.

Status: `implemented`

## Backlog Handoff

| Roadmap ID | Change ID | Status | Why it exists | Start after |
| --- | --- | --- | --- | --- |
| F-01 | `foundation-household-domain-contract` | `ready` | Creates the smallest shared domain contract needed before any vertical household flow can be planned safely. | `None` |
| S-01 | `owner-household-setup` | `implemented` | Creates the first owner-visible setup path for the shared scoring model. | `F-01` |
| S-02 | `invite-lifecycle-and-join` | `proposed` | Connects the owner setup flow to a real second household member and keeps invite access under owner control. | `F-01`, `S-01` |
| S-03 | `member-completion-loop` | `implemented` | Creates the first trustworthy recorded contribution event that can feed the score. | `F-01`, `S-01`, `S-02` |
| S-04 | `shared-fairness-dashboard` | `implemented` | Delivers the first live shared fairness view that proves the product's value. | `F-01`, `S-03` |

## Open Roadmap Questions

None at this stage.

## Parked

- Member removal stays parked for a later phase; the MVP only needs owner and member roles with invite-based entry.
- Editing chore weights after creation stays parked to protect trust in the first version of the score.
- Historical views beyond the current two-week window stay parked so the first dashboard stays focused on current shared contribution.

## Done
