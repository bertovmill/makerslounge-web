import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import { eq, ilike, or, sql } from "drizzle-orm";
import { conversations, getDb, messages as messagesTable, profiles } from "../lib/db";
import { caller } from "../lib/caller";

export default defineTool({
  description:
    "Send an introductory message to a maker to start a conversation. Use when the user explicitly wants to connect with someone. This creates a new conversation thread.",
  inputSchema: z.object({
    recipient_name: z.string().describe("Name of the person to message"),
    message: z
      .string()
      .describe(
        "The intro message to send. Should be warm, mention why they want to connect, and reference something specific from the recipient's profile.",
      ),
  }),
  // The only tool here with an outward-facing side effect: it puts a message in
  // someone else's inbox under the user's name. The route this replaced fired it
  // straight from the model's decision. Approval also makes the send safe under
  // eve's durable replay — an interrupted step re-runs, and a re-run cannot
  // deliver a second copy without a fresh human decision.
  approval: always(),
  async execute({ recipient_name, message }, ctx) {
    const db = getDb();
    const { profileId } = caller(ctx);

    if (!profileId) {
      return { error: "You need to be signed in to send messages." };
    }

    const term = `%${recipient_name}%`;
    const recipients = await db
      .select({ id: profiles.id, name: profiles.name })
      .from(profiles)
      .where(or(ilike(profiles.name, term), ilike(profiles.username, term)))
      .limit(1);

    if (recipients.length === 0) {
      return { error: `Could not find "${recipient_name}" in the community.` };
    }

    const recipientId = recipients[0].id;
    const recipientDisplayName = recipients[0].name || recipient_name;

    if (recipientId === profileId) {
      return { error: "You can't send a message to yourself!" };
    }

    // Find or create the conversation (the table requires participant_1 < participant_2).
    const [p1, p2] =
      profileId < recipientId ? [profileId, recipientId] : [recipientId, profileId];

    // Upsert on the `unique_conversation` constraint rather than
    // select-then-insert: two messages sent at once would otherwise both miss the
    // select and the second insert would fail on the unique index.
    const [convo] = await db
      .insert(conversations)
      .values({ participant1: p1, participant2: p2 })
      .onConflictDoUpdate({
        target: [conversations.participant1, conversations.participant2],
        set: { lastMessageAt: sql`now()` },
      })
      .returning({ id: conversations.id });

    if (!convo) {
      return { error: "Failed to create conversation." };
    }

    try {
      await db.insert(messagesTable).values({
        conversationId: convo.id,
        // From the session, never from the model or the request body.
        senderId: profileId,
        content: message,
      });
    } catch (err) {
      console.error("[send_intro_message] failed to send:", err);
      return { error: "Failed to send message." };
    }

    await db
      .update(conversations)
      .set({ lastMessageAt: sql`now()` })
      .where(eq(conversations.id, convo.id));

    return {
      success: true,
      message: `Message sent to ${recipientDisplayName}! They'll see it in their messages.`,
      conversation_id: convo.id,
    };
  },
});
