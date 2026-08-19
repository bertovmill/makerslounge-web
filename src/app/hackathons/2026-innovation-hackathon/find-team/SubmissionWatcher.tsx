"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";

const POLL_INTERVAL_MS = 3000;

export default function SubmissionWatcher() {
  const baselineRef = useRef<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;

    let cancelled = false;

    const check = async () => {
      let count: number | null = null;
      try {
        const res = await fetch("/api/hackathon/signups-count", { cache: "no-store" });
        if (!res.ok) return;
        count = ((await res.json()) as { count: number }).count;
      } catch {
        // A failed poll is not worth reporting; the next tick tries again.
        return;
      }
      if (cancelled || count == null || Number.isNaN(count)) return;

      if (baselineRef.current == null) {
        baselineRef.current = count;
        return;
      }

      if (count > baselineRef.current) {
        baselineRef.current = count;
        setSubmitted(true);
      }
    };

    check();
    const id = setInterval(check, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [submitted]);

  if (!submitted) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-start gap-3 rounded-lg border border-foreground/30 bg-foreground/[0.05] px-4 py-3"
    >
      <span className="mt-0.5 flex size-5 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="size-3" strokeWidth={3} />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
          Submission received
        </p>
        <p className="text-sm text-muted-foreground">
          A signup just landed — looks like you&apos;re in. Mack will let you
          know when teams are matched.
        </p>
      </div>
    </div>
  );
}
