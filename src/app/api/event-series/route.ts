import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { eventSeries } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { EVENT_TIMEZONE, slugify } from "@/lib/events/format";
import { topUpSeriesOccurrences } from "@/lib/events/server";

/**
 * Weekly event series. Admin-only.
 *
 * Creating a series immediately materialises its next `weeks_ahead` weeks of
 * occurrences as ordinary events, each with its own page and RSVPs.
 */

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET() {
  try {
    await requireAdmin();
    const rows = await getSiteDb().select().from(eventSeries).orderBy(asc(eventSeries.createdAt));
    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/event-series GET");
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const weekday = Number(body.weekday);
    const start = String(body.start_local ?? "");
    const end = String(body.end_local ?? "");
    const startsOn = String(body.starts_on ?? "");
    const capacity = body.capacity ? Number(body.capacity) : null;

    if (!title) return badRequest("title is required");
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return badRequest("weekday must be 0 (Sun) to 6 (Sat)");
    if (!TIME.test(start) || !TIME.test(end) || end <= start) return badRequest("start and end must be HH:MM, end after start");
    if (!DATE.test(startsOn)) return badRequest("starts_on must be YYYY-MM-DD");
    if (capacity !== null && (!Number.isInteger(capacity) || capacity < 1)) return badRequest("capacity must be a positive whole number");

    const [created] = await getSiteDb()
      .insert(eventSeries)
      .values({
        slug: (typeof body.slug === "string" && slugify(body.slug)) || slugify(title),
        title,
        description: typeof body.description === "string" ? body.description : null,
        location: typeof body.location === "string" ? body.location : null,
        weekday,
        startLocal: start,
        endLocal: end,
        timezone: EVENT_TIMEZONE,
        startsOn,
        capacity,
        createdBy: adminId,
      })
      .returning({ id: eventSeries.id, slug: eventSeries.slug });

    await topUpSeriesOccurrences({ force: true });
    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/event-series POST");
  }
}
