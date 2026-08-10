"use client";

import { useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mic, Plus, X } from "lucide-react";

type Slot = {
  slot: number;
  name: string;
  mine: boolean;
};

const SLOT_COUNT = 8;
const POLL_MS = 5000;

export function DemoSlots() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/demo-slots");
      if (!res.ok) return;
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      // Offline or mid-deploy — keep whatever is already on screen.
    }
  }, []);

  // The slide is on a public page — only fetch once Clerk says we're signed in,
  // otherwise every poll is a guaranteed 401.
  useEffect(() => {
    if (!isSignedIn) return;
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, isSignedIn]);

  function openClaim(slot: number) {
    if (!isSignedIn) {
      router.push("/sign-in?redirect_url=/%23demo-time");
      return;
    }
    setError(null);
    setDraft(user?.firstName ?? user?.fullName ?? "");
    setClaiming(slot);
  }

  async function claim(slot: number) {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/demo-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot, name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Couldn't grab that slot — try again.");
        await load();
        return;
      }
      setClaiming(null);
      setDraft("");
      await load();
    } catch {
      setError("Couldn't grab that slot — check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function release(slot: number) {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/demo-slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot }),
      });
      await load();
    } catch {
      setError("Couldn't release that slot — try again.");
    } finally {
      setBusy(false);
    }
  }

  const byNumber = new Map(slots.map((s) => [s.slot, s]));
  const takenByMe = slots.find((s) => s.mine);
  const remaining = SLOT_COUNT - slots.length;

  return (
    <div>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((n) => {
          const taken = byNumber.get(n);
          const isClaiming = claiming === n;

          return (
            <li
              key={n}
              className={`flex min-h-[58px] items-center gap-3 rounded-xl border px-3.5 py-2.5 transition ${
                taken?.mine
                  ? "border-brand/40 bg-brand/5"
                  : taken
                    ? "border-[#e3ecf5] bg-white"
                    : "border-dashed border-[#cddcec] bg-[#fbfdff]"
              }`}
            >
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  taken ? "bg-brand text-white" : "bg-[#e8f1fb] text-brand-dark"
                }`}
              >
                {n}
              </span>

              {taken ? (
                <>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">
                    {taken.name}
                    {taken.mine && (
                      <span className="ml-1.5 text-xs font-normal text-ink-muted">(you)</span>
                    )}
                  </span>
                  {taken.mine && (
                    <button
                      type="button"
                      onClick={() => release(n)}
                      disabled={busy}
                      aria-label="Give up your demo slot"
                      className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:bg-[#f1f6fb] hover:text-ink disabled:opacity-50"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </>
              ) : isClaiming ? (
                <form
                  className="flex min-w-0 flex-1 items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    claim(n);
                  }}
                >
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") setClaiming(null);
                    }}
                    placeholder="Your name"
                    maxLength={40}
                    className="min-w-0 flex-1 rounded-lg border border-[#cddcec] bg-white px-2.5 py-1.5 text-sm text-ink outline-none focus:border-brand"
                  />
                  <button
                    type="submit"
                    disabled={busy || !draft.trim()}
                    className="shrink-0 cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
                  >
                    {busy ? "…" : "I'm in"}
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => openClaim(n)}
                  disabled={!!takenByMe}
                  className="flex flex-1 cursor-pointer items-center gap-1.5 text-left text-sm text-ink-muted transition hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="size-3.5" />
                  {takenByMe ? "Open" : "Add your name"}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-ink-muted">
        <Mic className="size-4 text-brand" />
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : isLoaded && !isSignedIn ? (
          <span>
            <Link href="/sign-in?redirect_url=/%23demo-time" className="text-brand-dark underline">
              Sign in
            </Link>{" "}
            to claim a slot — one per person, first come first serve.
          </span>
        ) : takenByMe ? (
          <span>
            You&apos;re up in slot <strong className="text-ink">{takenByMe.slot}</strong> — get
            something on screen you can show in 2 minutes.
          </span>
        ) : remaining > 0 ? (
          <span>
            <strong className="text-ink">{remaining}</strong> of {SLOT_COUNT} slots left · one per
            person, first come first serve
          </span>
        ) : (
          <span>All 8 slots are full — grab one if someone drops out!</span>
        )}
      </p>
    </div>
  );
}
