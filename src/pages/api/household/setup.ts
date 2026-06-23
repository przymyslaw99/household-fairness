import type { APIRoute } from "astro";
import { createCurrentUserHouseholdSetup } from "@/lib/household/repository";
import { parseHouseholdSetupFormData, validateHouseholdSetupInput } from "@/lib/household/setup";
import { createClient } from "@/lib/supabase";

const SETUP_ROUTE = "/setup/household";
const SIGN_IN_ROUTE = "/auth/signin";

export const POST: APIRoute = async (context) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (!supabase) {
    return context.redirect(`${SETUP_ROUTE}?error=${encodeURIComponent("Supabase is not configured")}`);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return context.redirect(`${SETUP_ROUTE}?error=${encodeURIComponent(userError.message)}`);
  }

  if (!user) {
    return context.redirect(SIGN_IN_ROUTE);
  }

  const formData = await context.request.formData();
  const validation = validateHouseholdSetupInput(parseHouseholdSetupFormData(formData));

  if (!validation.data) {
    return context.redirect(`${SETUP_ROUTE}?error=${encodeURIComponent(formatValidationError(validation.errors))}`);
  }

  const result = await createCurrentUserHouseholdSetup(supabase, validation.data);

  if (result.error) {
    return context.redirect(`${SETUP_ROUTE}?error=${encodeURIComponent(result.error.message)}`);
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
