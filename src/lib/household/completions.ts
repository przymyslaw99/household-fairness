import type { Uuid } from "./types";

export interface CreateCompletionInput {
  choreId: Uuid;
}

export interface UndoCompletionInput {
  completionId: Uuid;
}

export interface CompletionFormResult<T> {
  data: T | null;
  error: string | null;
}

export function parseCreateCompletionFormData(formData: FormData): CompletionFormResult<CreateCompletionInput> {
  return readRequiredStringField(formData, "chore_id", "Choose a chore before submitting.", (value) => ({
    choreId: value,
  }));
}

export function parseUndoCompletionFormData(formData: FormData): CompletionFormResult<UndoCompletionInput> {
  return readRequiredStringField(formData, "completion_id", "Choose a completion to undo.", (value) => ({
    completionId: value,
  }));
}

function readRequiredStringField<T>(
  formData: FormData,
  fieldName: string,
  missingMessage: string,
  mapValue: (value: Uuid) => T,
): CompletionFormResult<T> {
  const value = formData.get(fieldName);
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return { data: null, error: missingMessage };
  }

  return {
    data: mapValue(normalized),
    error: null,
  };
}
