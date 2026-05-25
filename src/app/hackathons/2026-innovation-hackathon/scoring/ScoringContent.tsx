"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Trophy, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Constants ──────────────────────────────────────────────────────────────

const PASSWORD = "makers2026";
const SESSION_KEY = "hackathon-judge-2026";

const JUDGES = [
  "James Maeng",
  "Naina Dewan",
  "Rishi Midha",
  "Dave Jani",
  "Ashish D'Sa",
];

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

const TRACK_STYLE: Record<string, { badge: string; score: string; btn: string; dot: string }> = {
  "Validating a Business Idea": {
    badge: "bg-amber-400/15 text-amber-300 border border-amber-400/30",
    score: "text-amber-300",
    btn: "bg-amber-400 text-black",
    dot: "bg-amber-400",
  },
  "Continuous Market Monitoring": {
    badge: "bg-sky-400/15 text-sky-300 border border-sky-400/30",
    score: "text-sky-300",
    btn: "bg-sky-400 text-black",
    dot: "bg-sky-400",
  },
  "Synthetic Customers": {
    badge: "bg-violet-400/15 text-violet-300 border border-violet-400/30",
    score: "text-violet-300",
    btn: "bg-violet-400 text-black",
    dot: "bg-violet-400",
  },
};

const TRACK_ACCENT_COLORS = [
  { ring: "ring-amber-400/60", badge: "bg-amber-400/20 text-amber-300 border border-amber-400/30", dot: "bg-amber-400" },
  { ring: "ring-sky-400/60", badge: "bg-sky-400/20 text-sky-300 border border-sky-400/30", dot: "bg-sky-400" },
  { ring: "ring-violet-400/60", badge: "bg-violet-400/20 text-violet-300 border border-violet-400/30", dot: "bg-violet-400" },
];

// ─── Types ──────────────────────────────────────────────────────────────────

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

type Mode = "rubric" | "scoring";
type Overlay = null | "password" | "judge-select";

// ─── Rubric static data ─────────────────────────────────────────────────────

