import type { APIRoute } from "astro";
import { requireCurrentHouseholdMember } from "@/lib/household/guards";
import { toInviteLifecycleResult } from "@/lib/household/invites";
import { disableActiveInviteForCurrentOwner } from "@/lib/household/repository";
import { HOUSEHOLD_ROLES } from "@/lib/household/types";
import { createClient } from "@/lib/supabase";

const INVITE_ROUTE = "/household/invite";
const SIGN_IN_ROUTE = "/auth/signin";
const SETUP_ROUTE = "/setup/household";

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (!supabase) {
    return redirectToInvite(context, "Supabase is not configured");
  }

  const guard = await requireCurrentHouseholdMember(supabase, {
    requiredRoles: [HOUSEHOLD_ROLES.owner],
  });

  if (guard.status === "unauthenticated") {
    return context.redirect(SIGN_IN_ROUTE);
  }

  if (guard.status === "missing_membership") {
    return context.redirect(SETUP_ROUTE);
  }

  if (guard.status === "wrong_role") {
    return redirectToInvite(context, "Only the household owner can manage invite links.");
  }

  if (guard.status === "error") {
    return redirectToInvite(context, "We could not verify your household access right now.");
  }

  const result = await disableActiveInviteForCurrentOwner(supabase, guard.member.household_id);
  const mapped = toInviteLifecycleResult(result.data, result.error?.message ?? null);

  if (mapped.error) {
    return redirectToInvite(context, mapped.error.message);
  }

  return context.redirect(`${INVITE_ROUTE}?notice=disabled`);
};

function redirectToInvite(context: Parameters<APIRoute>[0], message: string) {
  return context.redirect(`${INVITE_ROUTE}?error=${encodeURIComponent(message)}`);
}
