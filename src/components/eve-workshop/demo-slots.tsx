"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hourglass, Mic, Pencil, Plus, Trash2, X } from "lucide-react";

type Slot = {
  slot: number;
  name: string;
  mine: boolean;
};

const SLOT_COUNT = 8;
// 9 and 10 only go on if the night is running ahead of schedule.
const STANDBY_SLOTS = [9, 10];
const POLL_MS = 8000;

export function DemoSlots() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/eve-workshop/demo-slots");
      if (!res.ok) return;
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      // Offline or mid-deploy — keep whatever is already on screen.
    }
  }, []);

  // This slide lives partway down a long deck, so most of the night it's
  // scrolled off screen with nobody looking at it. Only poll when it's actually
  // in view — polling the whole time is one invocation per attendee per tick
  // for a list nobody can see.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // The slide is on a public page — only fetch once Clerk says we're signed in,
  // otherwise every poll is a guaranteed 401.
  useEffect(() => {
    if (!isSignedIn || !onScreen) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    const stop = () => {
      clearInterval(interval);
      interval = undefined;
    };

    const start = () => {
      if (interval) return;
      load();
      interval = setInterval(load, POLL_MS);
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load, isSignedIn, onScreen]);

  function openClaim(slot: number) {
    if (!isSignedIn) {
      router.push("/eve-workshop/sign-in?redirect_url=/eve-workshop%23demo-time");
      return;
    }
    setError(null);
    setDraft(user?.firstName ?? user?.fullName ?? "");
    setClaiming(slot);
  }

  // Editing is the same upsert as claiming — the API only lets the owner
  // rewrite a taken slot — so it just seeds the form with the current name.
  function openEdit(slot: number, name: string) {
    setError(null);
    setDraft(name);
    setClaiming(slot);
  }

  async function claim(slot: number) {
    const name = draft.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/eve-workshop/demo-slots", {
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
      await fetch("/api/eve-workshop/demo-slots", {
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
  const remaining = SLOT_COUNT - slots.filter((s) => s.slot <= SLOT_COUNT).length;

  function renderSlot(n: number, standby = false) {
    const taken = byNumber.get(n);
    const isClaiming = claiming === n;

    return (
      <li
        key={n}
        className={`flex min-h-[68px] items-center gap-3.5 rounded-xl border px-4 py-3 transition ${
          taken?.mine
            ? "border-brand/40 bg-brand/5"
            : taken
              ? "border-[#e3ecf5] bg-white"
              : standby
                ? "border-dashed border-[#dfe7ef] bg-white/60"
                : "border-dashed border-[#cddcec] bg-[#fbfdff]"
        }`}
      >
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
            taken ? "bg-brand text-white" : standby ? "bg-[#eef2f6] text-ink-muted" : "bg-[#e8f1fb] text-brand-dark"
          }`}
        >
          {n}
        </span>

        {isClaiming ? (
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
              className="min-w-0 flex-1 rounded-lg border border-[#cddcec] bg-white px-3 py-2 text-base text-ink outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              className="shrink-0 cursor-pointer rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {busy ? "…" : taken ? "Save" : "I'm in"}
            </button>
            <button
              type="button"
              onClick={() => setClaiming(null)}
              aria-label="Cancel"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:bg-[#f1f6fb] hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </form>
        ) : taken ? (
          <>
            <span className="min-w-0 flex-1 truncate text-base font-semibold text-ink md:text-lg">
              {taken.name}
              {taken.mine && (
                <span className="ml-1.5 text-sm font-normal text-ink-muted">(you)</span>
              )}
            </span>
            {taken.mine && (
              <span className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => openEdit(n, taken.name)}
                  disabled={busy}
                  aria-label="Edit the name in your demo slot"
                  title="Edit"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:bg-[#f1f6fb] hover:text-brand-dark disabled:opacity-50"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => release(n)}
                  disabled={busy}
                  aria-label="Delete your demo slot"
                  title="Delete"
                  className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-ink-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                </button>
              </span>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => openClaim(n)}
            disabled={!!takenByMe}
            className="flex flex-1 cursor-pointer items-center gap-2 text-left text-base text-ink-muted transition hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="size-4" />
            {takenByMe ? "Open" : standby ? "Add your name (standby)" : "Add your name"}
          </button>
        )}
      </li>
    );
  }

  return (
    <div ref={rootRef}>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((n) => renderSlot(n))}
      </ul>

      <div className="mt-3 rounded-xl border border-[#e3ecf5] bg-white/50 px-3 py-3">
        <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold tracking-[0.08em] text-ink-muted uppercase">
          <Hourglass className="size-4" />
          Stand by — if we have time
        </p>
        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {STANDBY_SLOTS.map((n) => renderSlot(n, true))}
        </ul>
      </div>

      <p className="mt-4 flex items-center justify-center gap-2 text-center text-base text-ink-muted md:text-lg">
        <Mic className="size-5 shrink-0 text-brand" />
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : isLoaded && !isSignedIn ? (
          <span>
            <Link href="/eve-workshop/sign-in?redirect_url=/eve-workshop%23demo-time" className="text-brand-dark underline">
              Sign in
            </Link>{" "}
            to claim a slot — one per person, first come first serve.
          </span>
        ) : takenByMe ? (
          <span>
            You&apos;re up in slot <strong className="text-ink">{takenByMe.slot}</strong>
            {takenByMe.slot > SLOT_COUNT ? " (standby)" : ""} — edit or free it up any time with the
            icons on your row.
          </span>
        ) : remaining > 0 ? (
          <span>
            <strong className="text-ink">{remaining}</strong> of {SLOT_COUNT} slots left · one per
            person, first come first serve
          </span>
        ) : (
          <span>All 8 slots are full — put your name on standby, or grab one if someone drops.</span>
        )}
      </p>
    </div>
  );
}
