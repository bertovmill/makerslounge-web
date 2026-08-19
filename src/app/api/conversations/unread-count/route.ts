import { NextResponse } from "next/server";
import { and, eq, isNull, ne, or, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { conversations, messages } from "@/db/site/schema";
import { ApiAuthError, requireUser } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";

/**
 * Total unread messages for the signed-in member.
 *
 * This is what replaces Supabase Realtime. The navbar and sidebar badges each held
 * a `postgres_changes` subscription on the whole `messages` table and re-counted on
 * every insert — including inserts belonging to other people's conversations, since
 * the subscription had no filter. Neon has no realtime equivalent, and per the
 * migration plan the decision was polling: for an unread badge the difference is
 * imperceptible.
 *
 * Cheap enough to poll: one indexed count, scoped to conversations the caller is
 * part of.
 */
export async function GET() {
  try {
    const me = await requireUser();

    const [row] = await getSiteDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(conversations, eq(conversations.id, messages.conversationId))
      .where(
        and(
          or(eq(conversations.participant1, me), eq(conversations.participant2, me)),
          ne(messages.senderId, me),
          isNull(messages.readAt),
        ),
      );

    return NextResponse.json({ count: row?.count ?? 0 });
  } catch (err) {
    // Signed out is not an error for a badge — report zero and let the caller be
    // ignorant of the distinction.
    if (err instanceof ApiAuthError) return NextResponse.json({ count: 0 });
    return handleApiError(err, "api/conversations/unread-count");
  }
}
