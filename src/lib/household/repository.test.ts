import { describe, expect, it, vi } from "vitest";
import {
  createCurrentUserChoreCompletion,
  createActiveInviteForCurrentOwner,
  disableActiveInviteForCurrentOwner,
  getActiveInviteForHousehold,
  type HouseholdSupabaseClient,
  listActiveRecentCompletions,
  listHouseholdMembers,
  undoCurrentUserChoreCompletion,
} from "./repository";
import { HOUSEHOLD_ROLES, type HouseholdInvite, type HouseholdMember } from "./types";

const INVITE: HouseholdInvite = {
  id: "00000000-0000-4000-8000-000000000010",
  household_id: "00000000-0000-4000-8000-000000000020",
  token: "abc123def456ghi789",
  created_by: "00000000-0000-4000-8000-000000000030",
  created_at: "2026-06-27T10:00:00.000Z",
  disabled_at: null,
};
const MEMBERSHIP: HouseholdMember = {
  id: "00000000-0000-4000-8000-000000000040",
  household_id: "00000000-0000-4000-8000-000000000020",
  user_id: "00000000-0000-4000-8000-000000000030",
  role: HOUSEHOLD_ROLES.member,
  created_at: "2026-06-27T10:00:00.000Z",
};
const COMPLETION_ID = "00000000-0000-4000-8000-000000000050";
const CHORE_ID = "00000000-0000-4000-8000-000000000060";
const WINDOW_START = new Date("2026-06-13T10:00:00.000Z");
const WINDOW_END = new Date("2026-06-27T10:00:00.000Z");

describe("getActiveInviteForHousehold", () => {
  it("returns the current active invite when one exists", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: INVITE, error: null });
    const order = vi.fn().mockReturnValue({ maybeSingle });
    const is = vi.fn().mockReturnValue({ order });
    const eq = vi.fn().mockReturnValue({ is });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as unknown as HouseholdSupabaseClient;

    const result = await getActiveInviteForHousehold(supabase, INVITE.household_id);

    expect(from).toHaveBeenCalledWith("household_invites");
    expect(eq).toHaveBeenCalledWith("household_id", INVITE.household_id);
    expect(is).toHaveBeenCalledWith("disabled_at", null);
    expect(result).toEqual({ data: INVITE, error: null });
  });
});

describe("listHouseholdMembers", () => {
  it("returns household members in stable creation order for the requested household", async () => {
    const ownerMembership = {
      ...MEMBERSHIP,
      id: "00000000-0000-4000-8000-000000000041",
      role: HOUSEHOLD_ROLES.owner,
    };
    const order = vi.fn().mockResolvedValue({ data: [ownerMembership, MEMBERSHIP], error: null });
    const eq = vi.fn().mockReturnValue({ order });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as unknown as HouseholdSupabaseClient;

    const result = await listHouseholdMembers(supabase, MEMBERSHIP.household_id);

    expect(from).toHaveBeenCalledWith("household_members");
    expect(eq).toHaveBeenCalledWith("household_id", MEMBERSHIP.household_id);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(result).toEqual({ data: [ownerMembership, MEMBERSHIP], error: null });
  });
});

describe("listActiveRecentCompletions", () => {
  it("bounds active completion history to the exact score window", async () => {
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const lte = vi.fn().mockReturnValue({ order });
    const gte = vi.fn().mockReturnValue({ lte });
    const is = vi.fn().mockReturnValue({ gte });
    const eq = vi.fn().mockReturnValue({ is });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });
    const supabase = { from } as unknown as HouseholdSupabaseClient;

    const result = await listActiveRecentCompletions(supabase, MEMBERSHIP.household_id, WINDOW_START, WINDOW_END);

    expect(from).toHaveBeenCalledWith("chore_completions");
    expect(eq).toHaveBeenCalledWith("household_id", MEMBERSHIP.household_id);
    expect(is).toHaveBeenCalledWith("undone_at", null);
    expect(gte).toHaveBeenCalledWith("completed_at", WINDOW_START.toISOString());
    expect(lte).toHaveBeenCalledWith("completed_at", WINDOW_END.toISOString());
    expect(order).toHaveBeenCalledWith("completed_at", { ascending: false });
    expect(result).toEqual({ data: [], error: null });
  });
});

describe("createActiveInviteForCurrentOwner", () => {
  it("creates or reuses the active invite through the owner-scoped rpc", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: INVITE, error: null });
    const rpc = vi.fn().mockReturnValue({ maybeSingle });
    const supabase = { rpc } as unknown as HouseholdSupabaseClient;

    const result = await createActiveInviteForCurrentOwner(supabase, INVITE.household_id, INVITE.token);

    expect(rpc).toHaveBeenCalledWith("create_or_get_active_invite", {
      target_household_id: INVITE.household_id,
      invite_token: INVITE.token,
    });
    expect(result).toEqual({ data: INVITE, error: null });
  });

  it("surfaces non-owner denial from the database layer", async () => {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Only household owners can manage invites" } });
    const rpc = vi.fn().mockReturnValue({ maybeSingle });
    const supabase = { rpc } as unknown as HouseholdSupabaseClient;

    const result = await createActiveInviteForCurrentOwner(supabase, INVITE.household_id, INVITE.token);

    expect(result).toEqual({
      data: null,
      error: { message: "Only household owners can manage invites" },
    });
  });
});

