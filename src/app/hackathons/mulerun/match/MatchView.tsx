"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Users } from "lucide-react";
import { CATEGORIES } from "../categories";

type Member = { id: string; name: string; categories: string[] };
type Team = {
  members: Member[];
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

export default function MatchView() {
  const [data, setData] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mulerun/match", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to load matches");
      }
      const body = (await res.json()) as MatchResponse;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(2rem,5vh,4rem)] pb-[clamp(3rem,8vh,5rem)]">
        <div className="mb-[clamp(1.5rem,4vh,3rem)] flex flex-wrap items-baseline justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="text-foreground">Live</span>
              <span className="h-px w-8 bg-border" />
              <span>Mulerun teams</span>
            </div>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
              Your teams.
            </h1>
            {data && (
              <p className="text-sm text-muted-foreground">
                {data.total} signup{data.total === 1 ? "" : "s"} ·{" "}
                {data.teams.length} team{data.teams.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-opacity disabled:opacity-50"
          >
            <RefreshCw
              className={"size-3.5 " + (loading ? "animate-spin" : "")}
              strokeWidth={2}
            />
            Re-match
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {data && data.teams.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/30 p-8 text-center">
            <Users className="mx-auto mb-3 size-6 text-muted-foreground" />
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {data.message ?? "Waiting for signups…"}
            </p>
          </div>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {data?.teams.map((team, i) => (
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
              <ul className="flex flex-col gap-2">
                {team.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-1 border-t border-border pt-2 first:border-t-0 first:pt-0"
                  >
                    <span className="font-serif text-2xl leading-tight tracking-tight">
                      {m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.categories.map((c) => NAME_OF[c] ?? c).join(" · ")}
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
      </div>
    </div>
  );
}
