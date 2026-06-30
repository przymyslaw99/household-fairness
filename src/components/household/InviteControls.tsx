import { Copy, Link2, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { ServerError } from "@/components/auth/ServerError";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  activeInviteUrl?: string | null;
  notice?: string | null;
  serverError?: string | null;
}

export default function InviteControls({ activeInviteUrl, notice, serverError }: Props) {
  const [copied, setCopied] = useState(false);
  const hasActiveInvite = Boolean(activeInviteUrl);

  async function handleCopy() {
    if (!activeInviteUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeInviteUrl);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center rounded-full border",
              hasActiveInvite
                ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                : "border-white/10 bg-white/5 text-blue-100",
            )}
          >
            {hasActiveInvite ? <ShieldCheck className="size-5" /> : <Link2 className="size-5" />}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-white">{!hasActiveInvite && "No active invite link yet"}</p>
          </div>
        </div>

        {hasActiveInvite ? (
          <div className="mt-4 space-y-3">
            <label
              className="block text-center text-xs tracking-[0.24em] text-blue-100/45 uppercase"
              htmlFor="activeInviteUrl"
            >
              Invite link
            </label>
            <div className="flex flex-col gap-3">
              <input
                id="activeInviteUrl"
                readOnly
                value={activeInviteUrl ?? ""}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-blue-50 outline-none"
              />
              <Button
                type="button"
                variant="secondary"
                className="w-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => {
                  void handleCopy();
                }}
              >
                <Copy className="size-4" />
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {notice ? (
        <div className="rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-center text-sm text-emerald-50">
          {notice}
        </div>
      ) : null}

      {serverError ? (
        <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
          <div className="flex items-center justify-center gap-2 text-center">
            <ShieldAlert className="size-4 shrink-0" />
            <ServerError message={serverError} />
          </div>
        </div>
      ) : null}

      <div className="grid gap-3">
        {hasActiveInvite ? (
          <form method="POST" action="/api/household/invite/disable">
            <Button
              type="submit"
              variant="ghost"
              className="w-full border border-white/10 text-white hover:bg-white/10"
            >
              <Trash2 className="size-4" />
              Disable active invite
            </Button>
          </form>
        ) : (
          <form method="POST" action="/api/household/invite/create">
            <Button type="submit" className="w-full bg-white text-slate-950 hover:bg-blue-100">
              <Link2 className="size-4" />
              Create invite link
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
