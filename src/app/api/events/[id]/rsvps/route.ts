import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { eventRsvps } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { getEventBySlugOrId } from "@/lib/events/server";

/**
 * An event's guest list. Admin-only: this is the one place guests' emails are
 * readable. The public API only ever returns a count.
 *
 * Also the door: `PATCH` checks a guest in or out, `POST` adds a walk-in.
 * Check-ins are what `GET /api/admin/events` counts as an event's `check_ins`.
 */

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const rows = await getSiteDb()
      .select({
        id: eventRsvps.id,
        name: eventRsvps.name,
        email: eventRsvps.email,
        building: eventRsvps.building,
        profile_id: eventRsvps.profileId,
        created_at: eventRsvps.createdAt,
        checked_in_at: eventRsvps.checkedInAt,
        walk_in: eventRsvps.walkIn,
      })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, id))
      .orderBy(asc(eventRsvps.createdAt));
    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvps GET");
  }
}

/** Remove one guest: `DELETE /api/events/<id>/rsvps?rsvpId=<uuid>`. */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const rsvpId = new URL(request.url).searchParams.get("rsvpId");
    if (!rsvpId) return badRequest("rsvpId is required");

    const [deleted] = await getSiteDb()
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.id, rsvpId), eq(eventRsvps.eventId, id)))
      .returning({ id: eventRsvps.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvps DELETE");
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check a guest in, or undo it: `PATCH { rsvpId, checkedIn: boolean }`.
 * Checking in someone already checked in keeps their original arrival time.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { rsvpId?: unknown; checkedIn?: unknown };
    if (typeof body.rsvpId !== "string") return badRequest("rsvpId is required");
    if (typeof body.checkedIn !== "boolean") return badRequest("checkedIn must be true or false");

    const [row] = await getSiteDb()
      .update(eventRsvps)
      .set({ checkedInAt: body.checkedIn ? sql`coalesce(${eventRsvps.checkedInAt}, now())` : null })
      .where(and(eq(eventRsvps.id, body.rsvpId), eq(eventRsvps.eventId, id)))
      .returning({ id: eventRsvps.id, checked_in_at: eventRsvps.checkedInAt });

    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvps PATCH");
  }
}

/**
 * Add a walk-in at the door, already checked in: `POST { name, email?, building? }`.
 * Walk-ins get no emails at all, and email is optional. If the email already
 * has an RSVP for this event, that guest is checked in instead of duplicated.
 * Capacity isn't enforced: they're already in the room.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { name?: unknown; email?: unknown; building?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const building = typeof body.building === "string" ? body.building.trim() : "";

    if (!name || name.length > 120) return badRequest("Enter the guest's name.");
    if (email && (!EMAIL.test(email) || email.length > 254)) return badRequest("That email doesn't look right.");
    if (building.length > 280) return badRequest("Keep what they're building under 280 characters.");

    const event = await getEventBySlugOrId(id);
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const db = getSiteDb();
    if (email) {
      const [existing] = await db
        .update(eventRsvps)
        .set({ checkedInAt: sql`coalesce(${eventRsvps.checkedInAt}, now())` })
        .where(sql`${eventRsvps.eventId} = ${event.id} AND lower(${eventRsvps.email}) = ${email}`)
        .returning({ id: eventRsvps.id });
      if (existing) return NextResponse.json({ status: "checked_in_existing", data: existing });
    }

    const [row] = await db
      .insert(eventRsvps)
      .values({
        eventId: event.id,
        name,
        email: email || null,
        building: building || null,
        walkIn: true,
        checkedInAt: sql`now()`,
      })
      .returning({ id: eventRsvps.id });
    return NextResponse.json({ status: "walk_in_added", data: row }, { status: 201 });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvps POST");
  }
}
