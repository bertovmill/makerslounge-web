"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Demo = {
  id: string;
  team_name: string | null;
  name: string;
  project: string;
};

type Status =
  | { kind: "checking" }
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "locked" }
  | { kind: "error"; message: string };

const VOTER_KEY = "mulerun_voter_id";

function getVoterId() {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(VOTER_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36);
    window.localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

export default function VoteForm() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [picks, setPicks] = useState<string[]>([]); // ordered: [first, second, third]
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "checking" });

  const load = useCallback(async () => {
    try {
      const [demosRes, meRes] = await Promise.all([
        fetch("/api/mulerun/demos", { cache: "no-store" }),
        fetch(
          `/api/mulerun/votes/me?voter_id=${encodeURIComponent(getVoterId())}`,
          { cache: "no-store" }
        ),
      ]);
      if (demosRes.ok) {
        const body = await demosRes.json();
        if (Array.isArray(body.demos)) setDemos(body.demos);
      }
      if (meRes.ok) {
        const body = await meRes.json();
        setStatus(body?.voted ? { kind: "locked" } : { kind: "idle" });
      } else {
        // Be conservative: if the check fails, let them try. The server-side
        // unique constraint is the real lock anyway.
        setStatus({ kind: "idle" });
      }
    } catch {
      setStatus({ kind: "idle" });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (id: string) => {
    setPicks((prev) => {
      const i = prev.indexOf(id);
      if (i >= 0) return prev.filter((p) => p !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const reset = () => setPicks([]);

  const canSubmit = picks.length === 3 && status.kind !== "submitting";

  const rankFor = (id: string) => {
    const i = picks.indexOf(id);
    return i >= 0 ? i + 1 : 0;
  };

  const submit = async () => {
    if (!canSubmit) return;
    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/mulerun/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voter_id: getVoterId(),
          first_id: picks[0],
          second_id: picks[1],
          third_id: picks[2],
        }),
      });
      if (res.status === 409) {
        // Already voted from this browser — lock the UI.
        setStatus({ kind: "locked" });
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus({
          kind: "error",
          message: body?.error ?? "Couldn't save your vote. Try again.",
        });
        return;
      }
      setStatus({ kind: "locked" });
    } catch {
      setStatus({
        kind: "error",
        message: "Network error. Check your connection and try again.",
      });
    }
  };

  const sortedDemos = useMemo(() => demos, [demos]);

  if (status.kind === "locked") {
    return (
      <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md flex-col gap-6 pt-16">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Locked in</span>
            <span className="h-px w-8 bg-border" />
            <span>Mulerun vote</span>
          </div>
          <h1 className="font-serif text-5xl leading-[0.95] tracking-tight">
            Vote in.
          </h1>
          <p className="text-base text-muted-foreground">
            Your top 3 are counted. One vote per browser — sit back and watch
            the reveal.
          </p>
        </div>
      </div>
    );
  }

  if (status.kind === "checking") {
    return (
      <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-md flex-col gap-6 pt-16">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Checking your vote status…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(7rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md flex-col gap-6 pt-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Vote</span>
            <span className="h-px w-8 bg-border" />
            <span>Mulerun top 3</span>
          </div>
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">
            Pick your top 3.
          </h1>
          <p className="text-sm text-muted-foreground">
            Tap teams in the order you liked them. 1st = 3 pts, 2nd = 2 pts,
            3rd = 1 pt.
          </p>
        </div>

        {/* Picks summary */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((slot) => {
            const id = picks[slot - 1];
            const demo = id ? demos.find((d) => d.id === id) : null;
            const label = ["1st", "2nd", "3rd"][slot - 1];
            return (
              <div
                key={slot}
                className="flex min-h-[4rem] flex-col gap-1 rounded-lg border border-border bg-card/40 p-2"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {label}
                </span>
                <span className="line-clamp-2 font-serif text-sm leading-tight tracking-tight">
                  {demo ? demo.team_name?.trim() || demo.name : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {!loaded ? (
          <p className="text-sm text-muted-foreground">Loading teams…</p>
        ) : sortedDemos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No demos in the lineup yet. Check back in a minute.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sortedDemos.map((d) => {
              const rank = rankFor(d.id);
              const picked = rank > 0;
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => toggle(d.id)}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                      picked
                        ? "border-foreground bg-foreground/[0.04]"
                        : "border-border bg-card/30 hover:border-foreground/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs ${
                        picked
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {picked ? rank : ""}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-serif text-lg leading-tight tracking-tight">
                        {d.team_name?.trim() || d.name}
                      </span>
                      {d.team_name?.trim() && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {d.name}
                        </span>
                      )}
                      <span className="line-clamp-2 text-sm text-muted-foreground">
                        {d.project}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {status.kind === "error" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {status.message}
          </div>
        )}
      </div>

      {/* Sticky submit bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <button
            type="button"
            onClick={reset}
            disabled={picks.length === 0}
            className="rounded-full border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-opacity hover:text-foreground disabled:opacity-30"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-foreground px-6 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
          >
            {status.kind === "submitting"
              ? "Locking in…"
              : picks.length < 3
                ? `Pick ${3 - picks.length} more`
                : "Submit my top 3"}
          </button>
        </div>
      </div>
    </div>
  );
}
