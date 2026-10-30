import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ArrowUpRight, MapPin, Repeat } from "lucide-react";
import { formatEventDateTile, formatEventDay, formatEventTimes } from "@/lib/events/format";
import {
  getEventBySlugOrId,
  getNextSeriesOccurrence,
  listGuestFirstNames,
  topUpSeriesOccurrences,
} from "@/lib/events/server";
import { RsvpPanel } from "./RsvpPanel";

/**
 * One event's public page, laid out like Luma's: a square cover with the hosts
 * and guests on the left, and on the right the title, when, where, the RSVP
 * card, the description, and a map of the venue.
 *
 * `/events/<series-slug>` (e.g. `/events/makerslounge-saturdays`) redirects to
 * that series' next occurrence, so a weekly event has one link worth sharing.
 */

export const dynamic = "force-dynamic";

const SITE_URL = "https://makerslounge.ca";

// Used when an event has no image of its own: a real MakersLounge co-working afternoon.
const DEFAULT_PHOTO = "/makerslounge-photos/lounge-working.jpeg";

// How many guest faces sit in the "Going" stack before it becomes "+N".
const FACES_SHOWN = 6;

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

/** A small heading with a hairline under it, like Luma's section labels. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-border pb-2 text-sm font-medium text-muted-foreground">{children}</h2>
  );
}

/** "Alice, Bob and 3 others" */
function guestLine(names: string[]) {
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  const rest = names.length - 2;
  return `${names[0]}, ${names[1]} and ${rest} ${rest === 1 ? "other" : "others"}`;
}

// A few warm tints for initials, picked by name so a guest keeps their colour.
const FACE_TINTS = ["bg-sky-100 text-sky-800", "bg-amber-100 text-amber-800", "bg-rose-100 text-rose-800", "bg-emerald-100 text-emerald-800", "bg-violet-100 text-violet-800"];
const tintFor = (name: string) => FACE_TINTS[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % FACE_TINTS.length];

