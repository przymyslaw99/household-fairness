import type { HouseholdInvite } from "./types";

export const INVITE_TOKEN_MIN_LENGTH = 16;

export const INVITE_ERROR_CODES = {
  invalidToken: "invalid_token",
  disabledInvite: "disabled_invite",
  alreadyMember: "already_member",
  wrongRole: "wrong_role",
  repositoryFailure: "repository_failure",
} as const;

export type InviteErrorCode = (typeof INVITE_ERROR_CODES)[keyof typeof INVITE_ERROR_CODES];

export interface InviteLifecycleError {
  code: InviteErrorCode;
  message: string;
}

export type InviteTokenValidationResult =
  | {
      data: string;
      error: null;
    }
  | {
      data: null;
      error: InviteLifecycleError;
    };

export type InviteLifecycleResult<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: InviteLifecycleError;
    };

const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/;

export function generateInviteToken(): string {
  return `${crypto.randomUUID().replaceAll("-", "")}${crypto.randomUUID().replaceAll("-", "")}`;
}

export function parseInviteToken(input: FormDataEntryValue | string | null | undefined): InviteTokenValidationResult {
  if (typeof input !== "string") {
    return invalidTokenResult();
  }

  const token = input.trim();

  if (token.length < INVITE_TOKEN_MIN_LENGTH || !INVITE_TOKEN_PATTERN.test(token)) {
    return invalidTokenResult();
  }

  return { data: token, error: null };
}

export function mapInviteRepositoryError(message: string): InviteLifecycleError {
  if (message === "Invite is disabled") {
    return {
      code: INVITE_ERROR_CODES.disabledInvite,
      message: "This invite link is no longer active.",
    };
  }

  if (message.includes("household_members_user_id_key") || message === "User already belongs to a household") {
    return {
      code: INVITE_ERROR_CODES.alreadyMember,
      message: "You already belong to a household.",
    };
  }

  if (message === "Only household owners can manage invites") {
    return {
      code: INVITE_ERROR_CODES.wrongRole,
      message: "Only the household owner can manage invite links.",
    };
  }

  return {
    code: INVITE_ERROR_CODES.repositoryFailure,
    message: "We could not update the invite right now.",
  };
}

export function toInviteLifecycleResult(
  invite: HouseholdInvite | null,
  message: string | null,
): InviteLifecycleResult<HouseholdInvite | null> {
  if (message) {
    return { data: null, error: mapInviteRepositoryError(message) };
  }

  return { data: invite, error: null };
}

function invalidTokenResult(): InviteTokenValidationResult {
  return {
    data: null,
    error: {
      code: INVITE_ERROR_CODES.invalidToken,
      message: "Invite link is invalid.",
    },
  };
}
