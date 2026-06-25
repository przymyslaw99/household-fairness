import type { APIRoute } from "astro";
import { createCurrentUserHouseholdSetup, getCurrentUserHouseholdMembership } from "@/lib/household/repository";
import { parseHouseholdSetupFormData, validateHouseholdSetupInput } from "@/lib/household/setup";
import { createClient } from "@/lib/supabase";

const SETUP_ROUTE = "/setup/household";
const SIGN_IN_ROUTE = "/auth/signin";

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (!supabase) {
    return redirectToSetupError(context, "Supabase is not configured");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return redirectToSetupError(context, userError.message);
  }

  if (!user) {
    return context.redirect(SIGN_IN_ROUTE);
  }

  const membershipResult = await getCurrentUserHouseholdMembership(supabase);

  if (membershipResult.error) {
    return redirectToSetupError(context, membershipResult.error.message);
  }

  if (membershipResult.data) {
    return context.redirect("/dashboard");
  }

  const formData = await context.request.formData();
  const validation = validateHouseholdSetupInput(parseHouseholdSetupFormData(formData));

  if (!validation.data) {
    return redirectToSetupError(context, formatValidationError(validation.errors));
  }

  const result = await createCurrentUserHouseholdSetup(supabase, validation.data);

  if (result.error) {
    return redirectToSetupError(context, result.error.message);
  }

  return context.redirect("/dashboard");
};

function formatValidationError(errors: ReturnType<typeof validateHouseholdSetupInput>["errors"]): string {
  if (errors.householdName) {
    return errors.householdName;
  }

  if (errors.form) {
    return errors.form;
  }

  for (const choreErrors of errors.chores) {
    if (choreErrors.name) {
      return choreErrors.name;
    }

    if (choreErrors.weight) {
      return choreErrors.weight;
    }
  }

  return "Enter a valid household setup";
}

function redirectToSetupError(context: Parameters<APIRoute>[0], message: string) {
  return context.redirect(`${SETUP_ROUTE}?error=${encodeURIComponent(message)}`);
}
