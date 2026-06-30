import { ListTodo, Plus, Scale } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { FormField } from "@/components/auth/FormField";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { validateChoreCreationInput } from "@/lib/household/chore-creation";

interface Props {
  serverError?: string | null;
}

export default function AddChoreForm({ serverError }: Props) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("1");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    const result = validateChoreCreationInput({ name, weight });
    setError(result.error);

    if (!result.data) {
      event.preventDefault();
    }
  }

  return (
    <form method="POST" action="/api/household/chores" className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <FormField
          id="dashboard-chore-name"
          name="name"
          label="Chore name"
          value={name}
          onChange={(value) => {
            setName(value);
            setError(null);
          }}
          placeholder="Clean kitchen"
          icon={<ListTodo className="size-4" />}
        />

        <FormField
          id="dashboard-chore-weight"
          name="weight"
          label="Weight"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={weight}
          onChange={(value) => {
            if (!/^\d*$/.test(value)) {
              return;
            }

            setWeight(value);
            setError(null);
          }}
          placeholder="1"
          icon={<Scale className="size-4" />}
        />
      </div>

      <ServerError message={error} />
      <ServerError message={serverError} />

      <div className="sm:max-w-56">
        <SubmitButton pendingText="Adding chore..." icon={<Plus className="size-4" />}>
          Add chore
        </SubmitButton>
      </div>
    </form>
  );
}
