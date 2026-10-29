import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { eventRsvps } from "@/db/site/schema";
import { optionalUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { getEventBySlugOrId } from "@/lib/events/server";

/**
 * RSVP to an event. Public: name and email, no account needed, like Luma.
 *
 * A repeat RSVP with the same email is a no-op (unique on event + lower(email)),
 * so double-submits and "did it work?" retries never take a second seat. If the
 * guest happens to be signed in, the RSVP is linked to their profile too.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { name?: unknown; email?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!name || name.length > 120) return badRequest("Please enter your name.");
    if (!EMAIL.test(email) || email.length > 254) return badRequest("Please enter a valid email.");

    const event = await getEventBySlugOrId(id);
    if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (new Date(event.end_time) < new Date()) return badRequest("This event has already happened.");

    const db = getSiteDb();
    const [existing] = await db
      .select({ id: eventRsvps.id })
      .from(eventRsvps)
      .where(sql`${eventRsvps.eventId} = ${event.id} AND lower(${eventRsvps.email}) = ${email}`)
      .limit(1);
    if (existing) {
      return NextResponse.json({ status: "already_going", going: event.going });
    }

    if (event.capacity != null && event.going >= event.capacity) {
      return NextResponse.json({ error: "full", detail: "This event is full." }, { status: 409 });
    }

    const profileId = await optionalUser();
    const inserted = await db
      .insert(eventRsvps)
      .values({ eventId: event.id, name, email, profileId })
      .onConflictDoNothing()
      .returning({ id: eventRsvps.id });

    return NextResponse.json({
      status: inserted.length ? "going" : "already_going",
      going: event.going + inserted.length,
    });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvp POST");
  }
}
