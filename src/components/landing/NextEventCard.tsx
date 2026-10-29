import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { LUMA_CALENDAR_URL, type LumaSummary } from "@/lib/luma-events";
import { cn } from "@/lib/utils";

const TZ = "America/Toronto";

export function formatEventDate(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleString("en-US", { month: "short", timeZone: TZ }),
    day: d.toLocaleString("en-US", { day: "numeric", timeZone: TZ }),
    when: d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: TZ,
    }),
  };
}

interface NextEventCardProps {
  /** `undefined` while loading, `null` if the Luma feed couldn't be read. */
  summary: LumaSummary | null | undefined;
  /** `glass` sits on the hero photo; `surface` sits on the page. */
  tone: "glass" | "surface";
  className?: string;
}

/**
 * The next MakersLounge event (our own `/events/<slug>` pages first, Luma for
 * older ones), or the latest one when nothing is scheduled yet. Never invents a date: with no feed it just points at Luma.
 */
export function NextEventCard({ summary, tone, className }: NextEventCardProps) {
  const glass = tone === "glass";
  const muted = glass ? "text-white/60" : "text-muted-foreground";
  const shell = cn(
    "rounded-3xl border p-5",
    glass
      ? "allow-blur border-white/15 bg-white/10 text-white backdrop-blur-xl"
      : "border-border bg-card text-foreground shadow-[var(--shadow-card)]",
    className,
  );
  const button = cn(
    "mt-5 flex w-full items-center justify-center gap-1.5 rounded-full py-2.5 text-sm font-medium transition-opacity hover:opacity-85",
    glass ? "bg-white text-neutral-950" : "bg-foreground text-background",
  );

  if (summary === undefined) {
    return (
      <div className={shell} aria-busy="true">
        <div className={cn("h-3 w-24 animate-pulse rounded-full", glass ? "bg-white/15" : "bg-muted")} />
        <div className="mt-4 flex gap-4">
          <div className={cn("h-14 w-14 shrink-0 animate-pulse rounded-2xl", glass ? "bg-white/15" : "bg-muted")} />
          <div className="flex-1 space-y-2 pt-1">
            <div className={cn("h-4 w-4/5 animate-pulse rounded-full", glass ? "bg-white/15" : "bg-muted")} />
            <div className={cn("h-3 w-3/5 animate-pulse rounded-full", glass ? "bg-white/15" : "bg-muted")} />
          </div>
        </div>
        <div className={cn("mt-5 h-10 animate-pulse rounded-full", glass ? "bg-white/15" : "bg-muted")} />
      </div>
    );
  }

  const event = summary?.next ?? summary?.latest ?? null;

  if (!summary || !event) {
    return (
      <div className={shell}>
        <p className={cn("text-xs font-medium", muted)}>Events</p>
        <p className="mt-3 font-display text-lg font-semibold leading-snug">
          Meetups, hackathons, and workshops across Toronto
        </p>
        <a href={LUMA_CALENDAR_URL} target="_blank" rel="noopener noreferrer" className={button}>
          See upcoming events
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const upcoming = Boolean(summary.next);
  const date = formatEventDate(event.start);
  const since = summary.since ? new Date(summary.since).getFullYear() : null;

  return (
    <div className={shell}>
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="inline-flex items-center gap-2 font-medium">
          {upcoming && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4F9BFF] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4F9BFF]" />
            </span>
          )}
          {upcoming ? "Next up" : "Latest event"}
        </span>
        {since && (
          <span className={muted}>
            {summary.total} events since {since}
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--blue-core)] text-white">
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{date.month}</span>
          <span className="text-xl font-semibold leading-none">{date.day}</span>
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 font-display text-base font-semibold leading-snug">{event.title}</p>
          <p className={cn("mt-1 text-sm", muted)}>
            {date.when}
            {event.venue && ` · ${event.venue}`}
          </p>
        </div>
      </div>

      {upcoming && event.url.startsWith("/") ? (
        <Link href={event.url} className={button}>
          RSVP
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : (
        <a
          href={upcoming ? event.url : LUMA_CALENDAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={button}
        >
          {upcoming ? "RSVP on Luma" : "See what's next"}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}
