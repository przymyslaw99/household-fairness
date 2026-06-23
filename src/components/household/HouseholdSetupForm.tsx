import { Home, ListTodo, Plus, Scale, Trash2 } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { FormField } from "@/components/auth/FormField";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  validateHouseholdSetupInput,
  type HouseholdSetupChoreDraft,
  type HouseholdSetupValidationErrors,
} from "@/lib/household/setup";
import { cn } from "@/lib/utils";

interface Props {
  serverError?: string | null;
}

const EMPTY_CHORE: HouseholdSetupChoreDraft = {
  name: "",
  weight: "1",
};

export default function HouseholdSetupForm({ serverError }: Props) {
  const [householdName, setHouseholdName] = useState("");
  const [chores, setChores] = useState<HouseholdSetupChoreDraft[]>([{ ...EMPTY_CHORE }]);
  const [errors, setErrors] = useState<HouseholdSetupValidationErrors>({
    householdName: undefined,
    chores: [{}],
    form: undefined,
  });

  function updateChore(index: number, field: keyof HouseholdSetupChoreDraft, value: string) {
    if (field === "weight" && !/^\d*$/.test(value)) {
      return;
    }

    setChores((current) =>
      current.map((chore, choreIndex) => (choreIndex === index ? { ...chore, [field]: value } : chore)),
    );

    setErrors((current) => ({
      ...current,
      form: undefined,
      chores: current.chores.map((choreErrors, choreIndex) =>
        choreIndex === index ? { ...choreErrors, [field]: undefined } : choreErrors,
      ),
    }));
  }

  function addChoreRow() {
    setChores((current) => [...current, { ...EMPTY_CHORE }]);
    setErrors((current) => ({
      ...current,
      form: undefined,
      chores: [...current.chores, {}],
    }));
  }

  function removeChoreRow(index: number) {
    if (chores.length === 1) {
      return;
    }

    setChores((current) => current.filter((_, choreIndex) => choreIndex !== index));
    setErrors((current) => ({
      ...current,
      form: undefined,
      chores: current.chores.filter((_, choreIndex) => choreIndex !== index),
    }));
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    const result = validateHouseholdSetupInput({ householdName, chores });
    setErrors(result.errors);

    if (!result.data) {
      event.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/household/setup" className="space-y-5" onSubmit={handleSubmit} noValidate>
      <FormField
        id="householdName"
        label="Household name"
        value={householdName}
        onChange={(value) => {
          setHouseholdName(value);
          setErrors((current) => ({ ...current, householdName: undefined }));
        }}
        placeholder="Flat 7"
        error={errors.householdName}
        icon={<Home className="size-4" />}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-blue-100/80">Starting chores</p>
            <p className="text-xs text-blue-100/50">Add at least one visible weighted chore for your household.</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="bg-white/10 text-white hover:bg-white/20"
            onClick={addChoreRow}
          >
            <Plus className="size-4" />
            Add chore
          </Button>
        </div>

        <div className="space-y-3">
          {chores.map((chore, index) => (
            <div key={index} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="space-y-3">
                <div className="min-w-0">
                  <FormField
                    id={`choreName-${index}`}
                    name="choreName"
                    label={`Chore ${index + 1}`}
                    value={chore.name}
                    onChange={(value) => {
                      updateChore(index, "name", value);
                    }}
                    placeholder="Take out trash"
                    error={errors.chores[index]?.name}
                    icon={<ListTodo className="size-4" />}
                  />
                </div>

                <div className="min-w-0">
                  <FormField
                    id={`choreWeight-${index}`}
                    name="choreWeight"
                    label="Weight"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={String(chore.weight)}
                    onChange={(value) => {
                      updateChore(index, "weight", value);
                    }}
                    placeholder="1"
                    error={errors.chores[index]?.weight}
                    icon={<Scale className="size-4" />}
                  />
                </div>

                <div className={cn("flex", chores.length === 1 ? "opacity-60" : undefined)}>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-center border border-white/10 text-white hover:bg-white/10 sm:w-auto sm:min-w-28"
                    onClick={() => {
                      removeChoreRow(index);
                    }}
                    disabled={chores.length === 1}
                  >
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ServerError message={errors.form} />
      </div>

      <ServerError message={serverError} />

      <SubmitButton pendingText="Creating household..." icon={<Home className="size-4" />}>
        Create household
      </SubmitButton>
    </form>
  );
}
