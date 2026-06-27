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

export const HOUSEHOLD_SETUP_LIMITS = {
  maxHouseholdNameLength: 80,
  maxChoreNameLength: 80,
  maxChores: 20,
} as const;

const INDEXED_CHORE_FIELD_PATTERN = /^chores\[(\d+)\](?:\.|\[)(name|weight)\]?$/;
const MAX_PARSED_CHORES = HOUSEHOLD_SETUP_LIMITS.maxChores + 1;

export function validateHouseholdSetupInput(input: HouseholdSetupDraft): HouseholdSetupValidationResult {
  const normalizedHouseholdName = input.householdName.trim();
  const choresToValidate = input.chores.slice(0, HOUSEHOLD_SETUP_LIMITS.maxChores);
  const choreErrors: HouseholdSetupChoreErrors[] = choresToValidate.map(() => ({}));
  const normalizedChores: HouseholdSetupChoreInput[] = [];
  const duplicateGroups = new Map<string, number[]>();
  let householdNameError: string | undefined;
  let formError: string | undefined;

  if (!normalizedHouseholdName) {
    householdNameError = "Household name is required";
  } else if (normalizedHouseholdName.length > HOUSEHOLD_SETUP_LIMITS.maxHouseholdNameLength) {
    householdNameError = `Household name must be ${HOUSEHOLD_SETUP_LIMITS.maxHouseholdNameLength} characters or fewer`;
  }

  if (input.chores.length === 0) {
    formError = "Add at least one chore";
  } else if (input.chores.length > HOUSEHOLD_SETUP_LIMITS.maxChores) {
    formError = `Add no more than ${HOUSEHOLD_SETUP_LIMITS.maxChores} chores`;
  }

  choresToValidate.forEach((chore, index) => {
    const normalizedName = chore.name.trim();
    const weight = normalizePositiveInteger(chore.weight);

    if (!normalizedName) {
      choreErrors[index].name = "Chore name is required";
    } else if (normalizedName.length > HOUSEHOLD_SETUP_LIMITS.maxChoreNameLength) {
      choreErrors[index].name = `Chore name must be ${HOUSEHOLD_SETUP_LIMITS.maxChoreNameLength} characters or fewer`;
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

export function parseHouseholdSetupFormData(formData: FormData): HouseholdSetupDraft {
  return {
    householdName: readStringValue(formData.get("householdName")),
    chores: parseIndexedChores(formData) ?? parseRepeatedChores(formData),
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

function parseIndexedChores(formData: FormData): HouseholdSetupChoreDraft[] | null {
  const indexedDrafts = new Map<number, Partial<HouseholdSetupChoreDraft>>();

  for (const [key, value] of formData.entries()) {
    const match = INDEXED_CHORE_FIELD_PATTERN.exec(key);

    if (!match) {
      continue;
    }

    const index = Number(match[1]);
    const field = match[2] as keyof HouseholdSetupChoreDraft;
    const isNewIndex = !indexedDrafts.has(index);

    if (isNewIndex && indexedDrafts.size >= MAX_PARSED_CHORES) {
      continue;
    }

    const current = indexedDrafts.get(index) ?? {};

    current[field] = readStringValue(value);
    indexedDrafts.set(index, current);
  }

  if (indexedDrafts.size === 0) {
    return null;
  }

  return [...indexedDrafts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, value]) => ({
      name: value.name ?? "",
      weight: value.weight ?? "",
    }));
}

function parseRepeatedChores(formData: FormData): HouseholdSetupChoreDraft[] {
  const names = formData.getAll("choreName").slice(0, MAX_PARSED_CHORES).map(readStringValue);
  const weights = formData.getAll("choreWeight").slice(0, MAX_PARSED_CHORES).map(readStringValue);
  const choreCount = Math.max(names.length, weights.length);

  return Array.from({ length: choreCount }, (_, index) => ({
    name: names[index] ?? "",
    weight: weights[index] ?? "",
  }));
}

function readStringValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
