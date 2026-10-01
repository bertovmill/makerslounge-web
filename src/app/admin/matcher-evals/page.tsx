"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Participant } from "@/lib/meetup-matcher";
import type { EvalLabel, RunResults, RunSummary } from "@/lib/matcher-evals";

/**
 * /admin/matcher-evals — how good are May's introductions?
 *
 * Runs come from `npm run eval:matcher` (evals/matcher/run.ts). Each card is one
 * introduction May made; swipe right (or →) if you'd make it yourself, left (←)
 * if not. Those grades are the ground truth the LLM judge is measured against:
 * the judge's verdict stays hidden until you've graded, so it can't anchor you.
 *
 * The selected run is in the URL (?run=<id>) so a link lands on the same run.
 */

const METRIC_LABELS: Record<string, string> = {
  coverage: "Coverage",
  structural_pass_rate: "Rules followed",
  planted_recall: "Planted pairs found",
  grounding: "Grounded reasons",
  needs_met: "Needs met (judge)",
};

const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${Math.round(v * 100)}%`);

interface MatchCard {
  person: Participant;
  match: Participant | undefined;
  matched_id: string;
  matched_name: string;
  reason: string;
  starter: string;
  issues: string[];
  judge: { helps_with_need: boolean; why: string } | null;
}

async function fetchRuns(): Promise<{ runs: RunSummary[] } | { error: string }> {
  const res = await fetch("/api/admin/matcher-evals");
  if (res.status === 401 || res.status === 403) return { error: "Admins only." };
  if (!res.ok) return { error: "Couldn't load eval runs." };
  return { runs: (await res.json()).runs };
}

export default function MatcherEvalsPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted-foreground">Loading…</p>}>
      <MatcherEvals />
    </Suspense>
  );
}

function MatcherEvals() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [runs, setRuns] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runId = searchParams.get("run") ?? runs?.[0]?.id ?? null;

  const applyRuns = useCallback((result: Awaited<ReturnType<typeof fetchRuns>>) => {
    if ("error" in result) setError(result.error);
    else setRuns(result.runs);
  }, []);
  const loadRuns = useCallback(() => fetchRuns().then(applyRuns), [applyRuns]);

  useEffect(() => {
    let live = true;
    fetchRuns().then((result) => live && applyRuns(result));
    return () => {
      live = false;
    };
  }, [applyRuns]);

  if (error) return <p className="p-8 text-sm text-destructive">{error}</p>;
  if (!runs) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;

  const selected = runs.find((r) => r.id === runId) ?? null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="text-2xl font-semibold">Matcher evals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          How good are May&apos;s introductions? Run <code className="rounded bg-muted px-1">npm run eval:matcher</code>, then grade
          her matches here. Your grades check the judge.
        </p>
      </header>

      {runs.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">No runs yet. Run the eval once and it shows up here.</Card>
      ) : (
        <section id="runs" className="flex gap-2 overflow-x-auto pb-1">
          {runs.map((r) => (
            <button
              key={r.id}
              onClick={() => router.replace(`/admin/matcher-evals?run=${r.id}`, { scroll: false })}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-2 text-left text-xs transition-colors",
                r.id === selected?.id ? "border-primary bg-primary/10" : "hover:bg-muted",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{r.dataset}</span>
                <Badge variant={r.passed ? "secondary" : "destructive"} className="text-[10px]">
                  {r.passed ? "PASS" : "FAIL"}
                </Badge>
              </div>
              <div className="mt-1 text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · graded {r.labeled}/{r.total_matches}
              </div>
            </button>
          ))}
        </section>
      )}

      {selected && <RunView key={selected.id} summary={selected} onGraded={loadRuns} />}
    </div>
  );
}

function RunView({ summary, onGraded }: { summary: RunSummary; onGraded: () => void }) {
  const [results, setResults] = useState<RunResults | null>(null);
  const [labels, setLabels] = useState<EvalLabel[]>([]);
  const [reveal, setReveal] = useState<{ card: MatchCard; good: boolean } | null>(null);
  const [history, setHistory] = useState<MatchCard[]>([]);

  useEffect(() => {
    let live = true;
    fetch(`/api/admin/matcher-evals/${summary.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!live || !data) return;
        setResults(data.run.results);
        setLabels(data.labels);
      });
    return () => {
      live = false;
    };
  }, [summary.id]);

  const cards = useMemo<MatchCard[]>(() => {
    if (!results) return [];
    const byId = new Map(results.participants.map((p) => [p.id, p]));
    return results.people.flatMap((entry) => {
      const person = byId.get(entry.person_id);
      if (!person) return [];
      return entry.matches.map((m) => {
        const verdict = entry.judge?.verdicts.find((v) => v.matched_id === m.matched_id) ?? null;
        return {
          person,
          match: byId.get(m.matched_id),
          matched_id: m.matched_id,
          matched_name: m.matched_name,
          reason: m.reason,
          starter: m.conversation_starter,
          issues: entry.issues.filter((i) => i.includes(m.matched_id) || i.includes("themselves")),
          judge: verdict ? { helps_with_need: verdict.helps_with_need, why: verdict.why } : null,
        };
      });
    });
  }, [results]);

  const isLabeled = (c: MatchCard) => labels.some((l) => l.person_id === c.person.id && l.matched_id === c.matched_id);
  const queue = cards.filter((c) => !isLabeled(c));
  const current = queue[0] ?? null;

  const agreement = useMemo(() => {
    let both = 0;
    let agree = 0;
    for (const l of labels) {
      const c = cards.find((x) => x.person.id === l.person_id && x.matched_id === l.matched_id);
      if (!c?.judge) continue;
      both++;
      if (c.judge.helps_with_need === l.good) agree++;
    }
    return both ? agree / both : null;
  }, [labels, cards]);

  const grade = useCallback(
    async (card: MatchCard, good: boolean) => {
      setLabels((prev) => [...prev, { person_id: card.person.id, matched_id: card.matched_id, good, note: null }]);
      setHistory((prev) => [...prev, card]);
      setReveal({ card, good });
      await fetch(`/api/admin/matcher-evals/${summary.id}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: card.person.id, matched_id: card.matched_id, good }),
      });
      onGraded();
    },
    [summary.id, onGraded],
  );

  const undo = useCallback(async () => {
    const last = history.at(-1);
    if (!last) return;
    setHistory((prev) => prev.slice(0, -1));
    setLabels((prev) => prev.filter((l) => !(l.person_id === last.person.id && l.matched_id === last.matched_id)));
    setReveal(null);
    await fetch(`/api/admin/matcher-evals/${summary.id}/labels`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ person_id: last.person.id, matched_id: last.matched_id }),
    });
    onGraded();
  }, [history, summary.id, onGraded]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowRight" && current) void grade(current, true);
      if (e.key === "ArrowLeft" && current) void grade(current, false);
      if ((e.key === "z" || e.key === "Backspace") && history.length) void undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, grade, undo, history.length]);

  return (
    <div className="flex flex-col gap-6">
      <section id="metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Object.entries(summary.metrics).map(([key, value]) => {
          const min = summary.thresholds[key];
          const failing = value !== null && min !== undefined && value < min;
          return (
            <Card key={key} className={cn("gap-1 p-4", failing && "border-destructive")}>
              <div className="text-xs text-muted-foreground">{METRIC_LABELS[key] ?? key}</div>
              <div className={cn("text-2xl font-semibold tabular-nums", failing && "text-destructive")}>{pct(value)}</div>
              {min !== undefined && <div className="text-[11px] text-muted-foreground">needs {pct(min)}</div>}
            </Card>
          );
        })}
        <Card className="gap-1 p-4">
          <div className="text-xs text-muted-foreground">You vs. the judge</div>
          <div className="text-2xl font-semibold tabular-nums">{pct(agreement)}</div>
          <div className="text-[11px] text-muted-foreground">agreement on {labels.length} graded</div>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        May: {summary.model} · judge: {summary.judge_model}
        {summary.git_sha && ` · commit ${summary.git_sha}`}
      </p>

      <section id="grade" className="flex flex-col items-center gap-4">
        <div className="h-1.5 w-full max-w-xl overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${cards.length ? (labels.length / cards.length) * 100 : 0}%` }} />
        </div>
        <p className="text-xs text-muted-foreground">
          {labels.length} of {cards.length} introductions graded
        </p>

        {reveal && <RevealLine reveal={reveal} />}

        {!results ? (
          <p className="text-sm text-muted-foreground">Loading matches…</p>
        ) : current ? (
          <SwipeCard key={`${current.person.id}-${current.matched_id}`} card={current} onGrade={(good) => grade(current, good)} />
        ) : (
          <Card className="w-full max-w-xl p-8 text-center">
            <div className="text-3xl">🎉</div>
            <p className="mt-2 font-medium">Every introduction in this run is graded.</p>
            <p className="mt-1 text-sm text-muted-foreground">You and the judge agreed on {pct(agreement)} of them.</p>
          </Card>
        )}

        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" disabled={!current} onClick={() => current && grade(current, false)}>
            👎 Wouldn&apos;t introduce
          </Button>
          <Button size="lg" disabled={!current} onClick={() => current && grade(current, true)}>
            👍 Good intro
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>← / → to grade · swipe on a phone</span>
          {history.length > 0 && (
            <button onClick={undo} className="underline underline-offset-2 hover:text-foreground">
              Undo
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function RevealLine({ reveal }: { reveal: { card: MatchCard; good: boolean } }) {
  const { card, good } = reveal;
  if (!card.judge) return <p className="text-xs text-muted-foreground">Saved. (The judge didn&apos;t grade this one.)</p>;
  const agree = card.judge.helps_with_need === good;
  return (
    <p className={cn("max-w-xl text-center text-xs", agree ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
      {agree ? "✓ The judge agreed" : "✗ The judge disagreed"}: &ldquo;{card.judge.why}&rdquo;
    </p>
  );
}

function ProfileBlock({ label, person, fallbackName }: { label: string; person: Participant | undefined; fallbackName?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">
        {person?.name ?? fallbackName}
        {person?.role && <span className="font-normal text-muted-foreground"> · {person.role}</span>}
      </div>
      {person?.currently_building && <p className="text-sm">Building: {person.currently_building}</p>}
      {person?.skills?.length ? <p className="text-sm text-muted-foreground">Skills: {person.skills.join(", ")}</p> : null}
      {person?.looking_for_help && <p className="text-sm text-muted-foreground">Needs: {person.looking_for_help}</p>}
    </div>
  );
}

/** One introduction. Drag it right for 👍, left for 👎; it tilts as you go. */
function SwipeCard({ card, onGrade }: { card: MatchCard; onGrade: (good: boolean) => void }) {
  const [dx, setDx] = useState(0);
  const start = useRef<number | null>(null);
  const THRESHOLD = 110;

  return (
    <Card
      className="w-full max-w-xl touch-pan-y select-none gap-4 p-5 transition-transform duration-75"
      style={{ transform: `translateX(${dx}px) rotate(${dx / 25}deg)` }}
      onPointerDown={(e) => {
        start.current = e.clientX;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => start.current !== null && setDx(e.clientX - start.current)}
      onPointerUp={() => {
        start.current = null;
        if (Math.abs(dx) > THRESHOLD) onGrade(dx > 0);
        else setDx(0);
      }}
      onPointerCancel={() => {
        start.current = null;
        setDx(0);
      }}
    >
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className={cn("transition-opacity", dx < -30 ? "opacity-100 text-destructive" : "opacity-0")}>👎 NOPE</span>
        <span className={cn("transition-opacity", dx > 30 ? "opacity-100 text-emerald-600" : "opacity-0")}>GOOD INTRO 👍</span>
      </div>
      <ProfileBlock label="For" person={card.person} />
      <div className="border-t" />
      <ProfileBlock label="May introduces" person={card.match} fallbackName={card.matched_name} />
      <div className="rounded-lg bg-muted/60 p-3 text-sm">
        <p>{card.reason}</p>
        <p className="mt-2 italic text-muted-foreground">&ldquo;{card.starter}&rdquo;</p>
      </div>
      {card.issues.length > 0 && (
        <p className="text-xs text-destructive">Rule broken: {card.issues.join("; ")}</p>
      )}
    </Card>
  );
}
