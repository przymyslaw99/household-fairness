import type { APIRoute } from "astro";
import { parseChoreCreationFormData, validateChoreCreationInput } from "@/lib/household/chore-creation";
import { requireCurrentHouseholdMember } from "@/lib/household/guards";
import { archiveHouseholdChore, createHouseholdChore, updateHouseholdChore } from "@/lib/household/repository";
import { HOUSEHOLD_ROLES } from "@/lib/household/types";
import { createClient } from "@/lib/supabase";

const DASHBOARD_ROUTE = "/dashboard";
const SIGN_IN_ROUTE = "/auth/signin";
const CHORE_ACTIONS = {
  create: "create",
  update: "update",
  archive: "archive",
} as const;

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
    return redirectToDashboardError(context, "You are not authorized to manage household chores.");
  }

  if (guard.status === "error") {
    return redirectToDashboardError(context, "We could not verify your household access right now.");
  }

  const formData = await context.request.formData();
  const action = readStringValue(formData.get("action")) || CHORE_ACTIONS.create;

  if (action === CHORE_ACTIONS.create) {
    const parsed = validateChoreCreationInput(parseChoreCreationFormData(formData));

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
  }

  const choreId = readStringValue(formData.get("chore_id")).trim();

  if (!choreId) {
    return redirectToDashboardError(context, "Choose a chore before submitting.");
  }

  if (action === CHORE_ACTIONS.update) {
    const parsed = validateChoreCreationInput(parseChoreCreationFormData(formData));

    if (!parsed.data) {
      return redirectToDashboardError(context, parsed.error ?? "Enter a valid chore.");
    }

    const result = await updateHouseholdChore(supabase, {
      householdId: guard.member.household_id,
      choreId,
      name: parsed.data.name,
      weight: parsed.data.weight,
    });

    if (result.error) {
      return redirectToDashboardError(context, "We could not update that chore right now.");
    }

    return context.redirect(`${DASHBOARD_ROUTE}?notice=chore-updated`);
  }

  if (action === CHORE_ACTIONS.archive) {
    const result = await archiveHouseholdChore(supabase, {
      householdId: guard.member.household_id,
      choreId,
    });

    if (result.error) {
      return redirectToDashboardError(context, "We could not remove that chore right now.");
    }

    return context.redirect(`${DASHBOARD_ROUTE}?notice=chore-removed`);
  }

  return redirectToDashboardError(context, "We could not understand that chore action.");
};

function redirectToDashboardError(context: Parameters<APIRoute>[0], message: string) {
  return context.redirect(`${DASHBOARD_ROUTE}?error=${encodeURIComponent(message)}`);
}

function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}
