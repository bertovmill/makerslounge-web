"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Trash2, Users, X } from "lucide-react";
import { CATEGORIES } from "../categories";

type Signup = {
  id: string;
  name: string;
  categories: string[];
  created_at?: string;
};

type Team = {
  members: Signup[];
  sharedCategories: string[];
  unionCategories: string[];
  why: string;
};

type MatchResponse = {
  total: number;
  teams: Team[];
  message?: string;
};

const NAME_OF = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
) as Record<string, string>;

function categoriesLabel(slugs: string[]): string {
  return slugs.map((s) => NAME_OF[s] ?? s).join(" · ");
}

export default function MatchView() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [matched, setMatched] = useState<MatchResponse | null>(null);
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadSignups = useCallback(async () => {
    setLoadingSignups(true);
    setError(null);
    try {
      const res = await fetch("/api/mulerun/signups", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to load signups");
      setSignups(body.signups ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load signups");
    } finally {
      setLoadingSignups(false);
    }
  }, []);

  const matchTeams = useCallback(async () => {
    setMatching(true);
    setError(null);
    try {
      const res = await fetch("/api/mulerun/match", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to match");
      setMatched(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to match");
    } finally {
      setMatching(false);
    }
  }, []);

  const deleteOne = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const res = await fetch(`/api/mulerun/signups?id=${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "Failed to delete");
        }
        await loadSignups();
        // Invalidate the match since the roster changed
        setMatched(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      } finally {
        setDeletingId(null);
      }
    },
    [loadSignups]
  );

  const clearAll = useCallback(async () => {
    if (
      !window.confirm(
        `Clear all ${signups.length} signups? This can't be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await fetch("/api/mulerun/signups?all=1", {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to clear");
      }
      await loadSignups();
      setMatched(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear");
    }
  }, [loadSignups, signups.length]);

  // Initial load + poll every 5s so the presenter sees signups roll in live.
  useEffect(() => {
    loadSignups();
    const id = setInterval(loadSignups, 5000);
    return () => clearInterval(id);
  }, [loadSignups]);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(1.5rem,4vh,3rem)] pb-[clamp(3rem,8vh,5rem)]">
        {/* Header */}
        <div className="mb-[clamp(1.5rem,4vh,2.5rem)] flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="text-foreground">Live</span>
              <span className="h-px w-8 bg-border" />
              <span>Mulerun matching</span>
            </div>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
              Team matching.
            </h1>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Auto-refresh 5s
            </span>
            <button
              onClick={loadSignups}
              disabled={loadingSignups}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-opacity disabled:opacity-50"
            >
              <RefreshCw
                className={"size-3.5 " + (loadingSignups ? "animate-spin" : "")}
                strokeWidth={2}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Signups list */}
        <section className="mb-6 rounded-lg border border-border bg-card/30 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <Users className="size-4 text-foreground" strokeWidth={1.8} />
              <h2 className="font-serif text-xl tracking-tight sm:text-2xl">
                Signups
              </h2>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {signups.length}
              </span>
            </div>
            {signups.length > 0 && (
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
              >
                <Trash2 className="size-3" strokeWidth={2} />
                Clear all
              </button>
            )}
          </div>

          {signups.length === 0 ? (
            <p className="py-6 text-center font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Waiting for signups…
            </p>
          ) : (
            <ul className="flex flex-col">
              {signups.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-3 border-t border-border py-2.5 first:border-t-0 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-serif text-lg leading-tight tracking-tight">
                      {s.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {categoriesLabel(s.categories)}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteOne(s.id)}
                    disabled={deletingId === s.id}
                    aria-label={`Remove ${s.name}`}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                  >
                    <X className="size-4" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Match action */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {matched
              ? "Matched. Hit re-match to recompute after late signups."
              : signups.length < 2
                ? "Need at least 2 signups before matching."
                : "Ready when you are."}
          </p>
          <button
            onClick={matchTeams}
            disabled={matching || signups.length < 2}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
          >
            <Sparkles className="size-4" strokeWidth={2} />
            {matching
              ? "Matching…"
              : matched
                ? "Re-match teams"
                : "Match teams"}
          </button>
        </div>

        {/* Teams */}
        {matched && matched.teams.length > 0 && (
          <section>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="font-serif text-xl tracking-tight sm:text-2xl">
                Teams
              </h2>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {matched.teams.length}
              </span>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {matched.teams.map((team, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-4 rounded-lg border border-border bg-card/40 p-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Team {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      {team.members.length}{" "}
                      {team.members.length === 1 ? "person" : "people"}
                    </span>
                  </div>
                  <ul className="flex flex-col">
                    {team.members.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-col gap-1 border-t border-border pt-2 first:border-t-0 first:pt-0"
                      >
                        <span className="font-serif text-2xl leading-tight tracking-tight">
                          {m.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {categoriesLabel(m.categories)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-start gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                    <Sparkles className="mt-0.5 size-3.5 flex-shrink-0 text-foreground" />
                    <p>{team.why}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
