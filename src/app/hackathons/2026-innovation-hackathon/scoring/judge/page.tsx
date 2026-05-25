"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { JUDGE_SLUGS } from "./[judge]/JudgeScoringClient";

const PASSWORD = "makers2026";
const SESSION_KEY = "hackathon-judge-2026";

const JUDGES: { name: string; slug: string }[] = Object.entries(JUDGE_SLUGS).map(([slug, name]) => ({ slug, name }));

export default function JudgeEntryPage() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => typeof window !== "undefined" && Boolean(sessionStorage.getItem(SESSION_KEY)),
  );
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const submitPassword = () => {
    if (password === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setIsAuthed(true);
    } else {
      setError(true);
      setPassword("");
    }
  };

  const selectJudge = (slug: string) => {
    router.push(`/hackathons/2026-innovation-hackathon/scoring/judge/${slug}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-5">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-2">
            2026 Innovation Hackathon · Demo Night
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Judge scoring</h1>
        </div>

        {!isAuthed ? (
          <div className="flex flex-col gap-3">
            <label className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              placeholder="Enter password"
              className={`w-full rounded-lg border bg-card px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 ${
                error ? "border-red-500/60" : "border-border focus:border-foreground/40"
              }`}
            />
            {error && (
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-red-400">
                Incorrect password
              </p>
            )}
            <button
              onClick={submitPassword}
              className="w-full rounded-lg bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground">
              Select your name
            </p>
            {JUDGES.map(({ name, slug }) => (
              <button
                key={slug}
                onClick={() => selectJudge(slug)}
                className="w-full rounded-xl border border-border bg-card px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary/60 hover:border-foreground/20 active:scale-[0.98]"
              >
                {name}
              </button>
            ))}

            <Link
              href="/hackathons/2026-innovation-hackathon/scoring/results"
              className="w-full rounded-xl border border-border bg-card px-5 py-4 text-center text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              View master results →
            </Link>
          </div>
        )}

        <Link
          href="/hackathons/2026-innovation-hackathon/scoring"
          className="text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← View rubric
        </Link>
      </div>
    </div>
  );
}
