import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUpRight, MapPin } from "lucide-react";
import { formatEventDay, formatEventTimes } from "@/lib/events/format";
import { getEventBySlugOrId, getNextSeriesOccurrence, topUpSeriesOccurrences } from "@/lib/events/server";
import { RsvpPanel } from "./RsvpPanel";

/**
 * One event's public page: what, when, where, and an RSVP form.
 *
 * `/events/<series-slug>` (e.g. `/events/makerslounge-saturdays`) redirects to
 * that series' next occurrence, so a weekly event has one link worth sharing.
 */

export const dynamic = "force-dynamic";

const SITE_URL = "https://makerslounge.ca";

async function resolve(slug: string) {
  await topUpSeriesOccurrences();
  return getEventBySlugOrId(slug);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = await resolve(slug);
  if (!event) return { title: "Event · MakersLounge" };
  const when = `${formatEventDay(event.start_time)}, ${formatEventTimes(event.start_time, event.end_time)}`;
  return {
    title: `${event.title} · ${formatEventDay(event.start_time)}`,
    description: [when, event.location].filter(Boolean).join(" · "),
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await resolve(slug);

  if (!event) {
    const next = await getNextSeriesOccurrence(slug);
    if (next?.slug) redirect(`/events/${next.slug}`);
    notFound();
  }

  const pageUrl = `${SITE_URL}/events/${event.slug ?? event.id}`;
  const ended = new Date(event.end_time) < new Date();
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-10">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-opacity hover:opacity-70"
      >
        <ArrowLeft className="size-3.5" />
        All events
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_20rem] md:gap-12">
        <section id="event-details" className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">{formatEventDay(event.start_time)}</span>
            <span className="h-px w-8 bg-border" />
            <span>{formatEventTimes(event.start_time, event.end_time)}</span>
            {event.series_id && (
              <>
                <span className="h-px w-8 bg-border" />
                <span>Weekly</span>
              </>
            )}
          </div>

          <h1 className="mt-4 font-display text-[clamp(2.25rem,7vw,4.5rem)] leading-[0.95] tracking-tight">
            {event.title}
          </h1>

          {event.location && (
            <div className="mt-6 flex items-start gap-2 text-base">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="flex flex-col gap-1">
                <span>{event.location}</span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
                  >
                    Open in maps <ArrowUpRight className="size-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {event.description && (
            <div className="mt-8 border-t border-border pt-8 text-base leading-relaxed text-foreground/90">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: (props) => <p className="mb-4" {...props} />,
                  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                  ul: (props) => <ul className="mb-4 list-disc space-y-1.5 pl-5" {...props} />,
                  ol: (props) => <ol className="mb-4 list-decimal space-y-1.5 pl-5" {...props} />,
                  h2: (props) => <h2 className="mb-3 mt-8 font-display text-2xl tracking-tight" {...props} />,
                  h3: (props) => <h3 className="mb-2 mt-6 text-lg font-semibold" {...props} />,
                  a: (props) => (
                    <a className="underline underline-offset-4 hover:opacity-70" target="_blank" rel="noreferrer" {...props} />
                  ),
                }}
              >
                {event.description}
              </ReactMarkdown>
            </div>
          )}
        </section>

        <aside id="rsvp" className="md:sticky md:top-8 md:self-start">
          <RsvpPanel event={event} pageUrl={pageUrl} ended={ended} />
        </aside>
      </div>
    </div>
  );
}
