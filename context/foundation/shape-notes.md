---
project: "Household Fairness"
context_type: greenfield
product_type: web-app
target_scale:
  users: small
  qps: low
  data_volume: small
timeline_budget:
  mvp_weeks: 3
  hard_deadline: 2026-07-05
  after_hours_only: true
created: 2026-06-10
updated: 2026-06-10
checkpoint:
  current_phase: 8
  phases_completed: [1, 2, 3, 4, 5, 6, 7]
  gray_areas_resolved:
    - topic: product value
      decision: "The product's main value is a shared, credible view of who contributes how much work in a household."
    - topic: primary persona scope
      decision: "MVP focuses on pairs or flatmates sharing a home rather than all household types."
    - topic: auth strategy
      decision: "Users have separate accounts and join a household instead of sharing one account."
    - topic: role model
      decision: "The smallest useful access model is owner plus member."
    - topic: fairness score window
      decision: "Fairness Score should be calculated over a rolling two-week window as a compromise between recency and stability."
    - topic: fairness score presentation
      decision: "Dashboard should show percentage share of household work as the primary fairness signal, with raw points as supporting detail."
    - topic: chore weight governance
      decision: "For MVP, the household owner sets chore weights, and the weights are visible to all members."
    - topic: completion attribution
      decision: "For MVP, each member can mark chore completion only for themselves to keep contribution data trustworthy."
    - topic: completion correction
      decision: "For MVP, a member can undo their own completion mark to correct mistakes."
    - topic: history purpose
      decision: "Completed chore history should explain how the current Fairness Score was produced, not just act as an activity log."
    - topic: history detail
      decision: "The minimum useful history view should show chore name, point weight, who completed it, and when."
    - topic: chore frequency model
      decision: "For MVP, the product should count only chores actually completed in the rolling two-week window, without modeling expected frequency or missed chores."
    - topic: fairness score framing
      decision: "Fairness Score should be framed as a transparent indicator of recorded contribution in the last two weeks, not as an absolute truth about fairness."
    - topic: primary user value
      decision: "The main user value is seeing a shared view of contribution and Fairness Score, not just creating chores."
    - topic: dashboard comparison tone
      decision: "Dashboard should present contribution as a neutral comparison between household members, not as a competitive ranking."
    - topic: fairness score formula
      decision: "Fairness Score should represent each member's percentage share of all chore points completed in the household during the last two weeks."
    - topic: key user stories
      decision: "Core stories should cover creating the household and visible scoring rules, recording one's own completed chores, and seeing a shared contribution view."
    - topic: key non-functional requirements
      decision: "The MVP should keep score updates fast and understandable, and household data visible only to members of that household."
    - topic: household joining flow
      decision: "For MVP, new members should join a household through a simple invite link to shorten the path to first shared value."
    - topic: invite link lifetime
      decision: "For MVP, the household invite link should stay active until the owner disables it."
    - topic: invite link control
      decision: "For MVP, the owner needs only simple control: they can disable the active invite link, and disabled links stop new joins."
    - topic: member management scope
      decision: "Removing members is out of scope for MVP so the first version can focus on trustworthy scoring and simple onboarding."
    - topic: chore weight stability
      decision: "For MVP, chore weights should stay stable after creation to protect trust in the score."
    - topic: history window
      decision: "For MVP, the visible chore history should focus on the same rolling two-week window that drives the current Fairness Score."
    - topic: chore setup flow
      decision: "For MVP, chores should be created manually by the owner without starter templates."
    - topic: chore creation authority
      decision: "For MVP, only the household owner creates chores so weights and naming stay consistent."
    - topic: score limitation messaging
      decision: "The product should explicitly state that Fairness Score reflects only recorded chores from the last two weeks."
    - topic: product type
      decision: "The MVP should be a web app."
    - topic: target scale
      decision: "The MVP should target a small launch scope: a handful of households rather than a larger audience."
    - topic: timeline budget
      decision: "The MVP should fit into about three weeks or less of after-hours and weekend work, with a hard deadline of 2026-07-05."
    - topic: deadline framing
      decision: "The July 5 deadline should act as a filter that protects the MVP from scope growth."
    - topic: score precision
      decision: "The dashboard should show exact percentage values for each member's share of work, not only a relative comparison."
  frs_drafted: 10
  quality_check_status: accepted
---

## Vision & Problem Statement

Households often argue about chores because people do not share a trusted view of who is contributing how much work. Different memories and perceptions create tension, a sense of unfairness, and repeated conflict.

The product is not just a household todo list. Its value comes from turning completed chores into a shared, visible contribution score so pairs or flatmates can talk about fairness using the same data.

## User & Persona

Primary persona: adults sharing a home, with MVP focus on pairs or flatmates living together.

They reach for the product when household chores start to feel uneven and they want a simple, visible record of who has contributed what.

## Success Criteria

### Primary

- A user can create a household and add at least two household members.
- A user can create a chore, assign it a point weight, and mark it as completed.
- The system correctly calculates Fairness Score from completed chores.
- The dashboard shows each household member's current percentage share of household work, with supporting raw points.

### Secondary

