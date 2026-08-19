import { NextResponse } from "next/server";
import { and, asc, eq, isNull, ne, or, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { conversations, messages, profiles } from "@/db/site/schema";
import { ApiAuthError, requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Messages within one conversation.
 *
 * Replaces the row-owner policies on `messages`, which were reachable from the
 * browser. Membership of the conversation is checked once, up front — a
 * non-participant gets a 404 rather than a 403, because confirming that a thread
 * exists between two other people is itself a disclosure.
 */

type Params = { params: Promise<{ id: string }> };

/** Throws unless the caller is one of the two participants. */
async function requireParticipant(conversationId: string, me: string) {
  const [convo] = await getSiteDb()
    .select({
      id: conversations.id,
      participant1: conversations.participant1,
      participant2: conversations.participant2,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        or(eq(conversations.participant1, me), eq(conversations.participant2, me)),
      ),
    )
    .limit(1);

  if (!convo) throw new ApiAuthError(404, "not_found");
  return convo;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const me = await requireUser();
    const { id } = await params;
    const convo = await requireParticipant(id, me);

    const db = getSiteDb();

    // Snake_cased deliberately: the message components were written against
    // PostgREST's column names and there is no value in renaming them here.
    const rows = await db
      .select({
        id: messages.id,
        conversation_id: messages.conversationId,
        sender_id: messages.senderId,
        content: messages.content,
        read_at: messages.readAt,
        created_at: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.conversationId, id))
      .orderBy(asc(messages.createdAt));

    const otherId = convo.participant1 === me ? convo.participant2 : convo.participant1;
    const [otherUser] = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        photo_url: profiles.photoUrl,
        username: profiles.username,
      })
      .from(profiles)
      .where(eq(profiles.id, otherId))
      .limit(1);

    // Reading the thread marks the other side's messages read. Done here rather
    // than as a second client call so opening a conversation is one round trip.
    await db
      .update(messages)
      .set({ readAt: sql`now()` })
      .where(
        and(
          eq(messages.conversationId, id),
          ne(messages.senderId, me),
          isNull(messages.readAt),
        ),
      );

    return NextResponse.json({
      data: { messages: rows, otherUser: otherUser ?? null },
    });
  } catch (err) {
    return handleApiError(err, "api/conversations/[id]/messages GET");
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const me = await requireUser();
    const { id } = await params;
    await requireParticipant(id, me);

    const { content } = (await request.json()) as { content?: string };
    if (!content || typeof content !== "string" || content.trim() === "") {
      return badRequest("content is required");
    }

    const db = getSiteDb();

    // `sender_id` is the session, never the request — the same forgery the
    // matcher-chat tool allowed.
    const [created] = await db
      .insert(messages)
      .values({ conversationId: id, senderId: me, content: content.trim() })
      .returning({
        id: messages.id,
        conversation_id: messages.conversationId,
        sender_id: messages.senderId,
        content: messages.content,
        read_at: messages.readAt,
        created_at: messages.createdAt,
      });

    await db
      .update(conversations)
      .set({ lastMessageAt: sql`now()` })
      .where(eq(conversations.id, id));

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/conversations/[id]/messages POST");
  }
}
