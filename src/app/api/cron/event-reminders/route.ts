import { NextRequest, NextResponse } from "next/server";
import { and, inArray, isNull, lt, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { eventRsvps, events } from "@/db/site/schema";
import { rsvpReminderEmail, sendReminderBatch } from "@/lib/events/emails";
import { EVENT_TIMEZONE, type PublicEvent } from "@/lib/events/format";
import { getEventBySlugOrId } from "@/lib/events/server";

/**
 * Day-before reminders for in-house events. Run daily by Vercel Cron (see
 * `vercel.json`), which calls it with `Authorization: Bearer $CRON_SECRET`.
 *
 * "Tomorrow" is tomorrow in Toronto, whatever time the cron fires. Each RSVP is
 * claimed by setting `reminder_sent_at` before anything is sent, so a retried or
 * overlapping run never emails anyone twice; a failed send releases its claim
 * for the next run. RSVPs made in the last 12 hours are skipped: those guests
 * just got a confirmation with the same details.
 */

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret ? request.headers.get("authorization") !== `Bearer ${secret}` : process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const db = getSiteDb();
    const tomorrowsEvents = db
      .select({ id: events.id })
      .from(events)
      .where(
        sql`(${events.startTime} AT TIME ZONE ${EVENT_TIMEZONE})::date = (now() AT TIME ZONE ${EVENT_TIMEZONE})::date + 1`,
      );

    const claimed = await db
      .update(eventRsvps)
      .set({ reminderSentAt: sql`now()` })
      .where(
        and(
          isNull(eventRsvps.reminderSentAt),
          lt(eventRsvps.createdAt, sql`now() - interval '12 hours'`),
          inArray(eventRsvps.eventId, tomorrowsEvents),
        ),
      )
      .returning({
        id: eventRsvps.id,
        eventId: eventRsvps.eventId,
        name: eventRsvps.name,
        email: eventRsvps.email,
        cancelToken: eventRsvps.cancelToken,
      });

    if (claimed.length === 0) return NextResponse.json({ sent: 0, failed: 0 });

    const eventsById = new Map<string, PublicEvent>();
    for (const eventId of new Set(claimed.map((r) => r.eventId))) {
      const event = await getEventBySlugOrId(eventId);
      if (event) eventsById.set(eventId, event);
    }

    const emails = claimed.flatMap((rsvp) => {
      const event = eventsById.get(rsvp.eventId);
      return event ? [{ rsvpId: rsvp.id, ...rsvpReminderEmail(event, rsvp) }] : [];
    });

    const { sent, failed } = await sendReminderBatch(emails);
    if (failed.length) {
      await db
        .update(eventRsvps)
        .set({ reminderSentAt: null })
        .where(inArray(eventRsvps.id, failed.map((e) => e.rsvpId)));
    }

    return NextResponse.json({ sent, failed: failed.length });
  } catch (err) {
    console.error("[cron/event-reminders]", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
