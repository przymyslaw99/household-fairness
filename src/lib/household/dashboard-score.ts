import { calculateFairnessScore } from "./score";
import type {
  ActiveCompletionWithChore,
  DashboardScoreResult,
  FairnessScoreCompletion,
  HouseholdMember,
} from "./types";
import type { RepositoryResult } from "./repository";

export function buildDashboardScore(
  members: HouseholdMember[],
  completions: ActiveCompletionWithChore[],
  now: Date,
): RepositoryResult<DashboardScoreResult> {
  const scoreCompletions: FairnessScoreCompletion[] = [];

  for (const completion of completions) {
    if (!completion.chores || typeof completion.chores.weight !== "number") {
      return {
        data: null,
        error: {
          message: "Recent completion data is incomplete for dashboard scoring.",
        },
      };
    }

    scoreCompletions.push({
      completed_by: completion.completed_by,
      completed_at: completion.completed_at,
      undone_at: completion.undone_at,
      weight: completion.chores.weight,
    });
  }

  const score = calculateFairnessScore(
    {
      memberIds: members.map((member) => member.user_id),
      completions: scoreCompletions,
    },
    now,
  );

  return {
    data: {
      window_start: score.window_start,
      window_end: score.window_end,
      total_points: score.total_points,
      members: members.map((member, index) => ({
        member_id: member.id,
        user_id: member.user_id,
        role: member.role,
        raw_points: score.members[index]?.raw_points ?? 0,
        percentage: score.members[index]?.percentage ?? 0,
      })),
    },
    error: null,
  };
}
