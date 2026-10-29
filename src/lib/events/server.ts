import { and, asc, eq, gte, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { events, eventSeries } from "@/db/site/schema";
import type { PublicEvent } from "./format";

/**
 * Server-side reads for in-house events, plus the weekly-series top-up.
 *
 * A series ("every Saturday 11:30 to 3") is stored as a rule in `event_series`
 * and materialised as ordinary `events` rows, `weeks_ahead` weeks out. That way
 * an RSVP, a guest list or an event page never has to know whether the event
 * came from a series.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Throttled per server instance. The insert is idempotent, so running it more
// often than this is harmless, just wasted work on every page view.
const TOP_UP_EVERY_MS = 10 * 60 * 1000;
let lastTopUp = 0;

/**
 * Insert any missing series occurrences up to each series' horizon.
 *
 * Only dates after a series' latest existing occurrence are generated, so an
 * admin deleting one Saturday (a holiday, say) doesn't see it come back. The
 * local wall-clock time is converted per date with `AT TIME ZONE`, which keeps
 * 11:30 at 11:30 across a daylight-saving change.
 */
export async function topUpSeriesOccurrences({ force = false } = {}) {
  if (!force && Date.now() - lastTopUp < TOP_UP_EVERY_MS) return;
  lastTopUp = Date.now();

  try {
    await getSiteDb().execute(sql`
      INSERT INTO makerslounge.events
        (title, description, start_time, end_time, location, slug, series_id, capacity, created_by)
      SELECT
        s.title,
        s.description,
        (d::date + s.start_local) AT TIME ZONE s.timezone,
        (d::date + s.end_local) AT TIME ZONE s.timezone,
        s.location,
        s.slug || '-' || to_char(d, 'YYYY-MM-DD'),
        s.id,
        s.capacity,
        s.created_by
      FROM makerslounge.event_series s
      CROSS JOIN LATERAL (
        SELECT GREATEST(
          s.starts_on,
          (now() AT TIME ZONE s.timezone)::date,
          (SELECT (max(e.start_time) AT TIME ZONE s.timezone)::date + 1
             FROM makerslounge.events e WHERE e.series_id = s.id)
        ) AS from_date,
        LEAST(
          COALESCE(s.ends_on, 'infinity'::date),
          (now() AT TIME ZONE s.timezone)::date + s.weeks_ahead * 7
        ) AS to_date
      ) bounds
      CROSS JOIN LATERAL generate_series(
        bounds.from_date::timestamp, bounds.to_date::timestamp, interval '1 day'
      ) AS d
      WHERE extract(dow FROM d) = s.weekday
      ON CONFLICT DO NOTHING
    `);
  } catch (err) {
    // Never take an event page down over the top-up. Reset so the next request retries.
    lastTopUp = 0;
    console.error("[events] series top-up failed:", err);
  }
}

const going = sql<number>`(
  SELECT count(*)::int FROM makerslounge.event_rsvps r WHERE r.event_id = ${events.id}
)`;

const publicColumns = {
  id: events.id,
  slug: events.slug,
  title: events.title,
  description: events.description,
  start_time: events.startTime,
  end_time: events.endTime,
  location: events.location,
  image_url: events.imageUrl,
  event_url: events.eventUrl,
  is_all_day: events.isAllDay,
  capacity: events.capacity,
  series_id: events.seriesId,
  going,
};

/** Events that haven't ended yet, soonest first. */
export async function listUpcomingEvents(): Promise<PublicEvent[]> {
  await topUpSeriesOccurrences();
  return getSiteDb()
    .select(publicColumns)
    .from(events)
    .where(gte(events.endTime, sql`now()`))
    .orderBy(asc(events.startTime));
}

/** Every event, oldest first. The admin list. */
export async function listAllEvents(): Promise<PublicEvent[]> {
  await topUpSeriesOccurrences();
  return getSiteDb().select(publicColumns).from(events).orderBy(asc(events.startTime));
}

/** One event by slug, or by id for events created before slugs existed. */
export async function getEventBySlugOrId(slugOrId: string): Promise<PublicEvent | null> {
  const [row] = await getSiteDb()
    .select(publicColumns)
    .from(events)
    .where(UUID.test(slugOrId) ? eq(events.id, slugOrId) : eq(events.slug, slugOrId))
    .limit(1);
  return row ?? null;
}

/**
 * The next not-yet-ended occurrence of a series, by the series' slug. Lets
 * `/events/makerslounge-saturdays` be a permanent "this week's" link.
 */
export async function getNextSeriesOccurrence(seriesSlug: string): Promise<PublicEvent | null> {
  await topUpSeriesOccurrences();
  const [row] = await getSiteDb()
    .select(publicColumns)
    .from(events)
    .innerJoin(eventSeries, eq(eventSeries.id, events.seriesId))
    .where(and(eq(eventSeries.slug, seriesSlug), gte(events.endTime, sql`now()`)))
    .orderBy(asc(events.startTime))
    .limit(1);
  return row ?? null;
}
