import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActiveCompletionWithChore,
  Chore,
  HouseholdDatabase,
  HouseholdInvite,
  HouseholdMember,
  HouseholdSetupRpcChore,
  Uuid,
} from "./types";
import type { HouseholdSetupInput } from "./setup";

export type HouseholdSupabaseClient = SupabaseClient<HouseholdDatabase>;

export type RepositoryResult<T> =
  | { data: T; error: null }
  | {
      data: null;
      error: {
        message: string;
      };
    };

export async function createCurrentUserHousehold(
  supabase: HouseholdSupabaseClient,
  householdName: string,
): Promise<RepositoryResult<Uuid>> {
  const { data, error } = await supabase.rpc("create_household_with_owner", {
    household_name: householdName,
  });

  return toRequiredRepositoryResult(data, error);
}

export async function joinCurrentUserHouseholdByInvite(
  supabase: HouseholdSupabaseClient,
  inviteToken: string,
): Promise<RepositoryResult<Uuid>> {
  const { data, error } = await supabase.rpc("join_household_with_invite", {
    invite_token: inviteToken,
  });

  return toRequiredRepositoryResult(data, error);
}

export async function createCurrentUserHouseholdSetup(
  supabase: HouseholdSupabaseClient,
  input: HouseholdSetupInput,
): Promise<RepositoryResult<Uuid>> {
  const { data, error } = await supabase.rpc("create_household_with_initial_chores", {
    household_name: input.householdName,
    chores: input.chores as HouseholdSetupRpcChore[],
  });

  return toRequiredRepositoryResult(data, error);
}

export async function getCurrentUserHouseholdMembership(
  supabase: HouseholdSupabaseClient,
): Promise<RepositoryResult<HouseholdMember | null>> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { data: null, error: { message: userError.message } };
  }

  if (!user) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase.from("household_members").select("*").eq("user_id", user.id).maybeSingle();

  return toRepositoryResult(data, error);
}

export async function listHouseholdChores(
  supabase: HouseholdSupabaseClient,
  householdId: Uuid,
): Promise<RepositoryResult<Chore[]>> {
  const { data, error } = await supabase
    .from("chores")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: true });

  return toRepositoryResult(data ?? [], error);
}

export async function listActiveRecentCompletions(
  supabase: HouseholdSupabaseClient,
  householdId: Uuid,
  windowStart: Date,
): Promise<RepositoryResult<ActiveCompletionWithChore[]>> {
  const { data, error } = await supabase
    .from("chore_completions")
    .select("*, chores(id, name, weight)")
    .eq("household_id", householdId)
    .is("undone_at", null)
    .gte("completed_at", windowStart.toISOString())
    .order("completed_at", { ascending: false });

  return toRepositoryResult(data ?? [], error);
}

export async function fetchActiveInviteByToken(
  supabase: HouseholdSupabaseClient,
  inviteToken: string,
): Promise<RepositoryResult<HouseholdInvite | null>> {
  const { data, error } = await supabase
    .rpc("fetch_active_invite_by_token", {
      invite_token: inviteToken,
    })
    .maybeSingle();

  return toRepositoryResult(data, error);
}

function toRepositoryResult<T>(
  data: T,
  error: {
    message: string;
  } | null,
): RepositoryResult<T> {
  if (error) {
    return { data: null, error: { message: error.message } };
  }

  return { data, error: null };
}

function toRequiredRepositoryResult<T>(
  data: T | null,
  error: {
    message: string;
  } | null,
): RepositoryResult<T> {
  if (error) {
    return { data: null, error: { message: error.message } };
  }

  if (data === null) {
    return { data: null, error: { message: "Expected data was not returned." } };
  }

  return { data, error: null };
}
