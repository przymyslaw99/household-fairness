import { ChevronDown, ListTodo, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { FormField } from "@/components/auth/FormField";
import { ServerError } from "@/components/auth/ServerError";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Button } from "@/components/ui/button";
import { validateChoreCreationInput } from "@/lib/household/chore-creation";
import { cn } from "@/lib/utils";
import type { Chore } from "@/lib/household/types";

interface Props {
  chores: Chore[];
  serverError?: string | null;
}

export default function AddChoreForm({ chores, serverError }: Props) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [isActiveChoresOpen, setIsActiveChoresOpen] = useState(false);

  function handleCreateSubmit(event: SyntheticEvent<HTMLFormElement>) {
    const result = validateChoreCreationInput({ name, weight });
    setError(result.error);

    if (!result.data) {
      event.preventDefault();
    }
  }

  return (
    <div className="space-y-5">
      <form method="POST" action="/api/household/chores" className="space-y-4" onSubmit={handleCreateSubmit} noValidate>
        <input type="hidden" name="action" value="create" />

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <FormField
            id="dashboard-chore-name"
            name="name"
            label="New chore name"
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

      <div className="space-y-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3 text-left transition hover:bg-slate-950/45"
          aria-expanded={isActiveChoresOpen}
          aria-controls="active-chores-panel"
          onClick={() => {
            setIsActiveChoresOpen((current) => !current);
          }}
        >
          <div>
            <p className="text-sm font-medium text-white">Current active chores</p>
            <p className="text-xs text-blue-100/50">Edits affect future score calculations for this chore.</p>
          </div>
          <ChevronDown
            className={cn("size-4 shrink-0 text-blue-100/60 transition-transform", isActiveChoresOpen && "rotate-180")}
          />
        </button>

        {isActiveChoresOpen ? (
          <div id="active-chores-panel">
            {chores.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-4 text-sm text-blue-100/68">
                Add the first chore above to start the household completion loop.
              </div>
            ) : (
              <div className="space-y-3">
                {chores.map((chore) => (
                  <EditableChoreRow key={chore.id} chore={chore} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EditableChoreRow({ chore }: { chore: Chore }) {
  const [name, setName] = useState(chore.name);
  const [weight, setWeight] = useState(String(chore.weight));
  const [error, setError] = useState<string | null>(null);
  const isDirty = name !== chore.name || weight !== String(chore.weight);

  function handleUpdateSubmit(event: SyntheticEvent<HTMLFormElement>) {
    const result = validateChoreCreationInput({ name, weight });
    setError(result.error);

    if (!result.data) {
      event.preventDefault();
      return;
    }

    if (!isDirty) {
      event.preventDefault();
      setError("Change the chore name or weight before saving.");
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
      <form method="POST" action="/api/household/chores" className="space-y-4" onSubmit={handleUpdateSubmit} noValidate>
        <input type="hidden" name="action" value="update" />
        <input type="hidden" name="chore_id" value={chore.id} />

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <FormField
            id={`chore-name-${chore.id}`}
            name="name"
            label="Chore name"
            value={name}
            onChange={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder="Clean kitchen"
            icon={<Pencil className="size-4" />}
          />

          <FormField
            id={`chore-weight-${chore.id}`}
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
        <div className="sm:w-44">
          <SubmitButton pendingText="Saving chore..." icon={<Pencil className="size-4" />}>
            Save changes
          </SubmitButton>
        </div>
      </form>

      <div className={cn("mt-3 flex flex-col gap-3 sm:flex-row", !isDirty && "sm:items-center")}>
        <form method="POST" action="/api/household/chores" className="sm:w-44">
          <input type="hidden" name="action" value="archive" />
          <input type="hidden" name="chore_id" value={chore.id} />
          <Button
            type="submit"
            variant="destructive"
            className="w-full rounded-lg"
            onClick={(event) => {
              if (
                !window.confirm(`Remove "${chore.name}" from future completions? Existing history will stay visible.`)
              ) {
                event.preventDefault();
              }
            }}
          >
            <Trash2 className="size-4" />
            Remove chore
          </Button>
        </form>

        {!isDirty ? <p className="text-xs text-blue-100/50">No unsaved changes for this chore.</p> : null}
      </div>
    </div>
  );
}
