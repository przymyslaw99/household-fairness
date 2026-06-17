import { getCurrentUserHouseholdMembership, type HouseholdSupabaseClient } from "./repository";
import type { HouseholdMember, HouseholdRole } from "./types";

export type HouseholdGuardStatus = "unauthenticated" | "missing_membership" | "wrong_role" | "allowed" | "error";

export interface HouseholdGuardOptions {
  requiredRoles?: readonly HouseholdRole[];
}

export type HouseholdGuardResult =
  | {
      status: "allowed";
      member: HouseholdMember;
    }
  | {
      status: "unauthenticated";
      member: null;
    }
  | {
      status: "missing_membership";
      member: null;
    }
  | {
      status: "wrong_role";
      member: HouseholdMember;
      required_roles: readonly HouseholdRole[];
    }
  | {
      status: "error";
      member: null;
      error: {
        message: string;
      };
    };

export interface ResolveHouseholdGuardInput extends HouseholdGuardOptions {
  isAuthenticated: boolean;
  membership: HouseholdMember | null;
}

export async function requireCurrentHouseholdMember(
  supabase: HouseholdSupabaseClient,
  options: HouseholdGuardOptions = {},
): Promise<HouseholdGuardResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { status: "error", member: null, error: { message: userError.message } };
  }

  if (!user) {
    return resolveHouseholdGuard({ ...options, isAuthenticated: false, membership: null });
  }

  const membershipResult = await getCurrentUserHouseholdMembership(supabase);

  if (membershipResult.error) {
    return { status: "error", member: null, error: membershipResult.error };
  }

  return resolveHouseholdGuard({
    ...options,
    isAuthenticated: true,
    membership: membershipResult.data,
  });
}

export function resolveHouseholdGuard(input: ResolveHouseholdGuardInput): HouseholdGuardResult {
  if (!input.isAuthenticated) {
    return { status: "unauthenticated", member: null };
  }

  if (!input.membership) {
    return { status: "missing_membership", member: null };
  }

  const requiredRoles = input.requiredRoles ?? [];

  if (requiredRoles.length > 0 && !requiredRoles.includes(input.membership.role)) {
    return {
      status: "wrong_role",
      member: input.membership,
      required_roles: requiredRoles,
    };
  }

  return { status: "allowed", member: input.membership };
}
