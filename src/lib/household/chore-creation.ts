export interface ChoreCreationDraft {
  name: string;
  weight: number | string;
}

export interface ChoreCreationInput {
  name: string;
  weight: number;
}

export interface ChoreCreationValidationResult {
  data: ChoreCreationInput | null;
  error: string | null;
}

export const CHORE_CREATION_LIMITS = {
  maxChoreNameLength: 80,
} as const;

export function parseChoreCreationFormData(formData: FormData): ChoreCreationDraft {
  return {
    name: readStringValue(formData.get("name")),
    weight: readStringValue(formData.get("weight")),
  };
}

export function validateChoreCreationInput(input: ChoreCreationDraft): ChoreCreationValidationResult {
  const normalizedName = input.name.trim();
  const normalizedWeight = normalizePositiveInteger(input.weight);

  if (!normalizedName) {
    return { data: null, error: "Chore name is required" };
  }

  if (normalizedName.length > CHORE_CREATION_LIMITS.maxChoreNameLength) {
    return {
      data: null,
      error: `Chore name must be ${CHORE_CREATION_LIMITS.maxChoreNameLength} characters or fewer`,
    };
  }

  if (normalizedWeight === null) {
    return { data: null, error: "Weight must be a positive integer" };
  }

  return {
    data: {
      name: normalizedName,
      weight: normalizedWeight,
    },
    error: null,
  };
}

function normalizePositiveInteger(value: number | string): number | null {
  const normalized = typeof value === "string" ? value.trim() : value;

  if (normalized === "") {
    return null;
  }

  const parsed = typeof normalized === "number" ? normalized : Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
