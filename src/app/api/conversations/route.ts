import { NextResponse } from "next/server";
import { desc, eq, or, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { conversations, messages, profiles } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * The signed-in member's inbox, and starting a new conversation.
 *
 * Replaces the row-owner RLS on `conversations`: every query here is scoped to
 * `participant_1 = me OR participant_2 = me`, so another member's thread is simply
 * not selected.
 *
 * The listing used to run three extra queries per conversation from the browser —
 * the other participant's profile, the last message, and an unread count — so an
 * inbox of fifteen threads was forty-six round trips. It is two queries now.
 */

export interface ConversationPreview {
  id: string;
  otherUser: { id: string; name: string | null; photo_url: string | null };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

export async function GET() {
  try {
    const me = await requireUser();
    const db = getSiteDb();

    // The other participant is whichever column isn't me, so the profile join is
    // on a CASE rather than a fixed column.
    const otherId = sql<string>`case when ${conversations.participant1} = ${me} then ${conversations.participant2} else ${conversations.participant1} end`;

    const rows = await db
      .select({
        id: conversations.id,
        lastMessageAt: conversations.lastMessageAt,
        otherId: sql<string>`${otherId}`,
        otherName: profiles.name,
        otherPhoto: profiles.photoUrl,
        // Correlated subqueries keep this to one statement. At this data volume
        // that is comfortably cheaper than the per-row round trips it replaces.
        lastMessage: sql<string | null>`(
          select m.content from ${messages} m
          where m.conversation_id = ${conversations.id}
          order by m.created_at desc limit 1
        )`,
        lastMessageCreatedAt: sql<string | null>`(
          select m.created_at from ${messages} m
          where m.conversation_id = ${conversations.id}
          order by m.created_at desc limit 1
        )`,
        unreadCount: sql<number>`(
          select count(*)::int from ${messages} m
          where m.conversation_id = ${conversations.id}
            and m.sender_id <> ${me}
            and m.read_at is null
        )`,
      })
      .from(conversations)
      .leftJoin(profiles, eq(profiles.id, otherId))
      .where(or(eq(conversations.participant1, me), eq(conversations.participant2, me)))
      .orderBy(desc(conversations.lastMessageAt));

    const data: ConversationPreview[] = rows.map((r) => ({
      id: r.id,
      otherUser: { id: r.otherId, name: r.otherName, photo_url: r.otherPhoto },
      lastMessage: r.lastMessage,
      // Fall back to the conversation's own timestamp for a thread with no
      // messages yet, which is what the previous code did.
      lastMessageAt: r.lastMessageCreatedAt ?? r.lastMessageAt ?? new Date(0).toISOString(),
      unreadCount: r.unreadCount,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err, "api/conversations GET");
  }
}

/** Find or create the conversation between the caller and `recipientId`. */
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const { recipientId } = (await request.json()) as { recipientId?: string };

    if (!recipientId || typeof recipientId !== "string") {
      return badRequest("recipientId is required");
    }
    if (recipientId === me) return badRequest("You can't message yourself");

    const db = getSiteDb();

    const [recipient] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, recipientId))
      .limit(1);
    if (!recipient) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // The pair is stored ordered so a conversation has one canonical row, which is
    // what `unique_conversation` relies on.
    const [p1, p2] = me < recipientId ? [me, recipientId] : [recipientId, me];

    // Upsert rather than select-then-insert: two clients opening the same thread at
    // once would both miss the select and the second insert would hit the unique
    // index.
    const [convo] = await db
      .insert(conversations)
      .values({ participant1: p1, participant2: p2 })
      .onConflictDoUpdate({
        target: [conversations.participant1, conversations.participant2],
        // A no-op update, present only so the existing row is returned.
        set: { participant1: p1 },
      })
      .returning({ id: conversations.id });

    return NextResponse.json({ data: { id: convo.id } });
  } catch (err) {
    return handleApiError(err, "api/conversations POST");
  }
}
