import { describe, expect, it } from "vitest";
import { parseChoreCreationFormData, validateChoreCreationInput } from "./chore-creation";

describe("validateChoreCreationInput", () => {
  it("trims valid chore input into a normalized payload", () => {
    expect(
      validateChoreCreationInput({
        name: "  Take out trash  ",
        weight: "3",
      }),
    ).toEqual({
      data: {
        name: "Take out trash",
        weight: 3,
      },
      error: null,
    });
  });

  it("rejects blank names", () => {
    expect(
      validateChoreCreationInput({
        name: "   ",
        weight: "2",
      }),
    ).toEqual({
      data: null,
      error: "Chore name is required",
    });
  });

  it("rejects non-positive integer weights", () => {
    expect(
      validateChoreCreationInput({
        name: "Laundry",
        weight: "0",
      }),
    ).toEqual({
      data: null,
      error: "Weight must be a positive integer",
    });
  });
});

describe("parseChoreCreationFormData", () => {
  it("reads name and weight from a POSTed form", () => {
    const formData = new FormData();
    formData.set("name", "Vacuum");
    formData.set("weight", "4");

    expect(parseChoreCreationFormData(formData)).toEqual({
      name: "Vacuum",
      weight: "4",
    });
  });
});
