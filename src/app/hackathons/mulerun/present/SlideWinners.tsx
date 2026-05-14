"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";

type Result = {
  id: string;
  team_name: string | null;
  name: string;
  project: string;
  points: number;
  first: number;
  second: number;
  third: number;
};

export default function SlideWinners() {
  const [results, setResults] = useState<Result[]>([]);
  const [voteCount, setVoteCount] = useState(0);
  const [stage, setStage] = useState(0); // 0 = none, 1 = 3rd, 2 = 2nd, 3 = 1st
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mulerun/votes", { cache: "no-store" });
      if (!res.ok) return;
      const body = await res.json();
      if (Array.isArray(body.results)) setResults(body.results);
      if (typeof body.vote_count === "number") setVoteCount(body.vote_count);
    } catch {
      // silent
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = results.slice(0, 3);
  const podium = [top3[2], top3[1], top3[0]]; // index 0 = 3rd, 1 = 2nd, 2 = 1st
  const canReveal = top3.filter((r) => r && r.points > 0).length >= stage + 1;

  const advance = () => {
    if (stage < 3 && canReveal) setStage(stage + 1);
  };

  const reset = () => setStage(0);

  const labelFor = (i: number) => ["3rd place", "2nd place", "1st place"][i];
  const ptsLabelFor = (i: number) => ["Bronze", "Silver", "Gold"][i];

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-[clamp(1rem,3vh,2rem)]">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {stage === 0
            ? "Drumroll"
            : stage === 3
              ? "Champions"
              : "Reveal"}
        </span>
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            <span className="text-foreground">{voteCount}</span> votes counted
          </span>
          <span>
            <span className="text-foreground">{stage}</span>/3 revealed
          </span>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        {!loaded ? null : voteCount === 0 ? (
          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.9] tracking-tight">
              No votes yet.
            </h2>
            <p className="max-w-[40ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
              Send people back to the vote slide and try again.
            </p>
          </div>
        ) : stage === 0 ? (
          <div className="flex flex-col gap-[clamp(1rem,2.5vh,2rem)]">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              And the winners are…
            </span>
            <h2 className="font-serif text-[clamp(3rem,12vw,12rem)] leading-[0.88] tracking-tight">
              Drumroll please.
            </h2>
            <p className="max-w-[50ch] text-[clamp(1rem,1.6vw,1.5rem)] text-muted-foreground">
              Press the button to reveal 3rd place first, then 2nd, then 1st.
            </p>
          </div>
        ) : (
          <ol className="grid gap-[clamp(0.75rem,2vh,1.5rem)]">
            {podium.map((r, i) => {
              const revealed = i < stage;
              const isFirst = i === 2;
              return (
                <li
                  key={i}
                  className={`grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-[clamp(0.75rem,2vw,2rem)] rounded-2xl border p-[clamp(0.75rem,1.8vw,1.5rem)] transition-all ${
                    revealed
                      ? isFirst
                        ? "border-foreground bg-foreground text-background shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
                        : "border-foreground bg-card/60"
                      : "border-dashed border-border bg-card/20"
                  }`}
                >
                  <div
                    className={`flex size-[clamp(3rem,5vw,5rem)] items-center justify-center rounded-full font-mono text-xs uppercase tracking-[0.18em] ${
                      revealed
                        ? isFirst
                          ? "bg-background/15 text-background"
                          : "bg-foreground text-background"
                        : "bg-border/50 text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex min-w-0 flex-col gap-1">
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                        revealed
                          ? isFirst
                            ? "text-background/70"
                            : "text-muted-foreground"
                          : "text-muted-foreground/60"
                      }`}
                    >
                      {labelFor(i)} · {ptsLabelFor(i)}
                    </span>
                    {revealed && r ? (
                      <>
                        <span className="truncate font-serif text-[clamp(1.75rem,4.5vw,4.5rem)] leading-[0.95] tracking-tight">
                          {r.team_name?.trim() || r.name}
                        </span>
                        {r.team_name?.trim() && (
                          <span
                            className={`font-mono text-[clamp(0.7rem,0.9vw,0.9rem)] uppercase tracking-[0.18em] ${
                              isFirst
                                ? "text-background/80"
                                : "text-foreground/80"
                            }`}
                          >
                            {r.name}
                          </span>
                        )}
                        <span
                          className={`max-w-[44ch] truncate font-serif text-[clamp(1rem,1.7vw,1.5rem)] leading-tight tracking-tight ${
                            isFirst
                              ? "text-background/75"
                              : "text-muted-foreground"
                          }`}
                        >
                          {r.project}
                        </span>
                      </>
                    ) : (
                      <span className="font-serif text-[clamp(1.75rem,4.5vw,4.5rem)] leading-[0.95] tracking-tight text-muted-foreground/40">
                        ▒▒▒▒▒▒▒▒▒
                      </span>
                    )}
                  </div>
                  <div
                    className={`flex flex-col items-end gap-0.5 ${
                      revealed ? "" : "opacity-30"
                    }`}
                  >
                    {revealed && r ? (
                      <>
                        <span
                          className={`font-serif text-[clamp(2rem,5vw,5rem)] leading-none tracking-tight ${
                            isFirst ? "text-background" : "text-foreground"
                          }`}
                        >
                          {r.points}
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.18em] ${
                            isFirst
                              ? "text-background/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          pts
                        </span>
                        <span
                          className={`mt-1 font-mono text-[10px] uppercase tracking-[0.18em] ${
                            isFirst
                              ? "text-background/60"
                              : "text-muted-foreground"
                          }`}
                        >
                          {r.first}·{r.second}·{r.third}
                        </span>
                      </>
                    ) : (
                      <Trophy
                        className="size-[clamp(1.5rem,2.5vw,2.5rem)] text-muted-foreground/30"
                        strokeWidth={1.5}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button
          onClick={reset}
          disabled={stage === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
        >
          <RotateCcw className="size-3" strokeWidth={2} />
          Reset reveal
        </button>
        <button
          onClick={advance}
          disabled={stage >= 3 || !canReveal}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 font-mono text-sm uppercase tracking-[0.18em] text-background transition-opacity disabled:opacity-40"
        >
          <Trophy className="size-4" strokeWidth={2} />
          {stage === 0
            ? "Reveal 3rd place"
            : stage === 1
              ? "Reveal 2nd place"
              : stage === 2
                ? "Reveal 1st place"
                : "All revealed"}
        </button>
      </div>
    </div>
  );
}
