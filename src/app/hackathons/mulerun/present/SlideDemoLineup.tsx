"use client";

import { useCallback, useEffect, useState } from "react";
import { PlayCircle, RotateCcw, Shuffle, Sparkles, Trash2 } from "lucide-react";

const QR_URL = "https://makerslounge.ca/hackathons/mulerun/demo-signup";
const POLL_MS = 5000;

const TEST_TEAMS: ReadonlyArray<{
  team_name: string;
  name: string;
  project: string;
  video_url?: string;
}> = [
  { team_name: "MoodMakers", name: "Alice & Bob", project: "An agent that books restaurants by text." },
  { team_name: "PixelPulse", name: "Charlie", project: "Realtime whiteboard with AI sketch suggestions.", video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { team_name: "ByteForge", name: "Dana & Eli", project: "Code review bot that learns your team's style." },
  { team_name: "LoopHaus", name: "Finn", project: "Habit tracker that hypes you up with an LLM coach." },
  { team_name: "StackSprout", name: "Greta & Hank", project: "Onboarding playbooks generated from a Slack archive." },
  { team_name: "VoltCraft", name: "Iris", project: "Voice-to-doc transcriber tuned for engineers.", video_url: "https://www.loom.com/share/example" },
  { team_name: "NimbusKit", name: "Jack & Kit", project: "Cloud infra summarizer for non-engineers." },
  { team_name: "KernelKitchen", name: "Lena", project: "Recipe generator from a photo of your fridge." },
  { team_name: "DriftLab", name: "Mia & Nico", project: "Anomaly detection on real-time analytics streams." },
  { team_name: "AtlasMind", name: "Owen", project: "RAG over your personal note vault." },
];

type Demo = {
  id: string;
  team_name: string | null;
  name: string;
  project: string;
  video_url: string | null;
};

export default function SlideDemoLineup() {
  const [demos, setDemos] = useState<Demo[]>([]);
  const [shownIds, setShownIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mulerun/demos", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      if (Array.isArray(body.demos)) setDemos(body.demos);
    } catch {
      // silent — keep last good state
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    // Polling pattern — load() sets state after async fetch. Lint flags any
    // path that may setState inside an effect; this is the intended pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // Derive current from demos so a deleted team auto-clears without an effect.
  const current = currentId
    ? demos.find((d) => d.id === currentId) ?? null
    : null;
  const remaining = demos.filter((d) => !shownIds.includes(d.id));
  const allDone = shownIds.length > 0 && remaining.length === 0;

  const pickNext = () => {
    if (remaining.length === 0) return;
    const idx = Math.floor(Math.random() * remaining.length);
    const next = remaining[idx];
    setCurrentId(next.id);
    setShownIds((prev) => [...prev, next.id]);
  };

  const reset = () => {
    setShownIds([]);
    setCurrentId(null);
  };

  const seedTestTeams = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      for (const team of TEST_TEAMS) {
        const res = await fetch("/api/mulerun/demos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(team),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          window.alert(body?.error ?? "Couldn't seed test teams.");
          break;
        }
      }
      await load();
    } catch {
      window.alert("Network error while seeding. Try again.");
    } finally {
      setSeeding(false);
    }
  };

  const clearAll = async () => {
    if (demos.length === 0) return;
    const ok = window.confirm(
      `Delete all ${demos.length} submission${demos.length === 1 ? "" : "s"}? This can't be undone.`
    );
    if (!ok) return;
    try {
      const res = await fetch("/api/mulerun/demos?all=1", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        window.alert(body?.error ?? "Couldn't clear submissions.");
        return;
      }
      setShownIds([]);
      setCurrentId(null);
      setDemos([]);
      load();
    } catch {
      window.alert("Network error. Try again.");
    }
  };

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(
    QR_URL
  )}`;

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-[clamp(1rem,3vh,2rem)]">
      {/* Eyebrow + lineup status */}
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            <span className="text-foreground">{shownIds.length}</span> shown
          </span>
          <span>
            <span className="text-foreground">{remaining.length}</span> left
          </span>
          <span>
            <span className="text-foreground">{demos.length}</span> submitted
          </span>
        </div>
      </div>

      {/* Hero: current team + QR */}
      <div className="grid items-center gap-[clamp(1.5rem,4vw,4rem)] lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-[clamp(0.75rem,2vh,1.5rem)]">
          {!loaded ? null : current ? (
            <>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Now demoing
              </span>
              <h2 className="font-serif text-[clamp(2.75rem,10vw,9rem)] leading-[0.9] tracking-tight">
                {current.team_name?.trim() || current.name}
              </h2>
              {current.team_name?.trim() && (
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-foreground sm:text-sm">
                  {current.name}
                </p>
              )}
              <p className="max-w-[34ch] font-serif text-[clamp(1.25rem,2.8vw,2.5rem)] leading-tight tracking-tight text-muted-foreground">
                {current.project}
              </p>
              {current.video_url && (
                <a
                  href={current.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-foreground hover:text-background"
                >
                  <PlayCircle className="size-4" strokeWidth={2} />
                  Watch demo
                </a>
              )}
            </>
          ) : allDone ? (
            <>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Wrap
              </span>
              <h2 className="font-serif text-[clamp(2.75rem,9vw,8rem)] leading-[0.9] tracking-tight">
                That&apos;s a wrap.
              </h2>
              <p className="max-w-[28ch] font-serif text-[clamp(1.5rem,3vw,2.5rem)] leading-tight tracking-tight text-muted-foreground">
                Judges deliberating.
              </p>
            </>
          ) : demos.length === 0 ? (
            <>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Waiting
              </span>
              <h2 className="font-serif text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
                Scan to submit your demo.
              </h2>
              <p className="max-w-[36ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
                Submissions roll in live. We&apos;ll call you up at random.
              </p>
            </>
          ) : (
            <>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Ready
              </span>
              <h2 className="font-serif text-[clamp(2.75rem,8vw,7rem)] leading-[0.9] tracking-tight">
                Press shuffle to pick the first team.
              </h2>
              <p className="max-w-[40ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
                {remaining.length} team{remaining.length === 1 ? "" : "s"} in the lineup. New submissions roll in live.
              </p>
            </>
          )}
        </div>

        {/* QR — always visible so people can submit during demos */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Scan to submit
          </span>
          <div className="rounded-2xl border border-border bg-white p-[clamp(0.5rem,1.2vw,1rem)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="Scan to submit a demo"
              width={420}
              height={420}
              className="h-[clamp(10rem,16vw,16rem)] w-[clamp(10rem,16vw,16rem)] object-contain"
            />
          </div>
          <span className="font-mono text-[10px] tracking-tight text-foreground">
            makerslounge.ca/hackathons/mulerun/demo-signup
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={reset}
            disabled={shownIds.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <RotateCcw className="size-3" strokeWidth={2} />
            Reset lineup
          </button>
          <button
            onClick={clearAll}
            disabled={demos.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-destructive transition-colors hover:bg-destructive/5 disabled:opacity-30"
          >
            <Trash2 className="size-3" strokeWidth={2} />
            Clear submissions
          </button>
          <button
            onClick={seedTestTeams}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
          >
            <Sparkles className="size-3" strokeWidth={2} />
            {seeding ? "Seeding…" : "Seed test teams"}
          </button>
        </div>
        <button
          onClick={pickNext}
          disabled={remaining.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
        >
          <Shuffle className="size-4" strokeWidth={2} />
          {current ? "Next team" : "Pick a team"}
        </button>
      </div>
    </div>
  );
}
