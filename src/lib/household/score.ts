import { SCORE_WINDOW_MS, type FairnessScoreCompletion, type FairnessScoreResult, type Uuid } from "./types";

export interface CalculateFairnessScoreInput {
  memberIds: Uuid[];
  completions: FairnessScoreCompletion[];
}

export function calculateFairnessScore(input: CalculateFairnessScoreInput, now: Date): FairnessScoreResult {
  const windowStart = new Date(now.getTime() - SCORE_WINDOW_MS);
  const pointsByMember = new Map<Uuid, number>();

  input.memberIds.forEach((memberId) => {
    pointsByMember.set(memberId, 0);
  });

  input.completions.forEach((completion) => {
    if (completion.undone_at) {
      return;
    }

    const completedAt = toDate(completion.completed_at);

    if (completedAt < windowStart || completedAt > now) {
      return;
    }

    const currentPoints = pointsByMember.get(completion.completed_by) ?? 0;
    pointsByMember.set(completion.completed_by, currentPoints + completion.weight);
  });

  const totalPoints = Array.from(pointsByMember.values()).reduce((total, memberPoints) => total + memberPoints, 0);

  return {
    window_start: windowStart.toISOString(),
    window_end: now.toISOString(),
    total_points: totalPoints,
    members: input.memberIds.map((memberId) => {
      const rawPoints = pointsByMember.get(memberId) ?? 0;

      return {
        user_id: memberId,
        raw_points: rawPoints,
        percentage: totalPoints === 0 ? 0 : (rawPoints / totalPoints) * 100,
      };
    }),
  };
}

function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}
