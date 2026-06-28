import { ArrowRight, ShieldAlert, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  token?: string | null;
  isInviteValid: boolean;
  serverError?: string | null;
}

export default function JoinHouseholdForm({ token, isInviteValid, serverError }: Props) {
  if (!isInviteValid) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-blue-100">
            <ShieldAlert className="size-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-white">Invite link unavailable</h2>
          <p className="mt-2 text-sm leading-6 text-blue-100/65">
            This invite link is invalid, disabled, or no longer available. Ask the household owner for a fresh link if
            you still need to join.
          </p>
        </div>

        {serverError ? (
          <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm text-amber-50">
            {serverError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
        <div
          className={cn(
            "mx-auto flex size-12 items-center justify-center rounded-full border",
            "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
          )}
        >
          <UserPlus className="size-5" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-white">Join this household</h2>
        <p className="mt-2 text-sm leading-6 text-blue-100/65">
          Joining adds your account to this household and sends you to the shared dashboard. Nothing happens until you
          confirm below.
        </p>
      </div>

      {serverError ? (
        <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-center text-sm text-amber-50">
          {serverError}
        </p>
      ) : null}

      <form method="POST" action="/api/household/join" className="space-y-3">
        <input type="hidden" name="token" value={token ?? ""} />
        <Button type="submit" className="w-full bg-white text-slate-950 hover:bg-blue-100">
          <ArrowRight className="size-4" />
          Confirm and join household
        </Button>
      </form>
    </div>
  );
}
