"use client";

import { useRouter } from "next/navigation";
import { Play, Lock } from "lucide-react";
import { rememberPostAuthRedirect } from "@/lib/post-auth-redirect";

interface TalkSignupGateProps {
  slug: string;
  thumbnailUrl: string | null;
  title: string;
}

export default function TalkSignupGate({ slug, thumbnailUrl, title }: TalkSignupGateProps) {
  const router = useRouter();
  const next = `/talks/${slug}`;

  const go = (mode: "signup" | "login") => {
    // Parked in storage as well as the URL so it survives the OAuth round trip.
    rememberPostAuthRedirect(next);
    router.push(`/auth?mode=${mode}&next=${encodeURIComponent(next)}`);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-border aspect-video">
      {thumbnailUrl ? (
        <img src={thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Blur + scrim so the thumbnail reads as "there's a video here" without
          giving the talk away. */}
      <div className="absolute inset-0 backdrop-blur-md bg-background/70" />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-foreground/10">
          <Lock className="h-5 w-5" />
        </span>
        <p className="mb-1 text-base font-semibold">Watch {title}</p>
        <p className="mb-5 max-w-sm text-sm text-muted-foreground">
          This recording is for Makerslounge members. Create a free account to watch.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => go("signup")}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            <Play className="h-4 w-4" />
            Create a free account
          </button>
          <button
            onClick={() => go("login")}
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            I already have one
          </button>
        </div>
      </div>
    </div>
  );
}
