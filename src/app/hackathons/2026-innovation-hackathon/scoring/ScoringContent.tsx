"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Info, Menu, RotateCcw, Trophy, UserRound, X } from "lucide-react";
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

const JUDGE_TO_SLUG: Record<string, string> = {
  "James Maeng": "james",
  "Naina Dewan": "naina",
  "Rishi Midha": "rishi",
  "Dave Jani": "dave",
  "Ashish D'Sa": "ashish",
};
const SLUG_TO_JUDGE: Record<string, string> = Object.fromEntries(
  Object.entries(JUDGE_TO_SLUG).map(([name, slug]) => [slug, name]),
);

const TRACK_CRITERIA: Record<string, { key: string; label: string; weight: number; description: string }[]> = {
  "Validating a Business Idea": [
    { key: "pipeline_coverage", label: "End-to-end pipeline coverage", weight: 0.25, description: "Handles the full journey from idea intake through evaluation, prioritization, and output — not just one step of the funnel." },
    { key: "scoring_logic", label: "Quality of scoring / triage logic", weight: 0.35, description: "The AI's ranking methodology is defensible, consistent, and meaningfully better than gut-feel. Handles nuanced, similar ideas differently." },
    { key: "speed_scalability", label: "Speed & scalability over manual review", weight: 0.25, description: "Demonstrates a credible reduction in time or cost vs. a human team reviewing the same volume of ideas." },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
  ],
  "Continuous Market Monitoring": [
    { key: "signal_relevance", label: "Signal relevance & accuracy", weight: 0.35, description: "Surfaces signals genuinely useful to an innovation team — not just news summaries. Filters noise and avoids false positives." },
    { key: "realtime_capability", label: "Real-time or near-real-time capability", weight: 0.25, description: "Data freshness matters. The platform detects and surfaces new signals quickly; latency is minimized and made transparent." },
    { key: "actionability", label: "Actionability of insights surfaced", weight: 0.25, description: "Insights are specific enough to act on. Not just 'AI is growing' — but what an innovation team should do differently because of it." },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
  ],
  "Synthetic Customers": [
    { key: "feedback_fidelity", label: "Fidelity of synthetic feedback", weight: 0.35, description: "Simulated customers behave and respond like real market segments. Feedback is nuanced, not generic — accounts for edge cases and varied personas." },
    { key: "nonobvious_insights", label: "Non-obvious insight generation", weight: 0.25, description: "Surfaces things traditional surveys often miss: minority opinions, contradictions between stated and revealed preferences, unexpected objections." },
    { key: "time_cost_savings", label: "Time & cost savings vs. real research", weight: 0.25, description: "Makes a credible case for replacing or meaningfully augmenting traditional customer research — speed, cost, or breadth of coverage." },
    { key: "demo_clarity", label: "Demo clarity", weight: 0.15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
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

type Overlay = null | "password" | "judge-select" | "reset-confirm";

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

export default function ScoringContent({ judgeSlug }: { judgeSlug?: string }) {
  const router = useRouter();
  const presetName = judgeSlug ? SLUG_TO_JUDGE[judgeSlug] ?? null : null;

  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(sessionStorage.getItem(SESSION_KEY)),
  );
  const [judgeName, setJudgeName] = useState<string | null>(
    () => presetName ?? (typeof window !== "undefined" ? sessionStorage.getItem(`${SESSION_KEY}-judge`) : null),
  );
  const [overlay, setOverlay] = useState<Overlay>(() => {
    if (typeof window === "undefined") return "password";
    const authed = Boolean(sessionStorage.getItem(SESSION_KEY));
    if (!authed) return "password";
    if (presetName) return null;
    const judge = sessionStorage.getItem(`${SESSION_KEY}-judge`);
    return judge ? null : "judge-select";
  });
  const [resetKey, setResetKey] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handlePasswordSuccess = () => {
    setIsAuthed(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    if (presetName) {
      setJudgeName(presetName);
      sessionStorage.setItem(`${SESSION_KEY}-judge`, presetName);
      setOverlay(null);
    } else {
      setOverlay("judge-select");
    }
  };

  const handleJudgeSelect = (name: string) => {
    setJudgeName(name);
    sessionStorage.setItem(`${SESSION_KEY}-judge`, name);
    setOverlay(null);
    const slug = JUDGE_TO_SLUG[name];
    if (slug) router.push(`/hackathons/2026-innovation-hackathon/scoring/${slug}`);
  };

  const handleResetConfirm = async () => {
    if (!judgeName) return;
    await supabase.from("hackathon_scores").delete().eq("judge_name", judgeName);
    setResetKey((k) => k + 1);
    setOverlay(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-5 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <Link
          href="/hackathons/2026-innovation-hackathon"
          className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
        >
          <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
          <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
          <span className="font-sans text-sm font-medium text-foreground hidden sm:inline">makerslounge</span>
        </Link>

        <div className="flex flex-col items-center gap-0.5">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] px-3 py-1 rounded-md text-foreground bg-secondary/60">
            Scoring
          </span>
          {judgeName && (
            <span className="lg:hidden font-mono text-[0.55rem] uppercase tracking-[0.1em] text-muted-foreground leading-none">
              {judgeName.split(" ")[0]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {judgeName && (
            <button
              onClick={() => setOverlay("reset-confirm")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[0.65rem] uppercase tracking-[0.14em] text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
            >
              <RotateCcw className="size-3" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
          <button
            onClick={() => setOverlay("judge-select")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[0.65rem] uppercase tracking-[0.14em] text-foreground bg-secondary/40 hover:bg-secondary/80 transition-colors"
          >
            <UserRound className="size-3" />
            <span className="hidden sm:inline">Switch</span>
          </button>
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden flex items-center justify-center size-8 rounded-md text-foreground hover:bg-secondary/60 transition-colors"
            aria-label="Open finalist list"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      {/* ── Views ───────────────────────────────────────────────────────── */}
      <ScoringView
        key={resetKey}
        judgeName={judgeName ?? ""}
        mobileNavOpen={mobileNavOpen}
        onMobileNavClose={() => setMobileNavOpen(false)}
      />

      {/* ── Overlays ────────────────────────────────────────────────────── */}
      {overlay === "password" && (
        <PasswordOverlay
          onSuccess={handlePasswordSuccess}
          onClose={() => router.push("/hackathons/2026-innovation-hackathon")}
        />
      )}
      {overlay === "judge-select" && (
        <JudgeSelectOverlay
          onSelect={handleJudgeSelect}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "reset-confirm" && (
        <ResetConfirmOverlay
          judgeName={judgeName ?? ""}
          onConfirm={handleResetConfirm}
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

// ─── Reset confirm overlay ──────────────────────────────────────────────────

function ResetConfirmOverlay({
  judgeName,
  onConfirm,
  onClose,
}: {
  judgeName: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm px-5">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 flex flex-col gap-6">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            2026 Innovation Hackathon
          </p>
          <h2 className="text-xl font-semibold tracking-tight">Reset your scores?</h2>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          This will permanently delete all scores submitted by <span className="text-foreground font-medium">{judgeName}</span> across every finalist. This cannot be undone.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 rounded-lg border border-border bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 rounded-lg bg-red-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-60"
          >
            {confirming ? "Resetting…" : "Yes, reset"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Scoring view ───────────────────────────────────────────────────────────

const FALLBACK_STYLE = { badge: "bg-secondary/60 text-muted-foreground border border-border", score: "text-foreground", btn: "bg-foreground text-background", dot: "bg-foreground" };

function ScoringView({ judgeName, mobileNavOpen, onMobileNavClose }: {
  judgeName: string;
  mobileNavOpen: boolean;
  onMobileNavClose: () => void;
}) {
  const [finalists, setFinalists] = useState<Finalist[]>([]);
  const [myScores, setMyScores] = useState<Record<string, Record<string, number>>>({});
  const [allScores, setAllScores] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      if (fs.length > 0) setSelectedId(fs[0].id);

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

  // Custom track order and within-track ordering
  const TRACK_ORDER = ["Continuous Market Monitoring", "Validating a Business Idea", "Synthetic Customers"];
  const orderedTracks = TRACK_ORDER.filter((t) => t in byTrack);

  // Within "Validating a Business Idea", put IdeaForge last
  const vbiTrack = "Validating a Business Idea";
  if (byTrack[vbiTrack]) {
    byTrack[vbiTrack].sort((a, b) => {
      const aName = (a.title ?? a.team_name ?? "").toLowerCase();
      const bName = (b.title ?? b.team_name ?? "").toLowerCase();
      const aIsIdea = aName.includes("ideaforge");
      const bIsIdea = bName.includes("ideaforge");
      if (aIsIdea && !bIsIdea) return 1;
      if (!aIsIdea && bIsIdea) return -1;
      return 0;
    });
  }

  // Within "Continuous Market Monitoring", put Snoop.ai first
  const cmmTrack = "Continuous Market Monitoring";
  if (byTrack[cmmTrack]) {
    byTrack[cmmTrack].sort((a, b) => {
      const aName = (a.title ?? a.team_name ?? "").toLowerCase();
      const bName = (b.title ?? b.team_name ?? "").toLowerCase();
      const aIsSnoop = aName.includes("snoop");
      const bIsSnoop = bName.includes("snoop");
      if (aIsSnoop && !bIsSnoop) return -1;
      if (!aIsSnoop && bIsSnoop) return 1;
      return 0;
    });
  }

  // Within "Synthetic Customers", put Doppel first
  const scTrack = "Synthetic Customers";
  if (byTrack[scTrack]) {
    byTrack[scTrack].sort((a, b) => {
      const aName = (a.title ?? a.team_name ?? "").toLowerCase();
      const bName = (b.title ?? b.team_name ?? "").toLowerCase();
      const aIsDoppel = aName.includes("doppel");
      const bIsDoppel = bName.includes("doppel");
      if (aIsDoppel && !bIsDoppel) return -1;
      if (!aIsDoppel && bIsDoppel) return 1;
      return 0;
    });
  }

  // Flat ordered finalists list (for prev/next nav)
  const orderedFinalists = orderedTracks.flatMap((t) => byTrack[t] ?? []);

  // Completion status per finalist
  const completionStatus = (finalistId: string, track: string): "none" | "partial" | "complete" => {
    const crit = TRACK_CRITERIA[track] ?? [];
    if (crit.length === 0) return "none";
    const scores = myScores[finalistId] ?? {};
    const scored = crit.filter((c) => scores[c.key] != null).length;
    if (scored === 0) return "none";
    return scored === crit.length ? "complete" : "partial";
  };

  const selectedFinalist = orderedFinalists.find((f) => f.id === selectedId) ?? orderedFinalists[0];
  const selectedTrack = selectedFinalist?.challenge_track ?? "";
  const criteria = TRACK_CRITERIA[selectedTrack] ?? [];
  const style = TRACK_STYLE[selectedTrack] ?? FALLBACK_STYLE;

  const selectedIndex = orderedFinalists.findIndex((f) => f.id === selectedFinalist?.id);
  const prevFinalist = selectedIndex > 0 ? orderedFinalists[selectedIndex - 1] : null;
  const nextFinalist = selectedIndex < orderedFinalists.length - 1 ? orderedFinalists[selectedIndex + 1] : null;

  // Overall progress
  const completedCount = finalists.filter(
    (f) => completionStatus(f.id, f.challenge_track ?? "") === "complete",
  ).length;

  // Compute results: per track, avg scores across all judges
  const resultsReady = allScores.length > 0;
  const trackResults: Array<{ track: string; finalists: Array<{ f: Finalist; avg: number }> }> = orderedTracks.map((track) => {
    const fs = byTrack[track];
    const crit = TRACK_CRITERIA[track] ?? [];
    const ranked = fs.map((f) => {
      const rows = allScores.filter((r) => r.submission_id === f.id);
      return { f, avg: avgWeightedScore(rows, crit) };
    }).sort((a, b) => b.avg - a.avg);
    return { track, finalists: ranked };
  });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 sticky top-14 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-r border-border/40 py-5 px-3 gap-5">
        {orderedTracks.map((track) => {
          const fs = byTrack[track];
          const s = TRACK_STYLE[track] ?? FALLBACK_STYLE;
          return (
            <div key={track}>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[0.65rem] uppercase tracking-[0.12em] mb-2 ${s.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                <span className="leading-tight">{track}</span>
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                {fs.map((f) => {
                  const status = completionStatus(f.id, track);
                  const isSelected = f.id === selectedFinalist?.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedId(f.id)}
                      className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                      }`}
                    >
                      {status === "complete" ? (
                        <Check className="size-3.5 shrink-0 text-green-400" />
                      ) : (
                        <span className={`w-2 h-2 rounded-full shrink-0 border transition-colors ${
                          status === "partial"
                            ? "bg-transparent border-current opacity-50"
                            : "bg-transparent border-muted-foreground/25"
                        }`} />
                      )}
                      <span className="flex-1 text-[0.8125rem] leading-snug truncate">
                        {f.title ?? f.team_name ?? "Untitled"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-border/40">
          {resultsReady && (
            <a
              href="#results"
              className="xl:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-[0.8125rem] text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
            >
              <Trophy className="size-3.5 shrink-0 text-amber-400" />
              Live results
            </a>
          )}

          {/* Progress */}
          <div className="px-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">Scored</span>
              <span className="font-mono text-[0.7rem] tabular-nums text-foreground">
                {completedCount}<span className="text-muted-foreground">/{finalists.length}</span>
              </span>
            </div>
            <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-400 transition-all duration-500"
                style={{ width: finalists.length > 0 ? `${(completedCount / finalists.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex overflow-hidden">

        {/* Mobile nav drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={onMobileNavClose}
            />
            <aside className="relative w-72 max-w-[85vw] h-full bg-background border-r border-border flex flex-col overflow-y-auto py-5 px-3 gap-5 shadow-xl">
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">Finalists</span>
                <button
                  onClick={onMobileNavClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              {orderedTracks.map((track) => {
                const fs = byTrack[track];
                const s = TRACK_STYLE[track] ?? FALLBACK_STYLE;
                return (
                  <div key={track}>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[0.65rem] uppercase tracking-[0.12em] mb-2 ${s.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      <span className="leading-tight">{track}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {fs.map((f) => {
                        const status = completionStatus(f.id, track);
                        const isSelected = f.id === selectedFinalist?.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => { setSelectedId(f.id); onMobileNavClose(); }}
                            className={`flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg transition-colors ${
                              isSelected ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                            }`}
                          >
                            {status === "complete" ? (
                              <Check className="size-3.5 shrink-0 text-green-400" />
                            ) : (
                              <span className={`w-2 h-2 rounded-full shrink-0 border transition-colors ${
                                status === "partial" ? "bg-transparent border-current opacity-50" : "bg-transparent border-muted-foreground/25"
                              }`} />
                            )}
                            <span className="flex-1 text-[0.8125rem] leading-snug truncate">
                              {f.title ?? f.team_name ?? "Untitled"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-border/40 px-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">Scored</span>
                  <span className="font-mono text-[0.7rem] tabular-nums text-foreground">
                    {completedCount}<span className="text-muted-foreground">/{finalists.length}</span>
                  </span>
                </div>
                <div className="h-1 rounded-full bg-secondary/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-green-400 transition-all duration-500"
                    style={{ width: finalists.length > 0 ? `${(completedCount / finalists.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Scoring column */}
        <div className="flex-1 min-w-0 flex flex-col overflow-y-auto">

          {/* Scoring card */}
          {selectedFinalist && (
            <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-2xl mx-auto">
              <div className="mb-5">
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[0.6rem] uppercase tracking-widest ${style.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  {selectedTrack}
                </span>
              </div>

              <FinalistScoringCard
                finalist={selectedFinalist}
                criteria={criteria}
                myScores={myScores[selectedFinalist.id] ?? {}}
                saving={saving}
                saved={saved}
                style={style}
                onScore={handleScore}
              />

              {/* Prev / Next */}
              <div className="flex items-stretch gap-3 mt-4">
                {prevFinalist ? (
                  <button
                    onClick={() => setSelectedId(prevFinalist.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-1 min-w-0"
                  >
                    <ArrowLeft className="size-3.5 shrink-0" />
                    <span className="truncate text-left">{prevFinalist.title ?? prevFinalist.team_name}</span>
                  </button>
                ) : <div className="flex-1" />}
                {nextFinalist ? (
                  <button
                    onClick={() => setSelectedId(nextFinalist.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-card text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex-1 min-w-0 justify-end"
                  >
                    <span className="truncate text-right">{nextFinalist.title ?? nextFinalist.team_name}</span>
                    <ArrowRight className="size-3.5 shrink-0" />
                  </button>
                ) : <div className="flex-1" />}
              </div>
            </div>
          )}

          {/* Results below scoring on narrow screens */}
          {resultsReady && (
            <div id="results" className="xl:hidden border-t border-border/60 pt-8 pb-12 px-4 sm:px-6 lg:px-8 mt-2 w-full max-w-2xl mx-auto">
              <LiveResultsPanel trackResults={trackResults} />
            </div>
          )}
        </div>

        {/* Right panel: live results on xl+ */}
        {resultsReady && (
          <aside className="hidden xl:flex flex-col w-72 2xl:w-80 shrink-0 sticky top-0 self-start h-[calc(100vh-3.5rem)] overflow-y-auto border-l border-border/40 py-6 px-5 gap-6">
            <LiveResultsPanel trackResults={trackResults} />
          </aside>
        )}
      </div>
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
  criteria: { key: string; label: string; weight: number; description: string }[];
  myScores: Record<string, number>;
  saving: Set<string>;
  saved: Set<string>;
  style: { badge: string; score: string; btn: string; dot: string };
  onScore: (submissionId: string, criterionKey: string, score: number) => void;
}) {
  const [openInfo, setOpenInfo] = useState<string | null>(null);
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
          const isInfoOpen = openInfo === c.key;

          return (
            <div key={c.key} className="px-5 py-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">
                    {c.label}
                  </p>
                  <button
                    onClick={() => setOpenInfo(isInfoOpen ? null : c.key)}
                    className={`shrink-0 transition-colors rounded-full p-0.5 ${isInfoOpen ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
                    aria-label={`Info about ${c.label}`}
                  >
                    <Info className="size-3.5" />
                  </button>
                </div>
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

              {isInfoOpen && (
                <p className="text-[0.8125rem] leading-relaxed text-muted-foreground mb-3 pl-0.5 pr-4">
                  {c.description}
                </p>
              )}

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

// ─── Live results panel ─────────────────────────────────────────────────────

function LiveResultsPanel({
  trackResults,
}: {
  trackResults: Array<{ track: string; finalists: Array<{ f: Finalist; avg: number }> }>;
}) {
  return (
    <>
      <div className="flex items-center gap-2.5">
        <Trophy className="size-3.5 text-amber-400 shrink-0" />
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-foreground">Live results</span>
        <span className="font-mono text-[0.5rem] uppercase tracking-[0.14em] text-muted-foreground">avg</span>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {trackResults.map(({ track, finalists: ranked }) => {
          const s = TRACK_STYLE[track] ?? FALLBACK_STYLE;
          return (
            <div key={track}>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[0.55rem] uppercase tracking-widest mb-2 ${s.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {track}
              </span>
              <div className="flex flex-col gap-1.5 mt-2">
                {ranked.map(({ f, avg }, i) => (
                  <div
                    key={f.id}
                    className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl border ${
                      i === 0 ? "border-amber-400/30 bg-amber-400/5" : "border-border/50 bg-card/40"
                    }`}
                  >
                    {i === 0
                      ? <Trophy className="size-3 shrink-0 text-amber-400" />
                      : <span className="font-mono text-[0.65rem] text-muted-foreground/50 w-3 text-center shrink-0">{i + 1}</span>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-[0.8125rem] font-medium truncate ${i === 0 ? "text-foreground" : "text-muted-foreground"}`}>
                        {f.title ?? "Untitled"}
                      </p>
                      {f.team_name && (
                        <p className="font-mono text-[0.55rem] uppercase tracking-[0.12em] text-muted-foreground/50 truncate">
                          {f.team_name}
                        </p>
                      )}
                    </div>
                    <span className={`font-mono text-sm font-medium tabular-nums shrink-0 ${i === 0 ? s.score : "text-muted-foreground"}`}>
                      {avg > 0 ? avg : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
