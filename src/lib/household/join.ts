import type { HouseholdMember } from "./types";

export type JoinRouteAccess = "redirect_to_sign_in" | "confirm_join" | "redirect_to_dashboard";

interface ResolveJoinRouteAccessInput {
  isAuthenticated: boolean;
  membership: HouseholdMember | null;
}

export function resolveJoinRouteAccess(input: ResolveJoinRouteAccessInput): JoinRouteAccess {
  if (!input.isAuthenticated) {
    return "redirect_to_sign_in";
  }

  if (input.membership) {
    return "redirect_to_dashboard";
  }

  return "confirm_join";
}
