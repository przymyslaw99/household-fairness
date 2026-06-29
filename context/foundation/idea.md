# Did You Take Out the Trash? - MVP

## Main Problem

Households often experience conflicts related to the division of chores. Household members have different perceptions of who does more work, and the lack of data leads to a sense of unfairness and misunderstandings.

## Minimum Feature Set

- User registration and login.
- Creating a household.
- Adding household members.
- Creating chores with assigned point weights.
- Marking a chore as completed by a specific household member.
- A dashboard showing completed chores and the current Fairness Score for each household member.
- A history of completed chores.

## What Is Out of Scope for the MVP

- Calendar integrations.
- Push and email notifications.
- Automatic chore assignment powered by AI.
- A mobile application.
- Gamification (badges, levels, rankings).
- Support for multiple households per user.
- Advanced statistics and historical charts.
- Integrations with voice assistants.

## Success Criteria

- A user can create a household and add at least two household members.
- A user can create a chore, assign it a point weight, and mark it as completed.
- The system correctly calculates the Fairness Score based on completed chores.
- The dashboard shows each household member's current share of household chores.
- An E2E test confirms the main flow: create a household -> add a chore -> mark it as completed -> update the Fairness Score.
- The application is deployed and has a working CI/CD pipeline.