describe("disableActiveInviteForCurrentOwner", () => {
  it("disables the current active invite through the owner-scoped rpc", async () => {
    const disabledInvite = { ...INVITE, disabled_at: "2026-06-27T11:00:00.000Z" };
    const maybeSingle = vi.fn().mockResolvedValue({ data: disabledInvite, error: null });
    const rpc = vi.fn().mockReturnValue({ maybeSingle });
    const supabase = { rpc } as unknown as HouseholdSupabaseClient;

    const result = await disableActiveInviteForCurrentOwner(supabase, INVITE.household_id);

    expect(rpc).toHaveBeenCalledWith("disable_active_invite", {
      target_household_id: INVITE.household_id,
    });
    expect(result).toEqual({ data: disabledInvite, error: null });
  });
});

describe("createCurrentUserChoreCompletion", () => {
  it("derives the current user and household from the server context before inserting", async () => {
    const single = vi.fn().mockResolvedValue({ data: { id: COMPLETION_ID }, error: null });
    const selectCompletion = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select: selectCompletion });
    const membershipMaybeSingle = vi.fn().mockResolvedValue({ data: MEMBERSHIP, error: null });
    const membershipEq = vi.fn().mockReturnValue({ maybeSingle: membershipMaybeSingle });
    const membershipSelect = vi.fn().mockReturnValue({ eq: membershipEq });
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({ select: membershipSelect }))
      .mockImplementationOnce(() => ({ insert }));
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: MEMBERSHIP.user_id } },
      error: null,
    });
    const supabase = { auth: { getUser }, from } as unknown as HouseholdSupabaseClient;

    const result = await createCurrentUserChoreCompletion(supabase, { choreId: CHORE_ID });

    expect(getUser).toHaveBeenCalled();
    expect(from).toHaveBeenNthCalledWith(1, "household_members");
    expect(from).toHaveBeenNthCalledWith(2, "chore_completions");
    expect(insert).toHaveBeenCalledWith({
      household_id: MEMBERSHIP.household_id,
      chore_id: CHORE_ID,
      completed_by: MEMBERSHIP.user_id,
    });
    expect(result).toEqual({ data: COMPLETION_ID, error: null });
  });
});

describe("undoCurrentUserChoreCompletion", () => {
  it("scopes undo updates to the current user's active completion in their household", async () => {
    const maybeSingleUndo = vi.fn().mockResolvedValue({ data: { id: COMPLETION_ID }, error: null });
    const selectUndo = vi.fn().mockReturnValue({ maybeSingle: maybeSingleUndo });
    const isUndo = vi.fn().mockReturnValue({ select: selectUndo });
    const completedByEq = vi.fn().mockReturnValue({ is: isUndo });
    const householdEq = vi.fn().mockReturnValue({ eq: completedByEq });
    const idEq = vi.fn().mockReturnValue({ eq: householdEq });
    const update = vi.fn().mockReturnValue({ eq: idEq });
    const membershipMaybeSingle = vi.fn().mockResolvedValue({ data: MEMBERSHIP, error: null });
    const membershipEq = vi.fn().mockReturnValue({ maybeSingle: membershipMaybeSingle });
    const membershipSelect = vi.fn().mockReturnValue({ eq: membershipEq });
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({ select: membershipSelect }))
      .mockImplementationOnce(() => ({ update }));
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: MEMBERSHIP.user_id } },
      error: null,
    });
    const supabase = { auth: { getUser }, from } as unknown as HouseholdSupabaseClient;

    const result = await undoCurrentUserChoreCompletion(supabase, { completionId: COMPLETION_ID });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        undone_by: MEMBERSHIP.user_id,
      }),
    );
    expect(idEq).toHaveBeenCalledWith("id", COMPLETION_ID);
    expect(householdEq).toHaveBeenCalledWith("household_id", MEMBERSHIP.household_id);
    expect(completedByEq).toHaveBeenCalledWith("completed_by", MEMBERSHIP.user_id);
    expect(isUndo).toHaveBeenCalledWith("undone_at", null);
    expect(result).toEqual({ data: COMPLETION_ID, error: null });
  });

  it("returns a repository error when no active owned completion matched the undo request", async () => {
    const maybeSingleUndo = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectUndo = vi.fn().mockReturnValue({ maybeSingle: maybeSingleUndo });
    const isUndo = vi.fn().mockReturnValue({ select: selectUndo });
    const completedByEq = vi.fn().mockReturnValue({ is: isUndo });
    const householdEq = vi.fn().mockReturnValue({ eq: completedByEq });
    const idEq = vi.fn().mockReturnValue({ eq: householdEq });
    const update = vi.fn().mockReturnValue({ eq: idEq });
    const membershipMaybeSingle = vi.fn().mockResolvedValue({ data: MEMBERSHIP, error: null });
    const membershipEq = vi.fn().mockReturnValue({ maybeSingle: membershipMaybeSingle });
    const membershipSelect = vi.fn().mockReturnValue({ eq: membershipEq });
    const from = vi
      .fn()
      .mockImplementationOnce(() => ({ select: membershipSelect }))
      .mockImplementationOnce(() => ({ update }));
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: MEMBERSHIP.user_id } },
      error: null,
    });
    const supabase = { auth: { getUser }, from } as unknown as HouseholdSupabaseClient;

    const result = await undoCurrentUserChoreCompletion(supabase, { completionId: COMPLETION_ID });

    expect(result).toEqual({
      data: null,
      error: { message: "Completion not found." },
    });
  });
});
