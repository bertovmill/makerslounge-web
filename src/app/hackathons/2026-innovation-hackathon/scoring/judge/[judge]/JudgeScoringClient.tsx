"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Trophy, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Constants ──────────────────────────────────────────────────────────────

const PASSWORD = "makers2026";
const SESSION_KEY = "hackathon-judge-2026";

export const JUDGE_SLUGS: Record<string, string> = {
  "james-maeng": "James Maeng",
  "naina-dewan": "Naina Dewan",
  "rishi-midha": "Rishi Midha",
  "dave-jani": "Dave Jani",
  "ashish-dsa": "Ashish D'Sa",
};

const TRACK_CRITERIA: Record<string, { key: string; label: string; weight: number }[]> = {
  "Validating a Business Idea": [
    { key: "pipeline_coverage", label: "End-to-end pipeline coverage", weight: 0.25 },
    { key: "scoring_logic", label: "Quality of scoring / triage logic", weight: 0.35 },
    { key: "speed_scalability", label: "Speed & scalability over manual review", weight: 0.25 },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15 },
  ],
  "Continuous Market Monitoring": [
    { key: "signal_relevance", label: "Signal relevance & accuracy", weight: 0.35 },
    { key: "realtime_capability", label: "Real-time or near-real-time capability", weight: 0.25 },
    { key: "actionability", label: "Actionability of insights surfaced", weight: 0.25 },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15 },
  ],
  "Synthetic Customers": [
    { key: "feedback_fidelity", label: "Fidelity of synthetic feedback", weight: 0.35 },
    { key: "nonobvious_insights", label: "Non-obvious insight generation", weight: 0.25 },
    { key: "time_cost_savings", label: "Time & cost savings vs. real research", weight: 0.25 },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15 },
  ],
};

const TRACK_STYLE: Record<string, { badge: string; score: string; btn: string; dot: string; trackLabel: string }> = {
  "Validating a Business Idea": {
    badge: "bg-amber-400/15 text-amber-500 border border-amber-400/30",
    score: "text-amber-500",
    btn: "bg-amber-400 text-black",
    dot: "bg-amber-400",
    trackLabel: "text-amber-500",
  },
  "Continuous Market Monitoring": {
    badge: "bg-sky-400/15 text-sky-500 border border-sky-400/30",
    score: "text-sky-500",
    btn: "bg-sky-400 text-black",
    dot: "bg-sky-400",
    trackLabel: "text-sky-500",
  },
  "Synthetic Customers": {
    badge: "bg-violet-400/15 text-violet-500 border border-violet-400/30",
    score: "text-violet-500",
    btn: "bg-violet-400 text-black",
    dot: "bg-violet-400",
    trackLabel: "text-violet-500",
  },
};

const DEFAULT_STYLE = TRACK_STYLE["Validating a Business Idea"];

// ─── Types ──────────────────────────────────────────────────────────────────

