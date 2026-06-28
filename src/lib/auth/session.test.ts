import { describe, expect, it } from "vitest";
import { isMissingAuthSessionError } from "./session";

describe("isMissingAuthSessionError", () => {
  it("detects the signed-out auth-session error from Supabase", () => {
    expect(isMissingAuthSessionError("Auth session missing!")).toBe(true);
    expect(isMissingAuthSessionError("auth session missing")).toBe(true);
  });

  it("does not classify unrelated auth errors as signed-out state", () => {
    expect(isMissingAuthSessionError("JWT expired")).toBe(false);
    expect(isMissingAuthSessionError(null)).toBe(false);
  });
});
