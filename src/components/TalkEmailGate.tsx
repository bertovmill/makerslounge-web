"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Mail, Loader2 } from "lucide-react";

interface TalkEmailGateProps {
  thumbnailUrl: string | null;
  title: string;
}

/**
 * The email wall in front of a recorded talk.
 *
 * Replaces the account wall this used to be. On success the server has set
 * the access cookie, so `router.refresh()` re-runs the page's server component and
 * the real player takes this component's place — the video id is fetched on the
 * server after the cookie exists, so it never has to be shipped to a locked page
 * and revealed by JS.
 */
export default function TalkEmailGate({ thumbnailUrl, title }: TalkEmailGateProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch("/api/talks/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Something went wrong. Try again?");
        setStatus("error");
        return;
      }

      // Stays in the loading state: refresh() swaps this component out entirely,
      // so flipping back to idle would flash the form again on the way out.
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection?");
      setStatus("error");
    }
  }

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border aspect-video">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Blur + scrim so the thumbnail reads as "there's a video here" without
          giving the talk away. */}
      <div className="absolute inset-0 backdrop-blur-md bg-background/80" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
          <Mail className="h-5 w-5" />
        </span>
        <p className="mb-1 text-base font-semibold">Watch {title}</p>
        <p className="mb-5 max-w-sm text-sm text-muted-foreground">
          Free — just tell us where to reach you. No account needed.
        </p>

        <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="talk-gate-email">
            Email address
          </label>
          <input
            id="talk-gate-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={status === "loading"}
            className="min-w-0 flex-1 rounded-full border border-border bg-background/90 px-4 py-2.5 text-sm outline-none transition-colors focus:border-foreground/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {status === "loading" ? "Unlocking" : "Watch"}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <p className="mt-4 max-w-sm text-xs text-muted-foreground">
          We&apos;ll add you to the Makerslounge list. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
