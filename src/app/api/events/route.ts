import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { events } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { eventSlug } from "@/lib/events/format";
import { getEventBySlugOrId, listAllEvents, listUpcomingEvents } from "@/lib/events/server";

/**
 * Site events.
 *
 * Reads are public (`"Anyone can view events"`); create, update and delete were all
 * keyed on the admin email and are now `requireAdmin()`.
 *
 * `created_by` comes from the session rather than the request.
 *
 * GET returns the public shape (`PublicEvent`, snake_case, with a `going`
 * count). It never includes guests' names or emails; those are admin-only at
 * `/api/events/[id]/rsvps`.
 */

const WRITABLE = {
  title: "title",
  description: "description",
  start_time: "startTime",
  end_time: "endTime",
  location: "location",
  image_url: "imageUrl",
  event_url: "eventUrl",
  is_all_day: "isAllDay",
  capacity: "capacity",
} as const;

function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [wire, column] of Object.entries(WRITABLE)) {
    if (wire in body) out[column] = body[wire];
  }
  return out;
}

export async function GET(request: NextRequest) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id");

    if (id) {
      const event = await getEventBySlugOrId(id);
      return NextResponse.json({ data: event ? [event] : [] });
    }

    const rows = params.get("upcoming") ? await listUpcomingEvents() : await listAllEvents();
    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/events GET");
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;
    const values = pick(body);

    // All three are NOT NULL; a missing one used to surface as a database error.
    if (!values.title || !values.startTime || !values.endTime) {
      return badRequest("title, start_time and end_time are required");
    }
    // Two events with the same title on the same day get a short suffix.
    const slug = eventSlug(String(values.title), String(values.startTime));
    const taken = await getEventBySlugOrId(slug);
    values.slug = taken ? `${slug}-${crypto.randomUUID().slice(0, 4)}` : slug;

    const [created] = await getSiteDb()
      .insert(events)
      .values({ ...values, createdBy: adminId } as typeof events.$inferInsert)
      .returning({ id: events.id });

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/events POST");
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = (await request.json()) as Record<string, unknown> & { id?: string };
    if (!body.id) return badRequest("id is required");

    const updates = pick(body);
    if (Object.keys(updates).length === 0) return badRequest("no writable fields provided");
    updates.updatedAt = new Date().toISOString();

    const [updated] = await getSiteDb()
      .update(events)
      .set(updates)
      .where(eq(events.id, body.id))
      .returning({ id: events.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/events PATCH");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("id is required");

    const [deleted] = await getSiteDb()
      .delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/events DELETE");
  }
}
