import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { connections, profiles } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Connection requests between members.
 *
 * Every query is scoped to `requester_id = me OR recipient_id = me`, which is what
 * the row-owner policies enforced. Both participants' profiles are joined in, so the
 * connections page no longer fetches the rows and then looks up each counterparty.
 *
 *   GET    ?with=<uuid>   just the connection between me and that member, if any
 *   POST   { recipientId }
 *   PATCH  { id, status }  accept or decline a request addressed to me
 *   DELETE ?id=<uuid>      withdraw or remove a connection I'm part of
 */

export async function GET(request: NextRequest) {
  try {
    const me = await requireUser();
    const db = getSiteDb();
    const other = new URL(request.url).searchParams.get("with");

    const mine = or(eq(connections.requesterId, me), eq(connections.recipientId, me))!;

    const scope = other
      ? and(
          mine,
          or(eq(connections.requesterId, other), eq(connections.recipientId, other)),
        )!
      : mine;

    // The counterparty is whichever participant is not the caller. This has to be a
    // SQL CASE: a JS ternary on `eq(...)` would be testing a query-builder object,
    // which is always truthy, so it would silently always pick one column.
    const otherId = sql<string>`case when ${connections.requesterId} = ${me}
      then ${connections.recipientId} else ${connections.requesterId} end`;

    const rows = await db
      .select({
        id: connections.id,
        requester_id: connections.requesterId,
        recipient_id: connections.recipientId,
        status: connections.status,
        created_at: connections.createdAt,
        // Resolved in SQL so the caller does not have to work out which column to
        // look up.
        otherId: profiles.id,
        otherName: profiles.name,
        otherUsername: profiles.username,
        otherPhoto: profiles.photoUrl,
        otherAvatarStyle: profiles.avatarStyle,
        otherBio: profiles.bio,
      })
      .from(connections)
      .leftJoin(profiles, eq(profiles.id, otherId))
      .where(scope)
      .orderBy(desc(connections.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/connections GET");
  }
}

/** Send a connection request. `requester_id` is the session. */
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { recipientId } = (await request.json()) as { recipientId?: string };

    if (!recipientId) return badRequest("recipientId is required");
    if (recipientId === me) return badRequest("You can't connect with yourself");

    const db = getSiteDb();

    // One connection per pair, in either direction. There is no unique constraint
    // covering the unordered pair, so this check is what prevents duplicates —
    // stated rather than assumed.
    const [existing] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(
        or(
          and(eq(connections.requesterId, me), eq(connections.recipientId, recipientId)),
          and(eq(connections.requesterId, recipientId), eq(connections.recipientId, me)),
        ),
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ data: { id: existing.id, existed: true } });
    }

    const [created] = await db
      .insert(connections)
      .values({ requesterId: me, recipientId, status: "pending" })
      .returning({ id: connections.id, status: connections.status });

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/connections POST");
  }
}

/**
 * Accept or decline a request.
 *
 * Only the *recipient* may do this. Previously the client updated by id alone, so
 * whoever sent a request could have accepted it on the other person's behalf.
 */
export async function PATCH(request: Request) {
  try {
    const me = await requireUser();
    const { id, status } = (await request.json()) as { id?: string; status?: string };

    if (!id) return badRequest("id is required");
    if (status !== "accepted" && status !== "declined") {
      return badRequest("status must be 'accepted' or 'declined'");
    }

    const [updated] = await getSiteDb()
      .update(connections)
      .set({ status, updatedAt: new Date().toISOString() })
      .where(and(eq(connections.id, id), eq(connections.recipientId, me)))
      .returning({ id: connections.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/connections PATCH");
  }
}

/** Withdraw or remove a connection. Either participant may. */
export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return badRequest("id is required");

    const [deleted] = await getSiteDb()
      .delete(connections)
      .where(
        and(
          eq(connections.id, id),
          or(eq(connections.requesterId, me), eq(connections.recipientId, me)),
        ),
      )
      .returning({ id: connections.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/connections DELETE");
  }
}
