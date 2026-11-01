import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";

/**
 * Events with their RSVP counts, plus community totals. Admin-only, and built
 * for Cael (Berto's agent), which reads it with its admin token.
 *
 * `GET /api/admin/events?when=upcoming|past|all&limit=20`
 *
 * Check-ins are `null`, not 0: the site has no check-in yet, so show-up is
 * unknown rather than nobody. Counts only; guest names and emails stay at
 * `/api/events/<id>/rsvps`. Read-only: it skips the series top-up that public
 * reads run, so it never writes.
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
    const filter =
      when === "past" ? sql`WHERE e.end_time < now()` : when === "all" ? sql`` : sql`WHERE e.end_time >= now()`;
    const order = when === "upcoming" ? sql`ORDER BY e.start_time ASC` : sql`ORDER BY e.start_time DESC`;

    const events = await db.execute(sql`
      SELECT e.id, e.slug, e.title,
             to_char(e.start_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS start_time,
             to_char(e.end_time AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS end_time,
             e.location, e.capacity, s.slug AS series_slug,
             (SELECT count(*)::int FROM makerslounge.event_rsvps r WHERE r.event_id = e.id) AS rsvps
      FROM makerslounge.events e
      LEFT JOIN makerslounge.event_series s ON s.id = e.series_id
      ${filter} ${order}
      LIMIT ${limit}
    `);

    const [totals] = (
      await db.execute(sql`
        SELECT
          (SELECT count(*)::int FROM makerslounge.profiles) AS members,
          (SELECT count(*)::int FROM makerslounge.events) AS events_total,
          (SELECT count(*)::int FROM makerslounge.events WHERE end_time < now()) AS events_run,
          (SELECT count(*)::int FROM makerslounge.events WHERE end_time >= now()) AS events_upcoming,
          (SELECT count(*)::int FROM makerslounge.event_rsvps) AS rsvps_total,
          (SELECT count(*)::int FROM makerslounge.event_rsvps r
             JOIN makerslounge.events e ON e.id = r.event_id WHERE e.end_time < now()) AS rsvps_past
      `)
    ).rows;

    return NextResponse.json({
      totals: { ...totals, check_ins: null },
      events: events.rows.map((e) => ({
        ...e,
        url: `https://makerslounge.ca/events/${e.slug ?? e.id}`,
        check_ins: null,
      })),
    });
  } catch (err) {
    return handleApiError(err, "api/admin/events GET");
  }
}
