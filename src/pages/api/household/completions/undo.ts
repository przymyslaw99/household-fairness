import type { APIRoute } from "astro";
import { parseUndoCompletionFormData } from "@/lib/household/completions";
import { requireCurrentHouseholdMember } from "@/lib/household/guards";
import { undoCurrentUserChoreCompletion } from "@/lib/household/repository";
import { createClient } from "@/lib/supabase";

const DASHBOARD_ROUTE = "/dashboard";
const SIGN_IN_ROUTE = "/auth/signin";

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (!supabase) {
    return redirectToDashboardError(context, "Supabase is not configured.");
  }

  const guard = await requireCurrentHouseholdMember(supabase);

  if (guard.status === "unauthenticated") {
    return context.redirect(SIGN_IN_ROUTE);
  }

  if (guard.status === "missing_membership") {
    return redirectToDashboardError(context, "Household membership is required.");
  }

  if (guard.status === "wrong_role") {
    return redirectToDashboardError(context, "You do not have access to this household.");
  }

  if (guard.status === "error") {
    return redirectToDashboardError(context, "We could not verify your household access right now.");
  }

  const parsed = parseUndoCompletionFormData(await context.request.formData());

  if (parsed.error) {
    return redirectToDashboardError(context, parsed.error);
  }

  const result = await undoCurrentUserChoreCompletion(supabase, parsed.data);

  if (result.error) {
    return redirectToDashboardError(context, "We could not undo that completion.");
  }

  return context.redirect(`${DASHBOARD_ROUTE}?notice=undone`);
};

function redirectToDashboardError(context: Parameters<APIRoute>[0], message: string) {
  return context.redirect(`${DASHBOARD_ROUTE}?error=${encodeURIComponent(message)}`);
}
