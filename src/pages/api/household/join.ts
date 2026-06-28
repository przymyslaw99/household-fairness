import type { APIRoute } from "astro";
import { appendRedirectTarget } from "@/lib/auth/redirects";
import { isMissingAuthSessionError } from "@/lib/auth/session";
import { mapInviteRepositoryError, parseInviteToken } from "@/lib/household/invites";
import { joinCurrentUserHouseholdByInvite } from "@/lib/household/repository";
import { createClient } from "@/lib/supabase";

const DASHBOARD_ROUTE = "/dashboard";
const SIGN_IN_ROUTE = "/auth/signin";

export const POST: APIRoute = async (context) => {
  const form = await context.request.formData();
  const parsedToken = parseInviteToken(form.get("token"));
  const fallbackJoinRoute = buildJoinRoute(parsedToken.data ?? "invalid-token");

  if (parsedToken.error) {
    return redirectToJoin(context, fallbackJoinRoute, parsedToken.error.message);
  }

  const supabase = createClient(context.request.headers, context.cookies);

  if (!supabase) {
    return redirectToJoin(context, fallbackJoinRoute, "Supabase is not configured.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (isMissingAuthSessionError(userError?.message)) {
    return context.redirect(appendRedirectTarget(SIGN_IN_ROUTE, fallbackJoinRoute));
  }

  if (userError) {
    return redirectToJoin(context, fallbackJoinRoute, "We could not verify your session right now.");
  }

  if (!user) {
    return context.redirect(appendRedirectTarget(SIGN_IN_ROUTE, fallbackJoinRoute));
  }

  const result = await joinCurrentUserHouseholdByInvite(supabase, parsedToken.data);

  if (result.error) {
    return redirectToJoin(context, fallbackJoinRoute, mapInviteRepositoryError(result.error.message).message);
  }

  return context.redirect(DASHBOARD_ROUTE);
};

function buildJoinRoute(token: string) {
  return `/join/${encodeURIComponent(token)}`;
}

function redirectToJoin(context: Parameters<APIRoute>[0], route: string, message: string) {
  return context.redirect(`${route}?error=${encodeURIComponent(message)}`);
}
