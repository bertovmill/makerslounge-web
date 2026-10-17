"use client";

import { useEffect, useState } from "react";

// Applications close Tue Oct 20, 2026, 11:59 PM EDT = Oct 21, 03:59 UTC.
const APPLICATIONS_CLOSE = new Date("2026-10-21T03:59:00Z");

function remaining(now: number) {
  const totalSeconds = Math.max(0, Math.floor((APPLICATIONS_CLOSE.getTime() - now) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    closed: totalSeconds === 0,
  };
}

export default function ApplyCountdown() {
  // Null until mounted, so the server render and first client render agree.
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const t = now === null ? null : remaining(now);

  if (t?.closed) {
    return (
      <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
        Applications are closed
      </p>
    );
  }

  const cells = [
    { label: "Days", value: t?.days },
    { label: "Hours", value: t?.hours },
    { label: "Min", value: t?.minutes },
    { label: "Sec", value: t?.seconds },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid w-fit grid-cols-4 gap-x-[clamp(1.25rem,4vw,3rem)]">
        {cells.map((cell) => (
          <div key={cell.label} className="flex flex-col gap-1">
            <span className="font-display text-[clamp(2rem,6vw,4rem)] leading-none tabular-nums tracking-tight">
              {cell.value === undefined ? "--" : cell.value.toString().padStart(2, "0")}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {cell.label}
            </span>
          </div>
        ))}
      </div>
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Until applications close
      </span>
    </div>
  );
}
