import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";

/**
 * Every MakersLounge event with its turnout, plus community totals. Admin-only,
 * and built for Cael (Berto's agent), which reads it with its admin token.
 *
 * `GET /api/admin/events?when=upcoming|past|all&limit=20`
 *
 * Two sources, one list. `source: "site"` is an in-house event (`events`, RSVPs
 * in `event_rsvps`); `source: "luma"` is a past Luma event imported into
 * `luma_events` / `luma_event_guests`, where only `status = 'approved'` counts
 * as an RSVP (most rows are invitees). Site check-ins are taken at the door on
 * `/admin/events/<id>/guests` (`event_rsvps.checked_in_at`, since Nov 2026);
 * a site event's `rsvps` includes walk-ins, and `walk_ins` says how many.
 *
 * Counts only; guest names and emails stay at `/api/events/<id>/rsvps`.
 * Read-only: it skips the series top-up that public reads run, so it never writes.
 */

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const params = new URL(request.url).searchParams;
    const when = params.get("when") ?? "upcoming";
    const limit = Math.min(Math.max(Number(params.get("limit")) || 20, 1), 100);
    const db = getSiteDb();

    // Upcoming = hasn't ended yet, soonest first; past = ended, latest first.
    // A Luma event with no end time counts as ended once it has started.
    const filter =
      when === "past" ? sql`WHERE end_time < now()` : when === "all" ? sql`` : sql`WHERE end_time >= now()`;
    const order = when === "upcoming" ? sql`ORDER BY start_time ASC` : sql`ORDER BY start_time DESC`;

    const events = await db.execute(sql`
      SELECT source, id, slug, title,
             to_char(start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS start_time,
             to_char(end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
             location, capacity, series_slug, url, rsvps, check_ins, walk_ins
      FROM (
        SELECT 'site' AS source, e.id::text AS id, e.slug, e.title, e.start_time,
               e.end_time, e.location, e.capacity, s.slug AS series_slug,
               'https://makerslounge.ca/events/' || coalesce(e.slug, e.id::text) AS url,
               (SELECT count(*)::int FROM makerslounge.event_rsvps r WHERE r.event_id = e.id) AS rsvps,
               (SELECT count(r.checked_in_at)::int FROM makerslounge.event_rsvps r WHERE r.event_id = e.id) AS check_ins,
               (SELECT count(*) FILTER (WHERE r.walk_in)::int FROM makerslounge.event_rsvps r WHERE r.event_id = e.id) AS walk_ins
        FROM makerslounge.events e
        LEFT JOIN makerslounge.event_series s ON s.id = e.series_id
        UNION ALL
        SELECT 'luma', l.id::text, NULL, l.name, l.starts_at,
               coalesce(l.ends_at, l.starts_at), l.location, NULL, NULL, l.luma_url,
               count(*) FILTER (WHERE g.status = 'approved')::int,
               count(g.checked_in_at)::int,
               NULL::int
        FROM makerslounge.luma_events l
        LEFT JOIN makerslounge.luma_event_guests g ON g.luma_event_id = l.id
        GROUP BY l.id
      ) all_events
      ${filter} ${order}
      LIMIT ${limit}
    `);

    const [totals] = (
      await db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM makerslounge.profiles) AS members,
          (SELECT count(*)::int FROM makerslounge.events WHERE end_time < now()) AS site_events_run,
          (SELECT count(*)::int FROM makerslounge.events WHERE end_time >= now()) AS events_upcoming,
          (SELECT count(*)::int FROM makerslounge.event_rsvps) AS site_rsvps,
          (SELECT count(*)::int FROM makerslounge.event_rsvps WHERE checked_in_at IS NOT NULL) AS site_check_ins,
          (SELECT count(*)::int FROM makerslounge.event_rsvps WHERE walk_in) AS site_walk_ins,
          (SELECT count(*)::int FROM makerslounge.luma_events) AS luma_events,
          (SELECT count(*)::int FROM makerslounge.luma_event_guests WHERE status = 'approved') AS luma_rsvps,
          (SELECT count(*)::int FROM makerslounge.luma_event_guests WHERE checked_in_at IS NOT NULL) AS luma_check_ins,
          (SELECT count(DISTINCT lower(email))::int FROM makerslounge.luma_event_guests WHERE status = 'approved') AS luma_people_registered,
          (SELECT count(DISTINCT lower(email))::int FROM makerslounge.luma_event_guests WHERE checked_in_at IS NOT NULL) AS luma_people_checked_in
      `)
    ).rows as Record<string, number>[];

    return NextResponse.json({
      totals: {
        ...totals,
        events_run: totals.site_events_run + totals.luma_events,
        rsvps_total: totals.site_rsvps + totals.luma_rsvps,
        check_ins: totals.site_check_ins + totals.luma_check_ins,
      },
      events: events.rows,
    });
  } catch (err) {
    return handleApiError(err, "api/admin/events GET");
  }
}
