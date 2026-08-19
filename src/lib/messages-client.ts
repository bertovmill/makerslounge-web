/**
 * Messaging from the browser, via `/api/conversations`.
 *
 * Replaces both the direct `supabase.from("conversations" | "messages")` calls and
 * the four Supabase Realtime subscriptions. There is no realtime on Neon, so live
 * updates are polling — see `useUnreadCount` and `POLL_INTERVAL_MS`.
 */

export interface ConversationPreview {
  id: string;
  otherUser: { id: string; name: string | null; photo_url: string | null };
  lastMessage: string | null;
  lastMessageAt: string;
  unreadCount: number;
}

/** Snake_cased to match what the message components already render. */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ThreadOtherUser {
  id: string;
  name: string | null;
  photo_url: string | null;
  username: string | null;
}

/**
 * How often the inbox and the unread badges re-check.
 *
 * 15s is a deliberate compromise: Realtime was instant, and anything much longer
 * makes a live conversation feel broken, while anything much shorter is a lot of
 * requests for a number that rarely changes. The open thread polls faster — see
 * `THREAD_POLL_INTERVAL_MS`.
 */
export const POLL_INTERVAL_MS = 15_000;

/** An open conversation is being read right now, so it refreshes more eagerly. */
export const THREAD_POLL_INTERVAL_MS = 5_000;

export async function fetchConversations(): Promise<ConversationPreview[]> {
  try {
    const res = await fetch("/api/conversations", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ConversationPreview[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[messages] inbox unreachable:", err);
    return [];
  }
}

/** Find or create the conversation with `recipientId`. Returns its id. */
export async function startConversation(recipientId: string): Promise<string | null> {
  try {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ recipientId }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: { id: string } };
    return body.data.id;
  } catch (err) {
    console.error("[messages] startConversation failed:", err);
    return null;
  }
}

/**
 * Messages in a thread, plus the other participant.
 *
 * Fetching also marks the other side's messages as read, which is what the page
 * did separately before.
 */
export async function fetchThread(
  conversationId: string,
): Promise<{ messages: Message[]; otherUser: ThreadOtherUser | null } | null> {
  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      data: { messages: Message[]; otherUser: ThreadOtherUser | null };
    };
    return body.data;
  } catch (err) {
    console.error("[messages] thread unreachable:", err);
    return null;
  }
}

export async function sendMessage(
  conversationId: string,
  content: string,
): Promise<Message | null> {
  try {
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: Message };
    return body.data;
  } catch (err) {
    console.error("[messages] send failed:", err);
    return null;
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch("/api/conversations/unread-count", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return 0;
    const body = (await res.json()) as { count: number };
    return body.count ?? 0;
  } catch {
    // A badge is not worth a console error on every failed poll.
    return 0;
  }
}

/** Report or block another member. Both are fire-and-forget from the UI's view. */
export async function moderateUser(
  action: "report" | "block",
  targetUserId: string,
  extra: { reason?: string; details?: string | null } = {},
): Promise<boolean> {
  try {
    const res = await fetch("/api/moderation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action, targetUserId, ...extra }),
    });
    return res.ok;
  } catch (err) {
    console.error("[moderation] failed:", err);
    return false;
  }
}
