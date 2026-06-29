import { describe, expect, it } from "vitest";
import {
  INVITE_ERROR_CODES,
  INVITE_TOKEN_MIN_LENGTH,
  generateInviteToken,
  mapInviteRepositoryError,
  parseInviteToken,
  toInviteLifecycleResult,
} from "./invites";
import type { HouseholdInvite } from "./types";

const INVITE: HouseholdInvite = {
  id: "00000000-0000-4000-8000-000000000010",
  household_id: "00000000-0000-4000-8000-000000000020",
  token: "abc123def456ghi789",
  created_by: "00000000-0000-4000-8000-000000000030",
  created_at: "2026-06-27T10:00:00.000Z",
  disabled_at: null,
};

describe("generateInviteToken", () => {
  it("returns an opaque token that satisfies the invite length contract", () => {
    const token = generateInviteToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(INVITE_TOKEN_MIN_LENGTH);
  });
});

describe("parseInviteToken", () => {
  it("trims and accepts valid invite tokens", () => {
    expect(parseInviteToken("  abc123def456ghi789  ")).toEqual({
      data: "abc123def456ghi789",
      error: null,
    });
  });

  it("rejects missing, short, or malformed invite tokens", () => {
    expect(parseInviteToken(null)).toEqual({
      data: null,
      error: {
        code: INVITE_ERROR_CODES.invalidToken,
        message: "Invite link is invalid.",
      },
    });

    expect(parseInviteToken("short-token")).toEqual({
      data: null,
      error: {
        code: INVITE_ERROR_CODES.invalidToken,
        message: "Invite link is invalid.",
      },
    });

    expect(parseInviteToken("token with spaces inside")).toEqual({
      data: null,
      error: {
        code: INVITE_ERROR_CODES.invalidToken,
        message: "Invite link is invalid.",
      },
    });
  });
});

describe("mapInviteRepositoryError", () => {
  it("maps owner, membership, and disabled-link failures to stable invite errors", () => {
    expect(mapInviteRepositoryError("Invite is invalid")).toEqual({
      code: INVITE_ERROR_CODES.invalidToken,
      message: "Invite link is invalid.",
    });

    expect(mapInviteRepositoryError("Invite is invalid or disabled")).toEqual({
      code: INVITE_ERROR_CODES.invalidToken,
      message: "Invite link is invalid.",
    });

    expect(mapInviteRepositoryError("Only household owners can manage invites")).toEqual({
      code: INVITE_ERROR_CODES.wrongRole,
      message: "Only the household owner can manage invite links.",
    });

    expect(mapInviteRepositoryError("Invite is disabled")).toEqual({
      code: INVITE_ERROR_CODES.disabledInvite,
      message: "This invite link is no longer active.",
    });

    expect(
      mapInviteRepositoryError('duplicate key value violates unique constraint "household_members_user_id_key"'),
    ).toEqual({
      code: INVITE_ERROR_CODES.alreadyMember,
      message: "You already belong to a household.",
    });
  });

  it("falls back to a repository failure for unknown backend errors", () => {
    expect(mapInviteRepositoryError("database is on fire")).toEqual({
      code: INVITE_ERROR_CODES.repositoryFailure,
      message: "We could not update the invite right now.",
    });
  });
});

describe("toInviteLifecycleResult", () => {
  it("passes through successful invite data and maps backend errors otherwise", () => {
    expect(toInviteLifecycleResult(INVITE, null)).toEqual({
      data: INVITE,
      error: null,
    });

    expect(toInviteLifecycleResult(null, "Only household owners can manage invites")).toEqual({
      data: null,
      error: {
        code: INVITE_ERROR_CODES.wrongRole,
        message: "Only the household owner can manage invite links.",
      },
    });
  });
});
