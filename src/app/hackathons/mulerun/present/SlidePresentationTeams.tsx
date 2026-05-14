"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Users, X } from "lucide-react";
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

export default function SlidePresentationTeams() {
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

  const deleteSignup = useCallback(
    async (s: Signup) => {
      if (!window.confirm(`Remove ${s.name} from the signup list?`)) return;
      setDeletingId(s.id);
      setError(null);
      try {
        const res = await fetch(`/api/mulerun/signups?id=${s.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "Failed to delete");
        }
        setSignups((prev) => prev.filter((x) => x.id !== s.id));
        setMatched(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete");
      } finally {
        setDeletingId(null);
      }
    },
    []
  );

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

  useEffect(() => {
    loadSignups();
    const id = setInterval(() => {
      if (!matched) loadSignups();
    }, 5000);
    return () => clearInterval(id);
  }, [loadSignups, matched]);

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-[clamp(1rem,3vh,2rem)]">
      {/* Eyebrow */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">06</span>
          <span className="h-px w-8 bg-border" />
          <span>Teams</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Auto-refresh 5s
          </span>
          <button
            onClick={loadSignups}
            disabled={loadingSignups}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground transition-opacity disabled:opacity-50"
          >
            <RefreshCw
              className={"size-3 " + (loadingSignups ? "animate-spin" : "")}
              strokeWidth={2}
            />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid min-h-0 grid-rows-[auto_auto_1fr] gap-[clamp(1rem,2.5vh,1.75rem)]">
        {/* Title + match action */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-serif text-[clamp(2.25rem,6vw,5.5rem)] leading-[0.95] tracking-tight">
              {matched ? "Your teams." : "Signups rolling in."}
            </h2>
            <p className="max-w-[50ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
              {matched
                ? "Find your team. Grab a spot. Start building."
                : "Once everyone's in, hit match to form teams by overlapping interests."}
            </p>
          </div>
          <button
            onClick={matchTeams}
            disabled={matching || signups.length < 2}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-3 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
          >
            <Sparkles className="size-4" strokeWidth={2} />
            {matching
              ? "Matching…"
              : matched
                ? "Re-match"
                : signups.length < 2
                  ? `Need ${2 - signups.length} more`
                  : `Match ${signups.length}`}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Body: signups roster until matched; teams grid once matched */}
        {!matched ? (
          <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card/30 p-[clamp(0.75rem,2vh,1.5rem)]">
            <div className="mb-3 flex items-center gap-3">
              <Users className="size-4 text-foreground" strokeWidth={1.8} />
              <h3 className="font-serif text-xl tracking-tight sm:text-2xl">
                Signups
              </h3>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {signups.length}
              </span>
            </div>
            {signups.length === 0 ? (
              <p className="my-auto py-6 text-center font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Waiting for signups…
              </p>
            ) : (
              <ul className="grid min-h-0 flex-1 grid-cols-1 gap-x-6 gap-y-1.5 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {signups.map((s) => (
                  <li
                    key={s.id}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 border-b border-border py-2 last:border-b-0"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-serif text-lg leading-tight tracking-tight">
                        {s.name}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {categoriesLabel(s.categories)}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSignup(s)}
                      disabled={deletingId === s.id}
                      aria-label={`Remove ${s.name}`}
                      className="inline-flex size-7 flex-shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section className="min-h-0 overflow-y-auto">
            <ul className="grid gap-[clamp(0.75rem,1.5vh,1.25rem)] sm:grid-cols-2 lg:grid-cols-3">
              {matched.teams.map((team, i) => (
                <li
                  key={i}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-[clamp(0.75rem,1.5vw,1.25rem)]"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
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
                        className="flex flex-col gap-0.5 border-t border-border pt-2 first:border-t-0 first:pt-0"
                      >
                        <span className="font-serif text-[clamp(1.1rem,1.6vw,1.5rem)] leading-tight tracking-tight">
                          {m.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {categoriesLabel(m.categories)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-start gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
                    <Sparkles className="mt-0.5 size-3 flex-shrink-0 text-foreground" />
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
