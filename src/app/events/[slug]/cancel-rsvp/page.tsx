import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eventPath, formatEventDay, formatEventTimes } from "@/lib/events/format";
import { getRsvpByCancelToken } from "@/lib/events/server";
import { CancelRsvpButton } from "./CancelRsvpButton";

/**
 * Where the "Cancel your RSVP" link in RSVP emails lands:
 * `/events/<slug>/cancel-rsvp?token=<cancel token>`.
 *
 * Opening the link only shows what would be cancelled. The cancel itself is a
 * button press, because mail scanners and link previews fetch every link in an
 * email, and a GET that cancelled would quietly drop guests' RSVPs.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cancel RSVP · MakersLounge",
  robots: { index: false, follow: false },
};

export default async function CancelRsvpPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const found = token ? await getRsvpByCancelToken(token) : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-10 md:py-16">
      <Link
        href="/events"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        All events
      </Link>

      <section
        id="cancel-rsvp"
        className="mt-4 flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"
      >
        {found ? (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Cancel your RSVP?</h1>
              <p className="text-muted-foreground">
                {found.rsvp.name.split(/\s+/)[0]}, this frees your spot for someone else.
              </p>
            </div>
            <div className="rounded-2xl bg-secondary p-4">
              <p className="font-semibold">{found.event.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatEventDay(found.event.start_time)}, {formatEventTimes(found.event.start_time, found.event.end_time)}
              </p>
              {found.event.location && <p className="text-sm text-muted-foreground">{found.event.location}</p>}
            </div>
            <CancelRsvpButton eventId={found.event.id} token={token!} eventHref={eventPath(found.event)} />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">Nothing to cancel</h1>
            <p className="text-muted-foreground">
              This RSVP was already cancelled, or the link is incomplete. If you copied it from an email, make sure
              you got the whole link.
            </p>
            <Link href="/events" className="text-sm font-medium underline underline-offset-4">
              See upcoming events
            </Link>
          </>
        )}
      </section>
    </div>
  );
}
