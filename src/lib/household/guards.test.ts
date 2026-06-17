import { describe, expect, it } from "vitest";
import { resolveHouseholdGuard } from "./guards";
import { HOUSEHOLD_ROLES, type HouseholdMember } from "./types";

const MEMBERSHIP: HouseholdMember = {
  id: "00000000-0000-0000-0000-000000000010",
  household_id: "00000000-0000-0000-0000-000000000020",
  user_id: "00000000-0000-0000-0000-000000000030",
  role: HOUSEHOLD_ROLES.member,
  created_at: "2026-06-17T12:00:00.000Z",
};

describe("resolveHouseholdGuard", () => {
  it("distinguishes unauthenticated users from authenticated users without a household", () => {
    expect(resolveHouseholdGuard({ isAuthenticated: false, membership: null })).toEqual({
      status: "unauthenticated",
      member: null,
    });

    expect(resolveHouseholdGuard({ isAuthenticated: true, membership: null })).toEqual({
      status: "missing_membership",
      member: null,
    });
  });

  it("returns wrong_role when the member is authenticated but lacks a required role", () => {
    expect(
      resolveHouseholdGuard({
        isAuthenticated: true,
        membership: MEMBERSHIP,
        requiredRoles: [HOUSEHOLD_ROLES.owner],
      }),
    ).toEqual({
      status: "wrong_role",
      member: MEMBERSHIP,
      required_roles: [HOUSEHOLD_ROLES.owner],
    });
  });

  it("allows household members when no role is required or the role matches", () => {
    expect(resolveHouseholdGuard({ isAuthenticated: true, membership: MEMBERSHIP })).toEqual({
      status: "allowed",
      member: MEMBERSHIP,
    });

    expect(
      resolveHouseholdGuard({
        isAuthenticated: true,
        membership: MEMBERSHIP,
        requiredRoles: [HOUSEHOLD_ROLES.member],
      }),
    ).toEqual({
      status: "allowed",
      member: MEMBERSHIP,
    });
  });
});
