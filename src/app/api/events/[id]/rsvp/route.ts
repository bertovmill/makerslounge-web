import { after, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { eventRsvps } from "@/db/site/schema";
import { optionalUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { sendRsvpConfirmation } from "@/lib/events/emails";
import { getEventBySlugOrId } from "@/lib/events/server";

/**
 * RSVP to an event. Public: name and email, no account needed, like Luma.
 *
 * A repeat RSVP with the same email is a no-op (unique on event + lower(email)),
 * so double-submits and "did it work?" retries never take a second seat. If the
 * guest happens to be signed in, the RSVP is linked to their profile too.
 *
 * A new RSVP gets a confirmation email with the event attached and a cancel
 * link. It is sent after the response, so a slow or failing send never holds
 * up or breaks the RSVP itself. A repeat RSVP sends nothing.
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
      .returning({ id: eventRsvps.id, cancelToken: eventRsvps.cancelToken });

    const [rsvp] = inserted;
    if (rsvp) after(() => sendRsvpConfirmation(event, { name, email, cancelToken: rsvp.cancelToken }));

    return NextResponse.json({
      status: inserted.length ? "going" : "already_going",
      going: event.going + inserted.length,
    });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvp POST");
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Cancel an RSVP from the link in its emails: `DELETE` with `{ token }`. The
 * token is the credential, so no account is needed. Deleting frees the seat,
 * and a second cancel of the same link is a 404, not an error page.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { token?: unknown };
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!UUID.test(token) || !UUID.test(id)) return badRequest("That cancel link isn't valid.");

    const [deleted] = await getSiteDb()
      .delete(eventRsvps)
      .where(and(eq(eventRsvps.eventId, id), eq(eventRsvps.cancelToken, token)))
      .returning({ id: eventRsvps.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ status: "cancelled" });
  } catch (err) {
    return handleApiError(err, "api/events/[id]/rsvp DELETE");
  }
}
