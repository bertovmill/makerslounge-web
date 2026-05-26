"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Constants ───────────────────────────────────────────────────────────────

const PASSWORD = "makers2026";
const SESSION_KEY = "hackathon-judge-2026";

const JUDGES = ["James Maeng", "Naina Dewan", "Rishi Midha", "Dave Jani", "Ashish Dsa"];

const TRACK_CRITERIA: Record<string, { key: string; weight: number }[]> = {
  "Validating a Business Idea": [
    { key: "pipeline_coverage", weight: 0.25 },
    { key: "scoring_logic", weight: 0.35 },
    { key: "speed_scalability", weight: 0.25 },
    { key: "demo_clarity", weight: 0.15 },
  ],
  "Continuous Market Monitoring": [
    { key: "signal_relevance", weight: 0.35 },
    { key: "realtime_capability", weight: 0.25 },
    { key: "actionability", weight: 0.25 },
    { key: "demo_clarity", weight: 0.15 },
  ],
  "Synthetic Customers": [
    { key: "feedback_fidelity", weight: 0.35 },
    { key: "nonobvious_insights", weight: 0.25 },
    { key: "time_cost_savings", weight: 0.25 },
    { key: "demo_clarity", weight: 0.15 },
  ],
};

const TRACK_STYLE: Record<string, { badge: string; dot: string; winner: string; row: string }> = {
  "Validating a Business Idea": {
    badge: "bg-amber-400/15 text-amber-600 border border-amber-400/30 dark:text-amber-300",
    dot: "bg-amber-400",
    winner: "bg-amber-400/10 border-amber-400/30",
    row: "bg-amber-400/5",
  },
  "Continuous Market Monitoring": {
    badge: "bg-sky-400/15 text-sky-600 border border-sky-400/30 dark:text-sky-300",
    dot: "bg-sky-400",
    winner: "bg-sky-400/10 border-sky-400/30",
    row: "bg-sky-400/5",
  },
  "Synthetic Customers": {
    badge: "bg-violet-400/15 text-violet-600 border border-violet-400/30 dark:text-violet-300",
    dot: "bg-violet-400",
    winner: "bg-violet-400/10 border-violet-400/30",
    row: "bg-violet-400/5",
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Finalist {
  id: string;
  title: string | null;
  team_name: string | null;
  challenge_track: string | null;
}

interface ScoreRow {
  submission_id: string;
  judge_name: string;
  criterion_key: string;
  score: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function judgeWeightedScore(
  rows: ScoreRow[],
  submissionId: string,
  judgeName: string,
  criteria: { key: string; weight: number }[],
): number | null {
  const judgeRows = rows.filter(
    (r) => r.submission_id === submissionId && r.judge_name === judgeName,
  );
  if (judgeRows.length === 0) return null;
  let total = 0;
  for (const c of criteria) {
    const row = judgeRows.find((r) => r.criterion_key === c.key);
    if (!row) return null; // incomplete — don't show partial
    total += row.score * c.weight;
  }
  return Math.round(total * 20);
}

function averageScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
}

// ─── Password gate ────────────────────────────────────────────────────────────

function PasswordGate({ onSuccess }: { onSuccess: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (value === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onSuccess();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            2026 Innovation Hackathon
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Master results</h2>
          <p className="text-sm text-muted-foreground mt-1">MC / organizer access</p>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Password"
            className={`w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 ${
              error ? "border-red-500/60" : "border-border focus:border-foreground/40"
            }`}
          />
          {error && <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-red-400">Incorrect password</p>}
        </div>
        <button
          onClick={submit}
          className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
        >
          Enter
        </button>
        <Link
          href="/hackathons/2026-innovation-hackathon/scoring"
          className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to rubric
        </Link>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultsClient() {
  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(sessionStorage.getItem(SESSION_KEY)),
  );
  const [finalists, setFinalists] = useState<Finalist[]>([]);
  const [allScores, setAllScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!isAuthed) return;
    const load = async () => {
      const [{ data: finalistData }, { data: scoreData }] = await Promise.all([
        supabase
          .from("hackathon_submissions")
          .select("id, title, team_name, challenge_track")
          .eq("is_finalist", true)
          .order("challenge_track"),
        supabase
          .from("hackathon_scores")
          .select("submission_id, judge_name, criterion_key, score"),
      ]);
      setFinalists((finalistData ?? []) as Finalist[]);
      setAllScores((scoreData ?? []) as ScoreRow[]);
      setLastUpdated(new Date());
      setLoading(false);
    };
    load();
  }, [isAuthed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const [{ data: finalistData }, { data: scoreData }] = await Promise.all([
      supabase
        .from("hackathon_submissions")
        .select("id, title, team_name, challenge_track")
        .eq("is_finalist", true)
        .order("challenge_track"),
      supabase
        .from("hackathon_scores")
        .select("submission_id, judge_name, criterion_key, score"),
    ]);
    setFinalists((finalistData ?? []) as Finalist[]);
    setAllScores((scoreData ?? []) as ScoreRow[]);
    setLastUpdated(new Date());
    setRefreshing(false);
  };

  if (!isAuthed) return <PasswordGate onSuccess={() => setIsAuthed(true)} />;

  // Group by track
  const tracks = Object.keys(TRACK_CRITERIA);
  const byTrack: Record<string, Finalist[]> = {};
  for (const t of tracks) byTrack[t] = [];
  for (const f of finalists) {
    const t = f.challenge_track ?? "";
    if (byTrack[t]) byTrack[t].push(f);
    else byTrack[t] = [f];
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-5 border-b border-border/60 bg-background/90 backdrop-blur-lg">
        <Link
          href="/hackathons/2026-innovation-hackathon/scoring"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Rubric</span>
        </Link>

        <span className="font-mono text-xs uppercase tracking-[0.18em]">Master Results</span>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </header>

      {/* Body */}
      <div className="px-4 py-8 max-w-6xl mx-auto flex flex-col gap-12">

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Loading results…</p>
          </div>
        ) : finalists.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">No finalists selected yet</p>
          </div>
        ) : (
          <>
            {/* Last updated */}
            {lastUpdated && (
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground -mb-6">
                Last updated {lastUpdated.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
              </p>
            )}

            {tracks.map((track) => {
              const criteria = TRACK_CRITERIA[track];
              const trackFinalists = byTrack[track] ?? [];
              if (trackFinalists.length === 0) return null;

              const style = TRACK_STYLE[track] ?? TRACK_STYLE["Validating a Business Idea"];

              // Compute scores for each finalist × judge
              const rows = trackFinalists.map((f) => {
                const judgeScores = JUDGES.map((j) => judgeWeightedScore(allScores, f.id, j, criteria));
                const avg = averageScore(judgeScores);
                return { finalist: f, judgeScores, avg };
              });

              // Sort by avg descending (nulls last)
              rows.sort((a, b) => (b.avg ?? -1) - (a.avg ?? -1));

              return (
                <section key={track}>
                  {/* Track heading */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[0.6rem] uppercase tracking-widest ${style.badge}`}>
                      <span className={`size-1.5 rounded-full ${style.dot}`} />
                      {track}
                    </span>
                  </div>

                  {/* Scores table */}
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground min-w-[160px]">
                            Project
                          </th>
                          {JUDGES.map((j) => (
                            <th key={j} className="text-center px-3 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground whitespace-nowrap min-w-[80px]">
                              {j.split(" ")[0]}
                            </th>
                          ))}
                          <th className="text-center px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground min-w-[80px]">
                            Avg
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(({ finalist, judgeScores, avg }, i) => {
                          const isWinner = i === 0 && avg !== null;
                          return (
                            <tr
                              key={finalist.id}
                              className={`border-b border-border/50 last:border-0 ${isWinner ? style.row : ""}`}
                            >
                              {/* Project name */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isWinner && <Trophy className="size-3.5 shrink-0 text-amber-400" />}
                                  <div className="min-w-0">
                                    <p className={`font-medium truncate ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                                      {finalist.title ?? "Untitled"}
                                    </p>
                                    {finalist.team_name && (
                                      <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground/60 truncate">
                                        {finalist.team_name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Per-judge scores */}
                              {judgeScores.map((score, ji) => (
                                <td key={JUDGES[ji]} className="text-center px-3 py-3">
                                  {score !== null ? (
                                    <span className={`font-mono text-sm tabular-nums font-medium ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                                      {score}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-sm text-muted-foreground/30">—</span>
                                  )}
                                </td>
                              ))}

                              {/* Average */}
                              <td className="text-center px-4 py-3">
                                {avg !== null ? (
                                  <span className={`font-mono text-sm font-semibold tabular-nums ${isWinner ? "text-foreground" : "text-muted-foreground"}`}>
                                    {avg}
                                  </span>
                                ) : (
                                  <span className="font-mono text-sm text-muted-foreground/30">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Winner callout */}
                  {rows[0]?.avg !== null && (
                    <div className={`mt-3 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border ${style.winner}`}>
                      <Trophy className="size-3.5 text-amber-400 shrink-0" />
                      <p className="text-sm">
                        <span className="font-semibold">{rows[0].finalist.title ?? "Untitled"}</span>
                        <span className="text-muted-foreground ml-2">wins this track with an average of {rows[0].avg}/100</span>
                      </p>
                    </div>
                  )}
                </section>
              );
            })}

            {/* Judge completion status */}
            <section>
              <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Scoring progress
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {JUDGES.map((judge) => {
                  const judgeRows = allScores.filter((r) => r.judge_name === judge);
                  const scoredSubmissions = new Set(judgeRows.map((r) => r.submission_id)).size;
                  const total = finalists.length;
                  const pct = total > 0 ? Math.round((scoredSubmissions / total) * 100) : 0;
                  const done = scoredSubmissions === total && total > 0;

                  return (
                    <div key={judge} className={`rounded-xl border p-4 flex flex-col gap-2 ${done ? "border-green-400/30 bg-green-400/5" : "border-border bg-card/40"}`}>
                      <p className="text-sm font-medium leading-snug">{judge}</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`font-mono text-2xl font-medium tabular-nums ${done ? "text-green-400" : "text-foreground"}`}>
                          {scoredSubmissions}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">/{total}</span>
                      </div>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${done ? "bg-green-400" : "bg-foreground/40"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
