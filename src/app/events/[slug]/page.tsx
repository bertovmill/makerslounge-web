import type { Metadata } from "next";
import Image from "next/image";
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

// Used when an event has no image of its own: a real MakersLounge co-working afternoon.
const DEFAULT_PHOTO = "/makerslounge-photos/lounge-working.jpeg";

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
    <div className="mx-auto max-w-5xl px-4 py-6 pb-24 md:py-8">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All events
      </Link>

      {/* A real event photo under a dark scrim, like the landing hero. */}
      <section
        id="event-hero"
        className="relative isolate mt-4 flex min-h-[18rem] flex-col justify-end overflow-hidden rounded-3xl bg-neutral-950 p-6 text-white sm:min-h-[22rem] sm:p-8"
      >
        <Image
          src={event.image_url ?? DEFAULT_PHOTO}
          alt=""
          fill
          priority
          // Admin-set image URLs can be on any host, which next/image won't optimise.
          unoptimized={Boolean(event.image_url)}
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="-z-10 object-cover object-[center_60%]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-black/85 via-black/40 to-black/30" />

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="allow-blur inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F9BFF]" />
            {formatEventDay(event.start_time)}
          </span>
          {event.series_id && (
            <span className="allow-blur rounded-full border border-white/20 bg-white/10 px-3 py-1 text-white/90 backdrop-blur-md">
              Every week
            </span>
          )}
        </div>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1] tracking-[-0.04em] sm:text-6xl">
          {event.title}
        </h1>
        <p className="mt-3 text-base text-white/75 sm:text-lg">
          {formatEventTimes(event.start_time, event.end_time)}
          {event.location && ` · ${event.location.split(",")[0]}`}
        </p>
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_22rem] md:gap-10">
        <section id="event-details" className="min-w-0">
          {event.location && (
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                <MapPin className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="font-medium">{event.location.split(",")[0]}</span>
                <span className="text-sm text-muted-foreground">{event.location.split(",").slice(1).join(",").trim()}</span>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                >
                  Map <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          )}

          {event.description && (
            <div className="mt-8 text-base leading-relaxed text-foreground/85">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: (props) => <p className="mb-4" {...props} />,
                  strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                  ul: (props) => <ul className="mb-6 list-disc space-y-1.5 pl-5" {...props} />,
                  ol: (props) => <ol className="mb-6 list-decimal space-y-1.5 pl-5" {...props} />,
                  h2: (props) => <h2 className="mb-3 mt-8 text-xl font-semibold tracking-tight" {...props} />,
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
