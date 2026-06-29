import { describe, expect, it } from "vitest";
import { buildDashboardScore } from "./dashboard-score";
import { HOUSEHOLD_ROLES, type ActiveCompletionWithChore, type HouseholdMember } from "./types";

const NOW = new Date("2026-06-29T12:00:00.000Z");
const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000010";
const OWNER_ID = "00000000-0000-0000-0000-000000000001";
const MEMBER_ID = "00000000-0000-0000-0000-000000000002";
const THIRD_MEMBER_ID = "00000000-0000-0000-0000-000000000003";

describe("buildDashboardScore", () => {
  it("includes members with and without active completions in input order", () => {
    const result = buildDashboardScore(
      [member("owner-1", OWNER_ID, HOUSEHOLD_ROLES.owner), member("member-1", MEMBER_ID, HOUSEHOLD_ROLES.member)],
      [completion({ completedBy: MEMBER_ID, weight: 5, completedAt: "2026-06-28T12:00:00.000Z" })],
      NOW,
    );

    expect(result).toEqual({
      data: {
        window_start: "2026-06-15T12:00:00.000Z",
        window_end: "2026-06-29T12:00:00.000Z",
        total_points: 5,
        members: [
          {
            member_id: "owner-1",
            user_id: OWNER_ID,
            role: HOUSEHOLD_ROLES.owner,
            raw_points: 0,
            percentage: 0,
          },
          {
            member_id: "member-1",
            user_id: MEMBER_ID,
            role: HOUSEHOLD_ROLES.member,
            raw_points: 5,
            percentage: 100,
          },
        ],
      },
      error: null,
    });
  });

  it("returns zero percentages when the active total is zero", () => {
    const result = buildDashboardScore(
      [member("owner-1", OWNER_ID, HOUSEHOLD_ROLES.owner), member("member-1", MEMBER_ID, HOUSEHOLD_ROLES.member)],
      [],
      NOW,
    );

    expect(result.error).toBeNull();
    expect(result.data?.total_points).toBe(0);
    expect(result.data?.members).toEqual([
      expect.objectContaining({ user_id: OWNER_ID, raw_points: 0, percentage: 0 }),
      expect.objectContaining({ user_id: MEMBER_ID, raw_points: 0, percentage: 0 }),
    ]);
  });

  it("keeps member ordering stable even when completions arrive for another member first", () => {
    const result = buildDashboardScore(
      [
        member("owner-1", OWNER_ID, HOUSEHOLD_ROLES.owner),
        member("member-1", MEMBER_ID, HOUSEHOLD_ROLES.member),
        member("member-2", THIRD_MEMBER_ID, HOUSEHOLD_ROLES.member),
      ],
      [
        completion({ completedBy: THIRD_MEMBER_ID, weight: 4, completedAt: "2026-06-28T12:00:00.000Z" }),
        completion({ completedBy: OWNER_ID, weight: 2, completedAt: "2026-06-27T12:00:00.000Z" }),
      ],
      NOW,
    );

    expect(result.error).toBeNull();
    expect(result.data?.members.map((member) => member.user_id)).toEqual([OWNER_ID, MEMBER_ID, THIRD_MEMBER_ID]);
    expect(result.data?.members.map((member) => member.raw_points)).toEqual([2, 0, 4]);
  });

  it("lets the score calculator exclude completions outside the rolling window", () => {
    const result = buildDashboardScore(
      [member("owner-1", OWNER_ID, HOUSEHOLD_ROLES.owner), member("member-1", MEMBER_ID, HOUSEHOLD_ROLES.member)],
      [
        completion({ completedBy: OWNER_ID, weight: 6, completedAt: "2026-06-10T12:00:00.000Z" }),
        completion({ completedBy: MEMBER_ID, weight: 3, completedAt: "2026-06-28T12:00:00.000Z" }),
      ],
      NOW,
    );

    expect(result.error).toBeNull();
    expect(result.data?.total_points).toBe(3);
    expect(result.data?.members).toEqual([
      expect.objectContaining({ user_id: OWNER_ID, raw_points: 0, percentage: 0 }),
      expect.objectContaining({ user_id: MEMBER_ID, raw_points: 3, percentage: 100 }),
    ]);
  });

  it("fails closed when a completion is missing joined chore weight data", () => {
    const result = buildDashboardScore(
      [member("owner-1", OWNER_ID, HOUSEHOLD_ROLES.owner)],
      [completion({ completedBy: OWNER_ID, weight: null, completedAt: "2026-06-28T12:00:00.000Z" })],
      NOW,
    );

    expect(result).toEqual({
      data: null,
      error: {
        message: "Recent completion data is incomplete for dashboard scoring.",
      },
    });
  });
});

function member(id: string, userId: string, role: HouseholdMember["role"]): HouseholdMember {
  return {
    id,
    household_id: HOUSEHOLD_ID,
    user_id: userId,
    role,
    created_at: NOW.toISOString(),
  };
}

function completion({
  completedBy,
  weight,
  completedAt,
}: {
  completedBy: string;
  weight: number | null;
  completedAt: string;
}): ActiveCompletionWithChore {
  return {
    id: "00000000-0000-0000-0000-000000009999",
    household_id: HOUSEHOLD_ID,
    chore_id: "00000000-0000-0000-0000-000000008888",
    completed_by: completedBy,
    completed_at: completedAt,
    undone_at: null,
    undone_by: null,
    created_at: completedAt,
    chores:
      weight === null
        ? null
        : {
            id: "00000000-0000-0000-0000-000000008888",
            name: "Dishes",
            weight,
          },
  };
}
