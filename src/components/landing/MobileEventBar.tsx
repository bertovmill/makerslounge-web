import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { LumaSummary } from "@/lib/luma-events";
import { cn } from "@/lib/utils";
import { formatEventDate } from "./NextEventCard";

interface MobileEventBarProps {
  summary: LumaSummary | null | undefined;
  /** Shown once the hero's own buttons have scrolled away. */
  visible: boolean;
}

/**
 * A floating pill on phones that keeps one action in reach while scrolling:
 * RSVP to the next event if one is scheduled, otherwise join.
 */
export function MobileEventBar({ summary, visible }: MobileEventBarProps) {
  const next = summary?.next ?? null;

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "allow-blur fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex items-center justify-between gap-3 rounded-full border border-white/10 bg-neutral-950/85 py-2 pl-5 pr-2 text-white shadow-lg backdrop-blur-xl transition-all duration-300 md:hidden",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <div className="min-w-0 text-sm leading-tight">
        <p className="text-[11px] text-white/60">{next ? `Next up · ${formatEventDate(next.start).when}` : "Toronto's builder community"}</p>
        <p className="truncate font-medium">{next ? next.title : "Build with MakersLounge"}</p>
      </div>
      {next ? (
        <a
          href={next.url}
          target="_blank"
          rel="noopener noreferrer"
          tabIndex={visible ? undefined : -1}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950"
        >
          RSVP
          <ArrowUpRight className="h-4 w-4" />
        </a>
      ) : (
        <Link
          href="/auth?mode=signup"
          tabIndex={visible ? undefined : -1}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950"
        >
          Join free
        </Link>
      )}
    </div>
  );
}
