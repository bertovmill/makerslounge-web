"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Users, X } from "lucide-react";
import { CATEGORIES } from "../categories";
import { buildTeams } from "../teamBuilder";

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

const SAMPLE_FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Taylor", "Casey", "Riley", "Morgan", "Avery",
  "Quinn", "Drew", "Reese", "Skylar", "Hayden", "Parker", "Rowan", "Emerson",
  "Finley", "Sage", "Blake", "Cameron", "Dakota", "Elliot", "Frankie", "Hunter",
  "Iris", "Jess", "Kai", "Logan", "Maya", "Noor", "Owen", "Priya",
  "Quincy", "Ravi", "Sasha", "Theo", "Uma", "Vince", "Wren", "Xavi",
];

const SAMPLE_LAST_NAMES = [
  "Chen", "Patel", "Kim", "Nguyen", "Garcia", "Singh", "Lopez", "Khan",
  "Park", "Rossi", "Müller", "Silva", "Hassan", "Cohen", "Reyes", "Lin",
  "Cruz", "Wong", "Sato", "Oduya", "Becker", "Petrov", "Fernandez", "Walsh",
  "Hayes", "Roy", "Ali", "Mendez", "Brooks", "Tan", "Iyer", "Bauer",
  "Romero", "Eriksson", "Diaz", "Schultz", "Yamamoto", "Levy", "Mensah", "Carr",
];

function makeSampleSignups(n: number): Signup[] {
  const out: Signup[] = [];
  const used = new Set<string>();
  for (let i = 0; i < n; i++) {
    const first = SAMPLE_FIRST_NAMES[i % SAMPLE_FIRST_NAMES.length];
    const last = SAMPLE_LAST_NAMES[(i * 7 + 3) % SAMPLE_LAST_NAMES.length];
    let name = `${first} ${last}`;
    let suffix = 1;
    while (used.has(name)) {
      suffix++;
      name = `${first} ${last} ${suffix}`;
    }
    used.add(name);

    // 1–3 categories, biased toward 2.
    const r = Math.random();
    const k = r < 0.25 ? 1 : r < 0.85 ? 2 : 3;
    const shuffled = [...CATEGORIES].sort(() => Math.random() - 0.5);
    const cats = shuffled.slice(0, k).map((c) => c.slug);

    out.push({
      id: `sample-${i}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      categories: cats,
    });
  }
  return out;
}

const TEAMS_STORAGE_KEY = "mulerun:matched-teams:v1";

const TEAM_CODES = [
  "VYRQ2-R8DAQ-PCJRT",
  "4TCRH-4UAXF-YE7JE",
  "UUXAQ-2S526-U5KXJ",
  "692EK-QWK5V-KZHB2",
  "SMYMD-HBYX6-63HXM",
  "27DE4-QFV7Y-SAGX7",
  "AU49H-JV34Y-LCFSK",
  "YSHAA-Z6GM3-LRBZ3",
  "Z67VA-C32XY-BTW9V",
  "DRMB8-2GAJZ-YE82A",
  "XB784-8MG5A-4YG4Y",
  "DL25D-3HU68-25PLQ",
  "8RSL8-M2P3S-UPGRN",
  "JBLRA-J2B2G-3P2QZ",
  "42TUC-7GX8X-W7FHR",
  "HBG42-GQWXD-W7F43",
  "4T6AP-TMDAG-3FB6Z",
  "PT4NU-4ZPZK-ZTTZ2",
  "VTPR3-QD87D-83NV9",
];

const NAME_OF = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
) as Record<string, string>;

function categoriesLabel(slugs: string[]): string {
  return slugs.map((s) => NAME_OF[s] ?? s).join(" · ");
}

export default function SlidePresentationTeams() {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [matched, setMatched] = useState<MatchResponse | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(TEAMS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as MatchResponse;
      return parsed && Array.isArray(parsed.teams) ? parsed : null;
    } catch {
      return null;
    }
  });
  const [loadingSignups, setLoadingSignups] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [sampleMode, setSampleMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (matched) {
        window.localStorage.setItem(TEAMS_STORAGE_KEY, JSON.stringify(matched));
      } else {
        window.localStorage.removeItem(TEAMS_STORAGE_KEY);
      }
    } catch {
      // Ignore quota / disabled storage — persistence is best-effort.
    }
  }, [matched]);

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
      if (sampleMode) {
        setSignups((prev) => prev.filter((x) => x.id !== s.id));
        setMatched(null);
        return;
      }
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
    [sampleMode]
  );

  const matchTeams = useCallback(async () => {
    setMatching(true);
    setError(null);
    try {
      if (sampleMode) {
        const teams = buildTeams(signups);
        setMatched({ total: signups.length, teams });
        return;
      }
      const res = await fetch("/api/mulerun/match", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed to match");
      setMatched(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to match");
    } finally {
      setMatching(false);
    }
  }, [sampleMode, signups]);

  const toggleSampleMode = useCallback(() => {
    setSampleMode((prev) => {
      const next = !prev;
      if (next) {
        setSignups(makeSampleSignups(40));
      } else {
        setSignups([]);
      }
      setMatched(null);
      setError(null);
      return next;
    });
  }, []);

  useEffect(() => {
    if (sampleMode) return;
    loadSignups();
    const id = setInterval(() => {
      if (!matched) loadSignups();
    }, 5000);
    return () => clearInterval(id);
  }, [loadSignups, matched, sampleMode]);

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
          <button
            onClick={toggleSampleMode}
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            {sampleMode ? "Clear sample" : "Sample data"}
          </button>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {sampleMode ? "Sample · paused" : "Auto-refresh 5s"}
          </span>
          <button
            onClick={loadSignups}
            disabled={loadingSignups || sampleMode}
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
                  {TEAM_CODES[i] && (
                    <div className="flex flex-col gap-1 rounded-md border border-dashed border-border bg-background/50 px-3 py-2">
                      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                        Team code
                      </span>
                      <span className="select-all font-mono text-sm tracking-[0.08em] text-foreground">
                        {TEAM_CODES[i]}
                      </span>
                    </div>
                  )}
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