- The main flow is covered by an E2E test: create household -> add chore -> mark completion -> update Fairness Score.
- The application is deployed and has a working CI/CD pipeline.

### Guardrails

- The product must not present Fairness Score as an objective verdict about household fairness; it is a transparent indicator based on recorded chores from the last two weeks.
- Users must be able to understand which completed chores contributed to the current score.
- The product should explicitly communicate that the score is limited to recorded chores within the current two-week window.

## User Stories

### US-01: Household members see a shared contribution view

- **Given** at least two household members belong to the same household and recent chores have been marked as completed
- **When** a member opens the dashboard
- **Then** they can see each member's percentage share of household work in the last two weeks, with supporting raw points and recent completed chores

#### Acceptance Criteria

- Dashboard shows percentage share as the primary fairness signal
- Dashboard shows exact percentage values for each member
- Dashboard also shows supporting raw points for each member
- Recent completed chore history explains how the score was produced
- The score reflects only completed chores inside the rolling two-week window
- The dashboard presents comparison neutrally, without ranking members or framing one as the winner

### US-02: Household member records their completed contribution

- **Given** a member belongs to a household with visible chores and point weights
- **When** they mark one of those chores as completed for themselves
- **Then** their completed work is added to the household history and reflected in the shared Fairness Score

#### Acceptance Criteria

- A member can mark completion only for themselves
- A member can undo their own completion mark if they made a mistake
- The completed chore appears in recent history with chore name, point weight, who completed it, and when
- The updated score still reflects only chores completed inside the rolling two-week window

### US-03: Household owner defines the shared scoring model

- **Given** a signed-in user wants to start using the product with other people in the same home
- **When** they create a household, invite members, and define chores with visible point weights
- **Then** the household has a shared, transparent basis for tracking contribution and calculating Fairness Score

#### Acceptance Criteria

- Owner can create a household
- Owner can add household members
- Owner can create chores with visible point weights
- Household members can see the chore weights that affect the score

## Functional Requirements

### Authentication and membership

- FR-001: User can register and sign in with a personal account. Priority: must-have
- FR-002: User can create a household. Priority: must-have
- FR-003: User can invite new members to a household with an invite link. Priority: must-have
- FR-004: Household invite link stays active until the owner disables it. Priority: must-have
- FR-005: Owner can disable the active household invite link to stop new members from joining. Priority: must-have

### Chore tracking

- FR-006: Owner can create a household chore with a point weight. Priority: must-have
- FR-007: Member can mark a chore as completed for themselves. Priority: must-have
- FR-008: Member can undo their own chore completion mark. Priority: must-have
- FR-009: Member can see a history of completed chores. Priority: must-have

### Fairness visibility

- FR-010: User can see a dashboard with completed chores and the current Fairness Score for each household member. Priority: must-have

## Non-Functional Requirements

- After a member marks a chore as completed or undoes it, the updated Fairness Score should refresh in less than 2 seconds.
- The product should make it possible for household members to understand which recent completed chores produced the current score.
- Only members of a given household can view that household's chores, completion history, and Fairness Score.

## Business Logic

The product calculates each household member's contribution from the weighted chores they complete and shows a shared Fairness Score for the household.

The rule consumes two user-facing inputs: which chores exist and what point weight each chore has, then which member completed each chore. The output is a visible contribution view that lets everyone compare current participation using the same scoring model.

For MVP, the score should reflect a rolling two-week window rather than all-time history, so the result stays current enough to feel fair while avoiding extreme day-to-day swings.

The main dashboard signal should be each member's percentage share of total household work in that two-week window, with raw points available as supporting detail so users can understand where the percentage came from.

Completed chore history is part of that explanation layer: users should be able to inspect recent completed chores and understand how they contributed to the current score.

For MVP, the product should score only chores that were actually completed inside the rolling two-week window. Expected frequency, missed chores, and plan-vs-actual tracking stay out of scope so the product remains focused on visible contribution rather than chore enforcement.

For MVP, Fairness Score should be defined as each member's percentage share of all chore points completed by the household during the rolling two-week window, rather than as distance from an ideal split or an inferred fairness judgment.

The visible history in MVP should focus on the same rolling two-week window so the explanation layer matches the score users are currently seeing.

## Access Control

- `owner` can create a household and add other members.
- `owner` can create chores and define their point weights.
- `owner` is the only role allowed to create chores in MVP.
- `member` can view household chores, mark their own chores as completed, undo their own completion marks, view chore history, and view Fairness Score.
- Authentication is account-based: each person uses a separate account and joins a household.
- Chore weights are visible to all household members.

## Non-Goals

- No calendar integrations.
- No push or email notifications.
- No AI-based automatic chore assignment.
- No mobile app.
- No gamification such as badges, levels, or leaderboards.
- No support for one user belonging to multiple households.
- No member removal flow in the first version.
- No post-creation editing of chore weights in MVP.
- No advanced statistics or historical charts.
- No full historical archive view outside the current score window in MVP.
- No starter chore templates in MVP.
- No voice assistant integrations.
- No expected-frequency model for chores or penalties for missed chores.

## Open Questions

None at this stage.
