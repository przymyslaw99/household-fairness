import { defineMiddleware } from "astro:middleware";
import { getCurrentUserHouseholdMembership } from "@/lib/household/repository";
import { createClient } from "@/lib/supabase";

// Add only real household routes here; F-01 defines contracts without reserving route names.
const PROTECTED_ROUTES = ["/dashboard", "/setup/household", "/household/invite", "/api/household/completions"];

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createClient(context.request.headers, context.cookies);

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    context.locals.user = user ?? null;
  } else {
    context.locals.user = null;
  }

  if (PROTECTED_ROUTES.some((route) => context.url.pathname.startsWith(route))) {
    if (!context.locals.user) {
      return context.redirect("/auth/signin");
    }

    if (
      (context.url.pathname.startsWith("/setup/household") || context.url.pathname.startsWith("/household/invite")) &&
      supabase
    ) {
      const membershipResult = await getCurrentUserHouseholdMembership(supabase);

      if (context.url.pathname.startsWith("/setup/household") && !membershipResult.error && membershipResult.data) {
        return context.redirect("/dashboard");
      }

      if (context.url.pathname.startsWith("/household/invite") && !membershipResult.error && !membershipResult.data) {
        return context.redirect("/setup/household");
      }
    }
  }

  return next();
});
