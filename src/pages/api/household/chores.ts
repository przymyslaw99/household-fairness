import type { APIRoute } from "astro";
import { parseChoreCreationFormData, validateChoreCreationInput } from "@/lib/household/chore-creation";
import { requireCurrentHouseholdMember } from "@/lib/household/guards";
import { createHouseholdChore } from "@/lib/household/repository";
import { HOUSEHOLD_ROLES } from "@/lib/household/types";
import { createClient } from "@/lib/supabase";

const DASHBOARD_ROUTE = "/dashboard";
const SIGN_IN_ROUTE = "/auth/signin";

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (!supabase) {
    return redirectToDashboardError(context, "Supabase is not configured.");
  }

  const guard = await requireCurrentHouseholdMember(supabase, {
    requiredRoles: [HOUSEHOLD_ROLES.owner],
  });

  if (guard.status === "unauthenticated") {
    return context.redirect(SIGN_IN_ROUTE);
  }

  if (guard.status === "missing_membership") {
    return redirectToDashboardError(context, "Household membership is required.");
  }

  if (guard.status === "wrong_role") {
    return redirectToDashboardError(context, "You are not authorized to add household chores.");
  }

  if (guard.status === "error") {
    return redirectToDashboardError(context, "We could not verify your household access right now.");
  }

  const parsed = validateChoreCreationInput(parseChoreCreationFormData(await context.request.formData()));

  if (!parsed.data) {
    return redirectToDashboardError(context, parsed.error ?? "Enter a valid chore.");
  }

  const result = await createHouseholdChore(supabase, {
    householdId: guard.member.household_id,
    createdBy: guard.member.user_id,
    name: parsed.data.name,
    weight: parsed.data.weight,
  });

  if (result.error) {
    return redirectToDashboardError(context, "We could not add that chore right now.");
  }

  return context.redirect(`${DASHBOARD_ROUTE}?notice=chore-added`);
};

function redirectToDashboardError(context: Parameters<APIRoute>[0], message: string) {
  return context.redirect(`${DASHBOARD_ROUTE}?error=${encodeURIComponent(message)}`);
}