function HostsAndGuests({ guests, ended }: { guests: string[]; ended: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <SectionLabel>Hosted by</SectionLabel>
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-secondary">
            <Image src="/logos/logo.svg" alt="" width={14} height={15} className="dark:hidden" />
            <Image src="/logos/logo-light.svg" alt="" width={14} height={15} className="hidden dark:block" />
          </span>
          <span className="text-sm font-medium">MakersLounge</span>
        </div>
      </section>

      {guests.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionLabel>
            {guests.length} {ended ? "went" : "going"}
          </SectionLabel>
          <div className="flex -space-x-1.5">
            {guests.slice(0, FACES_SHOWN).map((name, i) => (
              <span
                key={i}
                title={name}
                className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-background ${tintFor(name)}`}
              >
                {name[0]?.toUpperCase()}
              </span>
            ))}
            {guests.length > FACES_SHOWN && (
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-semibold text-muted-foreground ring-2 ring-background">
                +{guests.length - FACES_SHOWN}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{guestLine(guests)}</p>
        </section>
      )}
    </div>
  );
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await resolve(slug);

  if (!event) {
    const next = await getNextSeriesOccurrence(slug);
    if (next?.slug) redirect(`/events/${next.slug}`);
    notFound();
  }

  const guests = await listGuestFirstNames(event.id);
  const pageUrl = `${SITE_URL}/events/${event.slug ?? event.id}`;
  const ended = new Date(event.end_time) < new Date();
  const tile = formatEventDateTile(event.start_time);
  const [venue, ...addressParts] = (event.location ?? "").split(",");
  const address = addressParts.join(",").trim();
  const mapsUrl = event.location
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
    : null;
  // Google's keyless embed: no API key, no billing, just the pin.
  const mapEmbedUrl = event.location
    ? `https://maps.google.com/maps?q=${encodeURIComponent(event.location)}&z=15&output=embed`
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

      <div className="mt-5 grid gap-8 md:grid-cols-[20rem_minmax(0,1fr)] md:gap-12">
        {/* Left column: cover, then hosts and guests (those move to the bottom on phones). */}
        <div className="flex flex-col gap-8 md:sticky md:top-8 md:self-start">
          <div
            id="event-cover"
            className="relative aspect-square w-full overflow-hidden rounded-2xl bg-secondary shadow-[var(--shadow-card)]"
          >
            <Image
              src={event.image_url ?? DEFAULT_PHOTO}
              alt=""
              fill
              priority
              // Admin-set image URLs can be on any host, which next/image won't optimise.
              unoptimized={Boolean(event.image_url)}
              sizes="(min-width: 768px) 320px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="hidden md:block">
            <HostsAndGuests guests={guests} ended={ended} />
          </div>
        </div>

        {/* Right column: what, when, where, RSVP, about, map. */}
        <div className="flex min-w-0 flex-col gap-8">
          <section id="event-overview" className="flex flex-col gap-5">
            {event.series_id && (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Repeat className="size-3" /> Every week
              </span>
            )}
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{event.title}</h1>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3.5">
                <span className="flex size-11 shrink-0 flex-col overflow-hidden rounded-lg border border-border text-center">
                  <span className="bg-secondary py-px text-[0.6rem] font-semibold tracking-wider text-muted-foreground">
                    {tile.month}
                  </span>
                  <span className="flex flex-1 items-center justify-center text-base font-semibold leading-none">
                    {tile.day}
                  </span>
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{formatEventDay(event.start_time)}</span>
                  <span className="text-sm text-muted-foreground">{formatEventTimes(event.start_time, event.end_time)}</span>
                </div>
              </div>

              {event.location && (
                <a href="#event-location" className="group flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-border">
                    <MapPin className="size-5 text-muted-foreground" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="inline-flex items-center gap-1 font-medium">
                      {venue}
                      <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                    {address && <span className="truncate text-sm text-muted-foreground">{address}</span>}
                  </div>
                </a>
              )}
            </div>
          </section>

          <section id="rsvp">
            <RsvpPanel event={event} pageUrl={pageUrl} ended={ended} />
          </section>

          {event.description && (
            <section id="about-event" className="flex flex-col gap-4">
              <SectionLabel>About Event</SectionLabel>
              <div className="text-base leading-relaxed text-foreground/85">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: (props) => <p className="mb-4" {...props} />,
                    strong: (props) => <strong className="font-semibold text-foreground" {...props} />,
                    ul: (props) => <ul className="mb-6 list-disc space-y-1.5 pl-5" {...props} />,
                    ol: (props) => <ol className="mb-6 list-decimal space-y-1.5 pl-5" {...props} />,
                    h2: (props) => <h3 className="mb-3 mt-8 text-lg font-semibold tracking-tight text-foreground" {...props} />,
                    h3: (props) => <h4 className="mb-2 mt-6 font-semibold text-foreground" {...props} />,
                    a: (props) => (
                      <a className="underline underline-offset-4 hover:opacity-70" target="_blank" rel="noreferrer" {...props} />
                    ),
                  }}
                >
                  {event.description}
                </ReactMarkdown>
              </div>
            </section>
          )}

          {event.location && (
            <section id="event-location" className="flex scroll-mt-8 flex-col gap-4">
              <SectionLabel>Location</SectionLabel>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{venue}</span>
                  {address && <span className="text-sm text-muted-foreground">{address}</span>}
                </div>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
                  >
                    Directions <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
              {mapEmbedUrl && (
                <div className="overflow-hidden rounded-2xl border border-border bg-secondary">
                  <iframe
                    title={`Map of ${venue}`}
                    src={mapEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="block h-56 w-full sm:h-64"
                  />
                </div>
              )}
            </section>
          )}

          <div className="md:hidden">
            <HostsAndGuests guests={guests} ended={ended} />
          </div>
        </div>
      </div>
    </div>
  );
}
