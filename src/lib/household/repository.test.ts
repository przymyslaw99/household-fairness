import { describe, expect, it, vi } from "vitest";
import {
  createActiveInviteForCurrentOwner,
  disableActiveInviteForCurrentOwner,
  getActiveInviteForHousehold,
  type HouseholdSupabaseClient,
} from "./repository";
import type { HouseholdInvite } from "./types";

const INVITE: HouseholdInvite = {
  id: "00000000-0000-4000-8000-000000000010",
  household_id: "00000000-0000-4000-8000-000000000020",
  token: "abc123def456ghi789",
  created_by: "00000000-0000-4000-8000-000000000030",
  created_at: "2026-06-27T10:00:00.000Z",
  disabled_at: null,
};

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