const RUBRIC_TRACKS = [
  {
    n: 1,
    name: "Validating a Business Idea",
    description:
      "Innovation teams collect thousands of ideas every year, far more than they can evaluate. Build an AI agent or tool that streamlines the innovation pipeline from raw idea to commercialized product.",
    image: "/hackathons/innovation-hackathon/track-idea-validation-art.png",
    criteria: [
      { label: "End-to-end pipeline coverage", weight: 25, description: "Handles the full journey from idea intake through evaluation, prioritization, and output — not just one step of the funnel." },
      { label: "Quality of scoring / triage logic", weight: 35, description: "The AI's ranking methodology is defensible, consistent, and meaningfully better than gut-feel. Handles nuanced, similar ideas differently." },
      { label: "Speed & scalability over manual review", weight: 25, description: "Demonstrates a credible reduction in time or cost vs. a human team reviewing the same volume of ideas." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
  {
    n: 2,
    name: "Continuous Market Monitoring",
    description:
      "The business landscape is changing fast, and separating signal from noise has become critical. Build an agentic AI tool or platform that continuously monitors the market for signals relevant to a company's innovation function.",
    image: "/hackathons/innovation-hackathon/track-market-monitoring-art.png",
    criteria: [
      { label: "Signal relevance & accuracy", weight: 35, description: "Surfaces signals genuinely useful to an innovation team — not just news summaries. Filters noise and avoids false positives." },
      { label: "Real-time or near-real-time capability", weight: 25, description: "Data freshness matters. The platform detects and surfaces new signals quickly; latency is minimized and made transparent." },
      { label: "Actionability of insights surfaced", weight: 25, description: "Insights are specific enough to act on. Not just 'AI is growing' — but what an innovation team should do differently because of it." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
  {
    n: 3,
    name: "Synthetic Customers",
    description:
      "Real customer studies are slow, expensive, and often fail to surface what customers actually want. Build an AI tool or platform that simulates synthetic customer feedback on new product ideas.",
    image: "/hackathons/innovation-hackathon/track-synthetic-customers-art.png",
    criteria: [
      { label: "Fidelity of synthetic feedback", weight: 35, description: "Simulated customers behave and respond like real market segments. Feedback is nuanced, not generic — accounts for edge cases and varied personas." },
      { label: "Non-obvious insight generation", weight: 25, description: "Surfaces things traditional surveys often miss: minority opinions, contradictions between stated and revealed preferences, unexpected objections." },
      { label: "Time & cost savings vs. real research", weight: 25, description: "Makes a credible case for replacing or meaningfully augmenting traditional customer research — speed, cost, or breadth of coverage." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function weightedScore(
  scores: Record<string, number>,
  criteria: { key: string; weight: number }[],
): number {
  let total = 0;
  for (const c of criteria) total += (scores[c.key] ?? 0) * c.weight;
  return Math.round(total * 20);
}

function avgWeightedScore(
  rows: ScoreRow[],
  criteria: { key: string; weight: number }[],
): number {
  const byJudge: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    if (!byJudge[r.judge_name]) byJudge[r.judge_name] = {};
    byJudge[r.judge_name][r.criterion_key] = r.score;
  }
  const judgeScores = Object.values(byJudge).map((s) => weightedScore(s, criteria));
  if (judgeScores.length === 0) return 0;
  return Math.round(judgeScores.reduce((a, b) => a + b, 0) / judgeScores.length);
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ScoringContent({ defaultMode = "rubric" }: { defaultMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [overlay, setOverlay] = useState<Overlay>(null);
  // Read initial auth state from sessionStorage on first client render
  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(sessionStorage.getItem(SESSION_KEY)),
  );
  const [judgeName, setJudgeName] = useState<string | null>(
    () => (typeof window !== "undefined" ? sessionStorage.getItem(`${SESSION_KEY}-judge`) : null),
  );

  const handleJudgeScoreClick = () => {
    if (!isAuthed) {
      setOverlay("password");
    } else if (!judgeName) {
      setOverlay("judge-select");
    } else {
      setMode("scoring");
    }
  };

  const handlePasswordSuccess = () => {
    setIsAuthed(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    setOverlay("judge-select");
  };

  const handleJudgeSelect = (name: string) => {
    setJudgeName(name);
    sessionStorage.setItem(`${SESSION_KEY}-judge`, name);
    setOverlay(null);
    setMode("scoring");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-5 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        {mode === "scoring" ? (
          <button
            onClick={() => setMode("rubric")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Rubric</span>
          </button>
        ) : (
          <Link
            href="/hackathons/2026-innovation-hackathon"
            className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
          >
            <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
            <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
            <span className="font-sans text-sm font-medium text-foreground hidden sm:inline">makerslounge</span>
          </Link>
        )}

        <nav className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
          {mode === "rubric" && (
            <>
              <Link href="/hackathons/2026-innovation-hackathon" className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                Hackathon
              </Link>
              <Link href="/hackathons/2026-innovation-hackathon/demo-night" className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                Demo Night
              </Link>
              <span className="px-3 py-1.5 rounded-md text-foreground bg-secondary/60">Scoring</span>
            </>
          )}
          {mode === "scoring" && judgeName && (
            <span className="px-3 py-1.5 rounded-md text-foreground bg-secondary/60 truncate max-w-[160px]">
              {judgeName}
            </span>
          )}
        </nav>

        <button
          onClick={
            mode === "scoring"
              ? () => setOverlay("judge-select")
              : handleJudgeScoreClick
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[0.65rem] uppercase tracking-[0.14em] text-foreground bg-secondary/40 hover:bg-secondary/80 transition-colors"
        >
          {mode === "scoring" ? (
            <>
              <UserRound className="size-3" />
              <span className="hidden sm:inline">Switch</span>
            </>
          ) : (
            <>Score</>
          )}
        </button>
      </header>

      {/* ── Views ───────────────────────────────────────────────────────── */}
      {mode === "rubric" ? (
        <RubricView />
      ) : (
        <ScoringView judgeName={judgeName!} />
      )}

      {/* ── Overlays ────────────────────────────────────────────────────── */}
      {overlay === "password" && (
        <PasswordOverlay
          onSuccess={handlePasswordSuccess}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "judge-select" && (
        <JudgeSelectOverlay
          onSelect={handleJudgeSelect}
          onClose={() => setOverlay(null)}
        />
      )}
    </div>
  );
}

// ─── Password overlay ───────────────────────────────────────────────────────

function PasswordOverlay({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const submit = () => {
    if (value === PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-5">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            2026 Innovation Hackathon
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Judge access</h2>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
            Password
          </label>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter password"
            className={`w-full rounded-lg border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 ${
              error
                ? "border-red-500/60 focus:border-red-500"
                : "border-border focus:border-foreground/40"
            }`}
          />
          {error && (
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-red-400">
              Incorrect password
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            className="flex-1 rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Judge select overlay ───────────────────────────────────────────────────

function JudgeSelectOverlay({ onSelect, onClose }: { onSelect: (name: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-5">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            2026 Innovation Hackathon
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Who are you?</h2>
        </div>

        <div className="flex flex-col gap-2">
          {JUDGES.map((name) => (
            <button
              key={name}
              onClick={() => onSelect(name)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 hover:border-foreground/30 active:scale-[0.98]"
            >
              {name}
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="text-xs font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Scoring view ───────────────────────────────────────────────────────────

function ScoringView({ judgeName }: { judgeName: string }) {
  const [finalists, setFinalists] = useState<Finalist[]>([]);
  const [myScores, setMyScores] = useState<Record<string, Record<string, number>>>({});
  const [allScores, setAllScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: finalistData } = await supabase
        .from("hackathon_submissions")
        .select("id, title, team_name, challenge_track")
        .eq("is_finalist", true)
        .order("challenge_track");

      const fs = (finalistData ?? []) as Finalist[];
      setFinalists(fs);

      if (fs.length > 0) {
        const ids = fs.map((f) => f.id);

        const { data: myScoreData } = await supabase
          .from("hackathon_scores")
          .select("submission_id, criterion_key, score")
          .eq("judge_name", judgeName)
          .in("submission_id", ids);

        const parsed: Record<string, Record<string, number>> = {};
        for (const row of myScoreData ?? []) {
          if (!parsed[row.submission_id]) parsed[row.submission_id] = {};
          parsed[row.submission_id][row.criterion_key] = row.score;
        }
        setMyScores(parsed);

        const { data: allScoreData } = await supabase
          .from("hackathon_scores")
          .select("submission_id, judge_name, criterion_key, score")
          .in("submission_id", ids);

        setAllScores((allScoreData ?? []) as ScoreRow[]);
      }

      setLoading(false);
    };
    load();
  }, [judgeName]);

  const handleScore = useCallback(
    async (submissionId: string, criterionKey: string, score: number) => {
      const k = `${submissionId}:${criterionKey}`;

      setMyScores((prev) => ({
        ...prev,
        [submissionId]: { ...(prev[submissionId] ?? {}), [criterionKey]: score },
      }));

      setAllScores((prev) => {
        const filtered = prev.filter(
          (r) => !(r.submission_id === submissionId && r.judge_name === judgeName && r.criterion_key === criterionKey),
        );
        return [...filtered, { submission_id: submissionId, judge_name: judgeName, criterion_key: criterionKey, score }];
      });

      setSaving((prev) => new Set(prev).add(k));

      await supabase.from("hackathon_scores").upsert(
        { judge_name: judgeName, submission_id: submissionId, criterion_key: criterionKey, score },
        { onConflict: "judge_name,submission_id,criterion_key" },
      );

      setSaving((prev) => { const s = new Set(prev); s.delete(k); return s; });
      setSaved((prev) => new Set(prev).add(k));
      setTimeout(() => setSaved((prev) => { const s = new Set(prev); s.delete(k); return s; }), 1500);
    },
    [judgeName],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground animate-pulse">
          Loading finalists…
        </p>
      </div>
    );
  }

  if (finalists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh] px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          No finalists selected yet
        </p>
        <p className="text-sm text-muted-foreground max-w-[34ch]">
          Finalists are selected from the admin submissions page.
        </p>
      </div>
    );
  }

  // Group finalists by track
  const byTrack: Record<string, Finalist[]> = {};
  for (const f of finalists) {
    const t = f.challenge_track ?? "Unknown";
    if (!byTrack[t]) byTrack[t] = [];
    byTrack[t].push(f);
  }

  // Compute results: per track, avg scores across all judges
  const resultsReady = allScores.length > 0;
  const trackResults: Array<{ track: string; finalists: Array<{ f: Finalist; avg: number }> }> = Object.entries(byTrack).map(([track, fs]) => {
    const criteria = TRACK_CRITERIA[track] ?? [];
    const ranked = fs.map((f) => {
      const rows = allScores.filter((r) => r.submission_id === f.id);
      return { f, avg: avgWeightedScore(rows, criteria) };
    }).sort((a, b) => b.avg - a.avg);
    return { track, finalists: ranked };
  });

  return (
    <div className="pb-20">
      {/* Scoring cards */}
      <div className="flex flex-col divide-y divide-border/50">
        {Object.entries(byTrack).map(([track, fs]) => {
          const criteria = TRACK_CRITERIA[track] ?? [];
          const style = TRACK_STYLE[track] ?? { badge: "bg-secondary/60 text-muted-foreground border border-border", score: "text-foreground", btn: "bg-foreground text-background", dot: "bg-foreground" };

          return (
            <div key={track} className="py-8 px-5">
              {/* Track header */}
              <div className="mb-6">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[0.6rem] uppercase tracking-widest ${style.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {track}
                </span>
              </div>

              {/* Finalist cards */}
              <div className="flex flex-col gap-5">
                {fs.map((finalist) => (
                  <FinalistScoringCard
                    key={finalist.id}
                    finalist={finalist}
                    criteria={criteria}
                    myScores={myScores[finalist.id] ?? {}}
                    saving={saving}
                    saved={saved}
                    style={style}
                    onScore={handleScore}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Results section */}
      {resultsReady && (
        <div className="border-t border-border/60 pt-10 pb-8 px-5 mt-6">
          <div className="flex items-center gap-3 mb-7">
            <Trophy className="size-4 text-amber-400" />
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-foreground">
              Live results
            </h2>
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-muted-foreground">
              avg across all judges
            </span>
          </div>

          <div className="flex flex-col gap-8">
            {trackResults.map(({ track, finalists: ranked }) => {
              const style = TRACK_STYLE[track] ?? { badge: "bg-secondary/60 text-muted-foreground border border-border", score: "text-foreground", btn: "bg-foreground text-background", dot: "bg-foreground" };
              return (
                <div key={track}>
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[0.6rem] uppercase tracking-widest mb-3 ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                    {track}
                  </span>
                  <div className="flex flex-col gap-2 mt-3">
                    {ranked.map(({ f, avg }, i) => (
                      <div
                        key={f.id}
                        className={`flex items-center gap-3 py-3 px-4 rounded-xl border ${
                          i === 0
                            ? "border-amber-400/30 bg-amber-400/5"
                            : "border-border/50 bg-card/40"
                        }`}
                      >
                        {i === 0 && <Trophy className="size-3.5 shrink-0 text-amber-400" />}
                        {i !== 0 && (
                          <span className="font-mono text-xs text-muted-foreground/50 w-3.5 text-center shrink-0">
                            {i + 1}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                            {f.title ?? "Untitled"}
                          </p>
                          {f.team_name && (
                            <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground/60 truncate">
                              {f.team_name}
                            </p>
                          )}
                        </div>
                        <span className={`font-mono text-sm font-medium tabular-nums shrink-0 ${i === 0 ? style.score : "text-muted-foreground"}`}>
                          {avg > 0 ? `${avg}` : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Finalist scoring card ──────────────────────────────────────────────────

function FinalistScoringCard({
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
  onScore: (submissionId: string, criterionKey: string, score: number) => void;
}) {
  const scored = weightedScore(myScores, criteria);
  const allScored = criteria.every((c) => myScores[c.key] != null);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Card header */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base leading-snug text-foreground truncate">
              {finalist.title ?? "Untitled"}
            </p>
            {finalist.team_name && (
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground mt-1 truncate">
                {finalist.team_name}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className={`font-mono text-2xl font-medium tabular-nums leading-none ${allScored ? style.score : "text-muted-foreground/40"}`}>
              {scored > 0 ? scored : "—"}
            </p>
            <p className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
              / 100
            </p>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="divide-y divide-border/40">
        {criteria.map((c) => {
          const k = `${finalist.id}:${c.key}`;
          const current = myScores[c.key] ?? null;
          const isSaving = saving.has(k);
          const isSaved = saved.has(k);

          return (
            <div key={c.key} className="px-5 py-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm text-foreground leading-snug flex-1">
                  {c.label}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isSaving && (
                    <span className="font-mono text-[0.5rem] uppercase tracking-widest text-muted-foreground animate-pulse">
                      Saving
                    </span>
                  )}
                  {isSaved && !isSaving && (
                    <span className="font-mono text-[0.5rem] uppercase tracking-widest text-green-400">
                      Saved
                    </span>
                  )}
                  <span className={`font-mono text-[0.6rem] px-1.5 py-0.5 rounded-full ${style.badge}`}>
                    {Math.round(c.weight * 100)}%
                  </span>
                </div>
              </div>

              {/* Score buttons */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => {
                  const isSelected = current === n;
                  return (
                    <button
                      key={n}
                      onClick={() => onScore(finalist.id, c.key, n)}
                      className={`h-12 rounded-xl font-mono text-base font-medium transition-all active:scale-95 ${
                        isSelected
                          ? style.btn
                          : "bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/50"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Rubric view (static) ───────────────────────────────────────────────────

function RubricView() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[56vh] min-h-[340px] max-h-[540px] overflow-hidden">
        <Image
          src="/hackathons/innovation-hackathon/cover-art.png"
          alt="2026 Innovation Hackathon"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />
        <div className="relative z-10 flex flex-col justify-end h-full px-[clamp(1.25rem,5vw,3rem)] pb-[clamp(2rem,5vh,4rem)]">
          <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/60 mb-3">
            <span className="text-white/90">Judging Rubric</span>
            <span className="h-px w-6 bg-white/30" />
            <span>Demo Night · May 26, 2026</span>
          </div>
          <h1 className="font-serif text-[clamp(3rem,9vw,6.5rem)] leading-[0.9] tracking-tight text-white">
            Scoring criteria.
          </h1>
          <p className="mt-4 max-w-[50ch] text-[clamp(0.875rem,2vw,1.125rem)] leading-relaxed text-white/70">
            Three tracks. Four criteria each. Score 1–5 per criterion, then apply weights for a total out of 100.
          </p>
        </div>
      </section>

      {/* Tracks */}
      <div className="flex flex-col gap-0">
        {RUBRIC_TRACKS.map((track, i) => {
          const accent = TRACK_ACCENT_COLORS[i];
          return (
            <section key={track.n} className="border-t border-border/50 py-[clamp(3rem,7vh,5rem)]">
              <div className="px-[clamp(1.25rem,5vw,3rem)] mb-6">
                <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6rem] font-mono uppercase tracking-widest ${accent.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                    Track {String(track.n).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-border/50 max-w-[8rem]" />
                </div>
                <h2 className="font-serif text-[clamp(1.75rem,4.5vw,3.25rem)] leading-tight tracking-tight mb-3">
                  {track.name}
                </h2>
                <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {track.description}
                </p>
              </div>

              <div className="px-[clamp(1.25rem,5vw,3rem)] mb-8">
                <div className={`relative w-full rounded-2xl overflow-hidden ring-1 ${accent.ring} h-40 sm:h-52`}>
                  <Image src={track.image} alt={track.name} fill className="object-cover object-center" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
                </div>
              </div>

              <div className="relative">
                <div className="pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-background to-transparent z-10 hidden sm:block" />
                <div className="flex gap-4 overflow-x-auto pb-4 px-[clamp(1.25rem,5vw,3rem)] snap-x snap-mandatory scroll-smooth" style={{ scrollbarWidth: "none" }}>
                  {track.criteria.map((c, ci) => (
                    <div key={c.label} className="snap-start shrink-0 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 w-[min(82vw,320px)] sm:w-72">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                          Criterion {String(ci + 1).padStart(2, "0")}
                        </span>
                        <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded-full ${accent.badge}`}>
                          {c.weight}%
                        </span>
                      </div>
                      <h3 className="text-base font-medium leading-snug text-foreground">{c.label}</h3>
                      <p className="text-[0.8rem] leading-relaxed text-muted-foreground flex-1">{c.description}</p>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">Score (1–5)</span>
                        <span className="font-mono text-sm text-muted-foreground/40 tracking-widest">_ / 5</span>
                      </div>
                    </div>
                  ))}
                  <div className="snap-start shrink-0 flex flex-col justify-center items-center gap-2 rounded-xl border border-dashed border-border/50 p-5 w-44 text-center">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">Total</span>
                    <span className="font-mono text-2xl font-medium text-foreground">100%</span>
                    <div className="mt-2 h-px w-8 bg-border" />
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">Weighted<br />score</span>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Scoring scale */}
      <section className="border-t border-border/50 py-[clamp(2.5rem,6vh,4rem)] px-[clamp(1.25rem,5vw,3rem)]">
        <div className="max-w-2xl">
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-5">Scoring scale</h2>
          <div className="flex flex-col">
            {[
              { score: 5, label: "Exceptional", desc: "Clearly exceeds the criterion" },
              { score: 4, label: "Strong", desc: "Meets the criterion with notable quality" },
              { score: 3, label: "Meets the bar", desc: "Solid but unremarkable" },
              { score: 2, label: "Weak attempt", desc: "Partially addressed" },
              { score: 1, label: "Does not address", desc: "The criterion is not addressed" },
            ].map((row) => (
              <div key={row.score} className="flex items-baseline gap-5 py-3 border-b border-border/50 last:border-0">
                <span className="font-mono text-xl font-medium text-foreground w-4 shrink-0">{row.score}</span>
                <span className="text-sm font-medium text-foreground w-36 shrink-0">{row.label}</span>
                <span className="text-sm text-muted-foreground">{row.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 px-[clamp(1.25rem,5vw,3rem)] flex flex-col gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>2026 Innovation Hackathon · MakersLounge</span>
        <Link href="/hackathons/2026-innovation-hackathon" className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground">
          Back to hackathon <ArrowUpRight className="size-3" />
        </Link>
      </footer>
    </>
  );
}
