"use client";

import { useCallback, useEffect, useState } from "react";

const QR_URL = "https://makerslounge.ca/hackathons/mulerun/vote";
const POLL_MS = 4000;

export default function SlideVote() {
  const [voteCount, setVoteCount] = useState<number>(0);
  const [demoCount, setDemoCount] = useState<number>(0);

  const load = useCallback(async () => {
    try {
      const [votesRes, demosRes] = await Promise.all([
        fetch("/api/mulerun/votes", { cache: "no-store" }),
        fetch("/api/mulerun/demos", { cache: "no-store" }),
      ]);
      if (votesRes.ok) {
        const body = await votesRes.json();
        if (typeof body.vote_count === "number") setVoteCount(body.vote_count);
      }
      if (demosRes.ok) {
        const body = await demosRes.json();
        if (Array.isArray(body.demos)) setDemoCount(body.demos.length);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(
    QR_URL
  )}`;

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] gap-[clamp(1rem,3vh,2rem)]">
      <div className="flex items-center justify-end gap-4">
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span>
            <span className="text-foreground">{voteCount}</span> votes
          </span>
          <span>
            <span className="text-foreground">{demoCount}</span> teams
          </span>
        </div>
      </div>

      <div className="grid items-center gap-[clamp(1.5rem,4vw,4rem)] lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-[clamp(0.75rem,2vh,1.5rem)]">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Vote
          </span>
          <h2 className="font-serif text-[clamp(2.75rem,9vw,9rem)] leading-[0.9] tracking-tight">
            Pick your top 3 demos.
          </h2>
          <p className="max-w-[36ch] font-serif text-[clamp(1.25rem,2.4vw,2.25rem)] leading-tight tracking-tight text-muted-foreground">
            1st choice = 3 pts. 2nd = 2 pts. 3rd = 1 pt.
          </p>
          <ul className="mt-2 flex flex-col gap-1.5 font-mono text-[clamp(0.7rem,0.9vw,0.9rem)] uppercase tracking-[0.18em] text-muted-foreground">
            <li>· Scan the code →</li>
            <li>· Tap three teams in order</li>
            <li>· Hit submit before Berto kills the slide</li>
          </ul>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Scan to vote
          </span>
          <div className="rounded-2xl border border-border bg-white p-[clamp(0.5rem,1.2vw,1rem)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="Scan to vote on Mulerun demos"
              width={420}
              height={420}
              className="h-[clamp(12rem,20vw,20rem)] w-[clamp(12rem,20vw,20rem)] object-contain"
            />
          </div>
          <span className="font-mono text-[10px] tracking-tight text-foreground">
            makerslounge.ca/hackathons/mulerun/vote
          </span>
        </div>
      </div>

      <div className="flex items-baseline justify-between border-t border-border pt-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>Live count</span>
        <span className="font-serif text-[clamp(2rem,5vw,4rem)] leading-none tracking-tight text-foreground">
          {voteCount}
          <span className="ml-2 align-baseline font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            in
          </span>
        </span>
      </div>
    </div>
  );
}
