import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { eventRsvps } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * An event's guest list. Admin-only: this is the one place guests' emails are
 * readable. The public API only ever returns a count.
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
        profile_id: eventRsvps.profileId,
        created_at: eventRsvps.createdAt,
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
