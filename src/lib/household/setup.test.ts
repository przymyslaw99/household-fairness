import { describe, expect, it } from "vitest";
import { validateHouseholdSetupInput } from "./setup";

describe("validateHouseholdSetupInput", () => {
  it("trims a valid payload and returns normalized data", () => {
    const result = validateHouseholdSetupInput({
      householdName: "  Flat 7  ",
      chores: [
        { name: "  Take out trash  ", weight: "3" },
        { name: "Vacuum", weight: 5 },
      ],
    });

    expect(result.errors).toEqual({
      householdName: undefined,
      chores: [{}, {}],
      form: undefined,
    });
    expect(result.data).toEqual({
      householdName: "Flat 7",
      chores: [
        { name: "Take out trash", weight: 3 },
        { name: "Vacuum", weight: 5 },
      ],
    });
  });

  it("rejects an empty household name", () => {
    const result = validateHouseholdSetupInput({
      householdName: "   ",
      chores: [{ name: "Dishes", weight: 2 }],
    });

    expect(result.data).toBeNull();
    expect(result.errors.householdName).toBe("Household name is required");
  });

  it("requires at least one chore", () => {
    const result = validateHouseholdSetupInput({
      householdName: "Flat 7",
      chores: [],
    });

    expect(result.data).toBeNull();
    expect(result.errors.form).toBe("Add at least one chore");
  });

  it("rejects empty chore names", () => {
    const result = validateHouseholdSetupInput({
      householdName: "Flat 7",
      chores: [{ name: "   ", weight: 2 }],
    });

    expect(result.data).toBeNull();
    expect(result.errors.chores[0]).toEqual({
      name: "Chore name is required",
    });
  });

  it("rejects non-positive weights", () => {
    const result = validateHouseholdSetupInput({
      householdName: "Flat 7",
      chores: [{ name: "Dishes", weight: 0 }],
    });

    expect(result.data).toBeNull();
    expect(result.errors.chores[0]).toEqual({
      weight: "Weight must be a positive integer",
    });
  });

  it("rejects non-integer weights", () => {
    const result = validateHouseholdSetupInput({
      householdName: "Flat 7",
      chores: [{ name: "Dishes", weight: "1.5" }],
    });

    expect(result.data).toBeNull();
    expect(result.errors.chores[0]).toEqual({
      weight: "Weight must be a positive integer",
    });
  });

  it("rejects duplicate chore names after trimming and case normalization", () => {
    const result = validateHouseholdSetupInput({
      householdName: "Flat 7",
      chores: [
        { name: "  Dishes", weight: 2 },
        { name: "dishes  ", weight: 4 },
      ],
    });

    expect(result.data).toBeNull();
    expect(result.errors.chores).toEqual([
      { name: "Chore names must be unique" },
      { name: "Chore names must be unique" },
    ]);
  });
});
