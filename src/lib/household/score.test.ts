import { describe, expect, it } from "vitest";
import { calculateFairnessScore } from "./score";
import type { FairnessScoreCompletion } from "./types";

const NOW = new Date("2026-06-17T12:00:00.000Z");
const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const MEMBER_ID = "00000000-0000-0000-0000-000000000002";

describe("calculateFairnessScore", () => {
  it("returns raw points and percentage share for active completions in the two-week window", () => {
    const result = calculateFairnessScore(
      {
        memberIds: [OWNER_ID, MEMBER_ID],
        completions: [
          completion({ completedBy: OWNER_ID, weight: 3, completedAt: "2026-06-16T12:00:00.000Z" }),
          completion({ completedBy: MEMBER_ID, weight: 9, completedAt: "2026-06-15T12:00:00.000Z" }),
        ],
      },
      NOW,
    );

    expect(result.total_points).toBe(12);
    expect(result.members).toEqual([
      { user_id: OWNER_ID, raw_points: 3, percentage: 25 },
      { user_id: MEMBER_ID, raw_points: 9, percentage: 75 },
    ]);
  });

  it("ignores completions outside the rolling two-week window", () => {
    const result = calculateFairnessScore(
      {
        memberIds: [OWNER_ID, MEMBER_ID],
        completions: [
          completion({ completedBy: OWNER_ID, weight: 5, completedAt: "2026-06-03T11:59:59.999Z" }),
          completion({ completedBy: MEMBER_ID, weight: 7, completedAt: "2026-06-03T12:00:00.000Z" }),
        ],
      },
      NOW,
    );

    expect(result.total_points).toBe(7);
    expect(result.members).toEqual([
      { user_id: OWNER_ID, raw_points: 0, percentage: 0 },
      { user_id: MEMBER_ID, raw_points: 7, percentage: 100 },
    ]);
  });

  it("ignores soft-undone completions", () => {
    const result = calculateFairnessScore(
      {
        memberIds: [OWNER_ID],
        completions: [
          completion({
            completedBy: OWNER_ID,
            weight: 5,
            completedAt: "2026-06-16T12:00:00.000Z",
            undoneAt: "2026-06-16T12:05:00.000Z",
          }),
        ],
      },
      NOW,
    );

    expect(result.total_points).toBe(0);
    expect(result.members).toEqual([{ user_id: OWNER_ID, raw_points: 0, percentage: 0 }]);
  });

  it("returns zero percentages without divide-by-zero output when there are no active completions", () => {
    const result = calculateFairnessScore(
      {
        memberIds: [OWNER_ID, MEMBER_ID],
        completions: [],
      },
      NOW,
    );

    expect(result.total_points).toBe(0);
    expect(result.members).toEqual([
      { user_id: OWNER_ID, raw_points: 0, percentage: 0 },
      { user_id: MEMBER_ID, raw_points: 0, percentage: 0 },
    ]);
  });
});

function completion({
  completedBy,
  weight,
  completedAt,
  undoneAt = null,
}: {
  completedBy: string;
  weight: number;
  completedAt: string;
  undoneAt?: string | null;
}): FairnessScoreCompletion {
  return {
    completed_by: completedBy,
    completed_at: completedAt,
    undone_at: undoneAt,
    weight,
  };
}
