"use client";

import { useEffect, useState } from "react";

// All times in UTC. Toronto is EDT (UTC-4) during the event.
// Kickoff: May 19, 2026, 8:00 PM EDT = May 20, 2026, 00:00 UTC.
// Submission deadline: May 24, 2026, 11:59 PM EDT = May 25, 2026, 03:59 UTC.
// Demo night: May 26, 2026, 5:30 PM EDT = May 26, 2026, 21:30 UTC.
// Demo night ends: May 26, 2026, 8:30 PM EDT = May 27, 2026, 00:30 UTC.
const KICKOFF = new Date("2026-05-20T00:00:00Z");
const DEADLINE = new Date("2026-05-25T03:59:00Z");
const DEMO_NIGHT = new Date("2026-05-26T21:30:00Z");
const DEMO_END = new Date("2026-05-27T00:30:00Z");

type Phase = "pre-kickoff" | "build-week" | "post-deadline" | "live" | "after";

function getPhase(now: number): { phase: Phase; target: Date | null; label: string } {
  if (now < KICKOFF.getTime()) {
    return { phase: "pre-kickoff", target: KICKOFF, label: "Kickoff in" };
  }
  if (now < DEADLINE.getTime()) {
    return { phase: "build-week", target: DEADLINE, label: "Submissions close in" };
  }
  if (now < DEMO_NIGHT.getTime()) {
    return { phase: "post-deadline", target: DEMO_NIGHT, label: "Doors open in" };
  }
  if (now < DEMO_END.getTime()) {
    return { phase: "live", target: null, label: "Live now" };
  }
  return { phase: "after", target: null, label: "See you next time" };
}

function diff(now: number, target: Date) {
  const ms = target.getTime() - now;
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export default function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { phase, target, label } = getPhase(now);
  const lastHour = phase === "build-week" && target && target.getTime() - now < 24 * 60 * 60 * 1000;

  if (!mounted) {
    return (
      <div className="font-mono text-foreground/40 text-[clamp(4rem,18vw,16rem)] leading-none tabular-nums tracking-tighter">
        --:--:--:--
      </div>
    );
  }

  if (phase === "live") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <span className="relative inline-flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <span className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.95] tracking-tight">
          Demos are running.
        </p>
      </div>
    );
  }

  if (phase === "after" || !target) {
    return (
      <div className="flex flex-col gap-6">
        <span className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
          The week of May 26
        </span>
        <p className="font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.95] tracking-tight">
          That's a wrap.
        </p>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = diff(now, target);

  return (
    <div className="flex flex-col gap-8">
      <span className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <div
        className={
          "font-mono leading-none tabular-nums tracking-tighter text-[clamp(4rem,18vw,16rem)] " +
          (lastHour ? "text-primary" : "text-foreground")
        }
      >
        <span>{pad(days)}</span>
        <span className="text-foreground/30">:</span>
        <span>{pad(hours)}</span>
        <span className="text-foreground/30">:</span>
        <span>{pad(minutes)}</span>
        <span className="text-foreground/30">:</span>
        <span>{pad(seconds)}</span>
      </div>
      <div className="flex gap-[clamp(2rem,6vw,5rem)] font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>Days</span>
        <span>Hours</span>
        <span>Minutes</span>
        <span>Seconds</span>
      </div>
    </div>
  );
}
