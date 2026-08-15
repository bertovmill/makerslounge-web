"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/eve-workshop/ui/dialog";
import { deleteAccountAction } from "@/app/eve-workshop/profile/actions";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteAccountAction();
    if (!result.ok) {
      setError(result.error);
      setPending(false);
      return;
    }
    // A hard load, not router.push: Clerk's client state has to be rebuilt from
    // the now-cleared cookies, which a soft navigation wouldn't do.
    window.location.href = "/eve-workshop/sign-in";
  }

  return (
    <div className="rounded-2xl border border-[#f3d3d3] bg-white p-6 shadow-[0_2px_12px_rgba(15,28,46,0.04)]">
      <h2 className="text-base font-bold text-[#b42318]">Delete your profile</h2>
      <p className="mt-1 mb-4 text-sm text-ink-muted">
        Permanently removes your account and everything tied to it — your demo slot, the
        questions you asked, and anything the workshop helper remembered about you. This
        can&apos;t be undone.
      </p>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (pending) return;
          setOpen(next);
          if (!next) {
            setConfirm("");
            setError(null);
          }
        }}
      >
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#f3d3d3] px-4 py-2 text-sm font-semibold text-[#b42318] transition-colors hover:bg-[#fef3f2]"
          >
            <Trash2 className="h-4 w-4" />
            Delete profile
          </button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your profile?</DialogTitle>
            <DialogDescription>
              This permanently deletes your account and your workshop data. Type{" "}
              <span className="font-bold">{CONFIRM_WORD}</span> to confirm.
            </DialogDescription>
          </DialogHeader>

          <input
            autoFocus
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            placeholder={CONFIRM_WORD}
            className="w-full rounded-lg border border-[#e3ecf5] px-3 py-2 text-sm outline-none focus:border-brand"
          />

          {error ? <p className="text-sm text-[#b42318]">{error}</p> : null}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-ink-muted transition-colors hover:bg-[#f0f5fa] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending || confirm.trim().toUpperCase() !== CONFIRM_WORD}
              className="rounded-lg bg-[#b42318] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#912018] disabled:opacity-50"
            >
              {pending ? "Deleting…" : "Delete permanently"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
