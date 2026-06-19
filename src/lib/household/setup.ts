export interface HouseholdSetupChoreDraft {
  name: string;
  weight: number | string;
}

export interface HouseholdSetupDraft {
  householdName: string;
  chores: HouseholdSetupChoreDraft[];
}

export interface HouseholdSetupChoreInput {
  name: string;
  weight: number;
}

export interface HouseholdSetupInput {
  householdName: string;
  chores: HouseholdSetupChoreInput[];
}

export interface HouseholdSetupChoreErrors {
  name?: string;
  weight?: string;
}

export interface HouseholdSetupValidationErrors {
  householdName?: string;
  chores: HouseholdSetupChoreErrors[];
  form?: string;
}

export interface HouseholdSetupValidationResult {
  data: HouseholdSetupInput | null;
  errors: HouseholdSetupValidationErrors;
}

export function validateHouseholdSetupInput(input: HouseholdSetupDraft): HouseholdSetupValidationResult {
  const normalizedHouseholdName = input.householdName.trim();
  const choreErrors: HouseholdSetupChoreErrors[] = input.chores.map(() => ({}));
  const normalizedChores: HouseholdSetupChoreInput[] = [];
  const duplicateGroups = new Map<string, number[]>();
  let householdNameError: string | undefined;
  let formError: string | undefined;

  if (!normalizedHouseholdName) {
    householdNameError = "Household name is required";
  }

  if (input.chores.length === 0) {
    formError = "Add at least one chore";
  }

  input.chores.forEach((chore, index) => {
    const normalizedName = chore.name.trim();
    const weight = normalizePositiveInteger(chore.weight);

    if (!normalizedName) {
      choreErrors[index].name = "Chore name is required";
    } else {
      const duplicateKey = normalizedName.toLocaleLowerCase();
      const existingIndexes = duplicateGroups.get(duplicateKey) ?? [];
      existingIndexes.push(index);
      duplicateGroups.set(duplicateKey, existingIndexes);
    }

    if (weight === null) {
      choreErrors[index].weight = "Weight must be a positive integer";
    }

    normalizedChores.push({
      name: normalizedName,
      weight: weight ?? 0,
    });
  });

  for (const indexes of duplicateGroups.values()) {
    if (indexes.length < 2) {
      continue;
    }

    for (const index of indexes) {
      choreErrors[index].name = "Chore names must be unique";
    }
  }

  const hasErrors =
    Boolean(householdNameError) ||
    Boolean(formError) ||
    choreErrors.some((errors) => Boolean(errors.name) || Boolean(errors.weight));

  return {
    data: hasErrors
      ? null
      : {
          householdName: normalizedHouseholdName,
          chores: normalizedChores,
        },
    errors: {
      householdName: householdNameError,
      chores: choreErrors,
      form: formError,
    },
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
