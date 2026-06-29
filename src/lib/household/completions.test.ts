import { describe, expect, it } from "vitest";
import { parseCreateCompletionFormData, parseUndoCompletionFormData } from "./completions";

describe("parseCreateCompletionFormData", () => {
  it("returns a trimmed chore id for valid submissions", () => {
    const formData = new FormData();
    formData.set("chore_id", "  00000000-0000-0000-0000-000000000001  ");

    expect(parseCreateCompletionFormData(formData)).toEqual({
      data: {
        choreId: "00000000-0000-0000-0000-000000000001",
      },
      error: null,
    });
  });

  it("returns a user-facing error when chore_id is missing", () => {
    const formData = new FormData();

    expect(parseCreateCompletionFormData(formData)).toEqual({
      data: null,
      error: "Choose a chore before submitting.",
    });
  });
});

describe("parseUndoCompletionFormData", () => {
  it("returns a trimmed completion id for valid submissions", () => {
    const formData = new FormData();
    formData.set("completion_id", "  00000000-0000-0000-0000-000000000002  ");

    expect(parseUndoCompletionFormData(formData)).toEqual({
      data: {
        completionId: "00000000-0000-0000-0000-000000000002",
      },
      error: null,
    });
  });

  it("returns a user-facing error when completion_id is missing", () => {
    const formData = new FormData();

    expect(parseUndoCompletionFormData(formData)).toEqual({
      data: null,
      error: "Choose a completion to undo.",
    });
  });
});