interface Finalist {
  id: string;
  title: string | null;
  team_name: string | null;
  challenge_track: string | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function weightedScore(
  scores: Record<string, number>,
  criteria: { key: string; weight: number }[],
): number {
  return Math.round(criteria.reduce((s, c) => s + (scores[c.key] ?? 0) * c.weight, 0) * 20);
}

function completionStatus(
  scores: Record<string, number>,
  criteria: { key: string; weight: number }[],
): "full" | "partial" | "none" {
  const count = criteria.filter((c) => scores[c.key] != null).length;
  if (count === criteria.length) return "full";
  if (count > 0) return "partial";
  return "none";
}

// ─── Password gate ───────────────────────────────────────────────────────────

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
          <h2 className="text-xl font-semibold tracking-tight">Judge access</h2>
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
          href="/hackathons/2026-innovation-hackathon/scoring/judge"
          className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to judge selection
        </Link>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function JudgeScoringClient() {
  const params = useParams();
  const router = useRouter();
  const judgeSlug = params.judge as string;
  const judgeName = JUDGE_SLUGS[judgeSlug];

  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(sessionStorage.getItem(SESSION_KEY)),
  );
  const [finalists, setFinalists] = useState<Finalist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myScores, setMyScores] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Invalid judge slug
  useEffect(() => {
    if (!judgeName) router.replace("/hackathons/2026-innovation-hackathon/scoring/judge");
  }, [judgeName, router]);

  // Fetch finalists + scores once authed
  useEffect(() => {
    if (!isAuthed || !judgeName) return;
    const load = async () => {
      setLoading(true);

      const { data: finalistData } = await supabase
        .from("hackathon_submissions")
        .select("id, title, team_name, challenge_track")
        .eq("is_finalist", true)
        .order("challenge_track");

      const fs = (finalistData ?? []) as Finalist[];
      setFinalists(fs);
      if (fs.length > 0) setSelectedId(fs[0].id);

      if (fs.length > 0) {
        const { data: scoreData } = await supabase
          .from("hackathon_scores")
          .select("submission_id, criterion_key, score")
          .eq("judge_name", judgeName)
          .in("submission_id", fs.map((f) => f.id));

        const parsed: Record<string, Record<string, number>> = {};
        for (const row of scoreData ?? []) {
          if (!parsed[row.submission_id]) parsed[row.submission_id] = {};
          parsed[row.submission_id][row.criterion_key] = row.score;
        }
        setMyScores(parsed);
      }

      setLoading(false);
    };
    load();
  }, [isAuthed, judgeName]);

  const handleScore = useCallback(
    async (submissionId: string, criterionKey: string, score: number) => {
      setMyScores((prev) => ({
        ...prev,
        [submissionId]: { ...(prev[submissionId] ?? {}), [criterionKey]: score },
      }));

      const k = `${submissionId}:${criterionKey}`;
      setSaving((p) => new Set(p).add(k));

      await supabase.from("hackathon_scores").upsert(
        { judge_name: judgeName, submission_id: submissionId, criterion_key: criterionKey, score },
        { onConflict: "judge_name,submission_id,criterion_key" },
      );

      setSaving((p) => { const s = new Set(p); s.delete(k); return s; });
      setSaved((p) => new Set(p).add(k));
      setTimeout(() => setSaved((p) => { const s = new Set(p); s.delete(k); return s; }), 1500);
    },
    [judgeName],
  );

  if (!judgeName) return null;
  if (!isAuthed) return <PasswordGate onSuccess={() => setIsAuthed(true)} />;

  const selectedIndex = finalists.findIndex((f) => f.id === selectedId);
  const selected = selectedIndex >= 0 ? finalists[selectedIndex] : null;

  const goTo = (index: number) => {
    if (index >= 0 && index < finalists.length) setSelectedId(finalists[index].id);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">

      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between h-14 px-5 border-b border-border/60 bg-background/80 backdrop-blur-lg z-20">
        <Link
          href="/hackathons/2026-innovation-hackathon/scoring"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Rubric</span>
        </Link>

        <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
          {judgeName}
        </span>

        <Link
          href="/hackathons/2026-innovation-hackathon/scoring/judge"
          className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <UserRound className="size-3.5" />
          <span className="hidden sm:inline">Switch</span>
        </Link>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-border/60 overflow-y-auto bg-card/20">
          <div className="px-4 py-3 border-b border-border/50 shrink-0">
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">
              {loading ? "Loading…" : `${finalists.length} finalist${finalists.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          <nav className="flex flex-col py-1">
            {finalists.map((f, i) => {
              const criteria = TRACK_CRITERIA[f.challenge_track ?? ""] ?? [];
              const status = completionStatus(myScores[f.id] ?? {}, criteria);
              const style = TRACK_STYLE[f.challenge_track ?? ""] ?? DEFAULT_STYLE;
              const isActive = f.id === selectedId;

              return (
                <button
                  key={f.id}
                  onClick={() => setSelectedId(f.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-2 ${
                    isActive
                      ? "bg-secondary/60 border-foreground"
                      : "border-transparent hover:bg-secondary/30"
                  }`}
                >
                  <span className="font-mono text-xs text-muted-foreground/60 w-4 shrink-0 tabular-nums">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate leading-snug ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {f.title ?? "Untitled"}
                    </p>
                    <p className={`font-mono text-[0.55rem] uppercase tracking-[0.12em] truncate mt-0.5 ${style.trackLabel}`}>
                      {f.challenge_track ?? "—"}
                    </p>
                  </div>
                  {/* Completion dot */}
                  <div className={`size-2 rounded-full shrink-0 ${
                    status === "full" ? "bg-green-400" : status === "partial" ? "bg-amber-400" : "bg-border"
                  }`} />
                </button>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="mt-auto border-t border-border/50 px-4 py-3 flex flex-col gap-2">
            <Link
              href="/hackathons/2026-innovation-hackathon/scoring/results"
              className="flex items-center gap-2 text-xs font-medium text-foreground hover:text-foreground/70 transition-colors"
            >
              <Trophy className="size-3.5 text-amber-400" />
              Master results
            </Link>
            <Link
              href="/hackathons/2026-innovation-hackathon/scoring"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              View rubric
            </Link>
          </div>
        </aside>

        {/* ── Main panel ── */}
        <main className="flex-1 overflow-y-auto">

          {/* Mobile tab bar */}
          <div className="md:hidden flex gap-2 overflow-x-auto px-4 py-3 border-b border-border/50 bg-card/20 shrink-0" style={{ scrollbarWidth: "none" }}>
            {loading ? (
              <span className="font-mono text-[0.6rem] uppercase tracking-widest text-muted-foreground animate-pulse py-1">Loading…</span>
            ) : (
              finalists.map((f, i) => {
                const criteria = TRACK_CRITERIA[f.challenge_track ?? ""] ?? [];
                const status = completionStatus(myScores[f.id] ?? {}, criteria);
                const isActive = f.id === selectedId;

                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedId(f.id)}
                    className={`relative shrink-0 size-9 rounded-full font-mono text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-foreground text-background"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {i + 1}
                    {/* completion indicator */}
                    {status !== "none" && (
                      <span className={`absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background ${
                        status === "full" ? "bg-green-400" : "bg-amber-400"
                      }`} />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Scoring content */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground animate-pulse">Loading…</p>
            </div>
          ) : finalists.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh] px-6 text-center">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">No finalists selected yet</p>
              <p className="text-sm text-muted-foreground max-w-[34ch]">Finalists are selected from the admin submissions page.</p>
            </div>
          ) : selected ? (
            <div className="px-4 py-6 max-w-2xl mx-auto md:px-8">
              <ScoringCard
                finalist={selected}
                criteria={TRACK_CRITERIA[selected.challenge_track ?? ""] ?? []}
                myScores={myScores[selected.id] ?? {}}
                saving={saving}
                saved={saved}
                style={TRACK_STYLE[selected.challenge_track ?? ""] ?? DEFAULT_STYLE}
                onScore={handleScore}
              />

              {/* Prev / Next */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <button
                  onClick={() => goTo(selectedIndex - 1)}
                  disabled={selectedIndex <= 0}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">
                    {selectedIndex > 0 ? (finalists[selectedIndex - 1].title ?? "Previous") : "Previous"}
                  </span>
                  <span className="sm:hidden">Prev</span>
                </button>

                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {selectedIndex + 1} / {finalists.length}
                </span>

                <button
                  onClick={() => goTo(selectedIndex + 1)}
                  disabled={selectedIndex >= finalists.length - 1}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span className="hidden sm:inline">
                    {selectedIndex < finalists.length - 1 ? (finalists[selectedIndex + 1].title ?? "Next") : "Next"}
                  </span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

// ─── Scoring card ────────────────────────────────────────────────────────────

function ScoringCard({
  finalist,
  criteria,
  myScores,
  saving,
  saved,
  style,
  onScore,
}: {
  finalist: Finalist;
  criteria: { key: string; label: string; weight: number }[];
  myScores: Record<string, number>;
  saving: Set<string>;
  saved: Set<string>;
  style: { badge: string; score: string; btn: string; dot: string };
  onScore: (id: string, key: string, score: number) => void;
}) {
  const total = weightedScore(myScores, criteria);
  const allScored = criteria.every((c) => myScores[c.key] != null);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Track badge */}
      {finalist.challenge_track && (
        <div className="px-6 pt-5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono text-[0.6rem] uppercase tracking-widest ${style.badge}`}>
            <span className={`size-1.5 rounded-full ${style.dot}`} />
            {finalist.challenge_track}
          </span>
        </div>
      )}

      {/* Title + score */}
      <div className="px-6 pt-3 pb-5 border-b border-border/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold leading-snug">{finalist.title ?? "Untitled"}</h2>
            {finalist.team_name && (
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground mt-1">
                {finalist.team_name}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className={`font-mono text-4xl font-medium leading-none tabular-nums ${allScored ? style.score : "text-muted-foreground/30"}`}>
              {total > 0 ? total : "—"}
            </p>
            <p className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-muted-foreground mt-1">/ 100</p>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="divide-y divide-border/40">
        {criteria.map((c) => {
          const k = `${finalist.id}:${c.key}`;
          const current = myScores[c.key] ?? null;

          return (
            <div key={c.key} className="px-6 py-5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="text-sm font-medium">{c.label}</p>
                <div className="flex items-center gap-2 shrink-0">
                  {saving.has(k) && (
                    <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground animate-pulse">Saving</span>
                  )}
                  {saved.has(k) && !saving.has(k) && (
                    <CheckCircle2 className="size-3.5 text-green-400" />
                  )}
                  <span className={`font-mono text-[0.6rem] px-2 py-0.5 rounded-full ${style.badge}`}>
                    {Math.round(c.weight * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => onScore(finalist.id, c.key, n)}
                    className={`h-14 rounded-xl font-mono text-lg font-semibold transition-all active:scale-95 ${
                      current === n
                        ? `${style.btn} shadow-sm`
                        : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
