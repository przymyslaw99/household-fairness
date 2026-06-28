import { describe, expect, it } from "vitest";
import { resolveJoinRouteAccess } from "./join";
import { HOUSEHOLD_ROLES, type HouseholdMember } from "./types";

const MEMBERSHIP: HouseholdMember = {
  id: "00000000-0000-0000-0000-000000000010",
  household_id: "00000000-0000-0000-0000-000000000020",
  user_id: "00000000-0000-0000-0000-000000000030",
  role: HOUSEHOLD_ROLES.member,
  created_at: "2026-06-17T12:00:00.000Z",
};

describe("resolveJoinRouteAccess", () => {
  it("allows authenticated users without a household to confirm joining", () => {
    expect(resolveJoinRouteAccess({ isAuthenticated: true, membership: null })).toBe("confirm_join");
  });

  it("blocks users who already belong to a household from rejoining", () => {
    expect(resolveJoinRouteAccess({ isAuthenticated: true, membership: MEMBERSHIP })).toBe("redirect_to_dashboard");
  });

  it("sends signed-out users through auth first", () => {
    expect(resolveJoinRouteAccess({ isAuthenticated: false, membership: null })).toBe("redirect_to_sign_in");
  });
});
