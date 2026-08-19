/**
 * Posts, likes and comments from the browser.
 *
 * `/api/projects` returns each post with its like count, comment count and whether
 * the viewer has liked it. The feed used to assemble that from four separate
 * queries — posts, like counts, the viewer's own likes, then comments — and stitch
 * them together client-side.
 */

export interface FeedAuthor {
  id: string;
  name: string | null;
  photo_url: string | null;
  username: string | null;
}

export interface FeedPost {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
  category: string | null;
  metadata: unknown;
  created_at: string | null;
  profiles: FeedAuthor;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface EngagementComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { id: string; name: string | null; photo_url: string | null } | null;
}

export interface Engagement {
  likeCount: number;
  likedByMe: boolean;
  comments: EngagementComment[];
}

export type EngagementTarget = { type: "project" | "blog_post"; id: string };

/** Posts, newest first. `userId` narrows to one member's posts. */
export async function fetchFeed(opts: { userId?: string; limit?: number } = {}): Promise<FeedPost[]> {
  const params = new URLSearchParams();
  if (opts.userId) params.set("userId", opts.userId);
  if (opts.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();

  try {
    const res = await fetch(`/api/projects${qs ? `?${qs}` : ""}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: FeedPost[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[feed] unreachable:", err);
    return [];
  }
}

export async function createPost(input: {
  title: string;
  description?: string | null;
  media_urls?: string[] | null;
  category?: string | null;
  metadata?: unknown;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: { id: string };
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false, error: body.detail || body.error || "create_failed" };
    return { success: true, id: body.data?.id };
  } catch (err) {
    console.error("[feed] create failed:", err);
    return { success: false, error: "create_failed" };
  }
}

export async function updatePost(
  id: string,
  updates: Record<string, unknown>,
): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    return res.ok;
  } catch (err) {
    console.error("[feed] update failed:", err);
    return false;
  }
}

export async function deletePost(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE", credentials: "include" });
    return res.ok;
  } catch (err) {
    console.error("[feed] delete failed:", err);
    return false;
  }
}

// ---- likes and comments ----------------------------------------------------

export async function fetchEngagement(target: EngagementTarget): Promise<Engagement> {
  const empty: Engagement = { likeCount: 0, likedByMe: false, comments: [] };
  try {
    const res = await fetch(
      `/api/engagement?type=${target.type}&id=${encodeURIComponent(target.id)}`,
      { credentials: "include", cache: "no-store" },
    );
    if (!res.ok) return empty;
    const body = (await res.json()) as { data: Engagement };
    return body.data ?? empty;
  } catch (err) {
    console.error("[engagement] unreachable:", err);
    return empty;
  }
}

async function engagementAction(payload: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error("[engagement] action failed:", err);
    return false;
  }
}

export function likeTarget(target: EngagementTarget) {
  return engagementAction({ action: "like", ...target });
}

export function unlikeTarget(target: EngagementTarget) {
  return engagementAction({ action: "unlike", ...target });
}

export async function addComment(
  target: EngagementTarget,
  content: string,
): Promise<{ id: string; created_at: string } | null> {
  try {
    const res = await fetch("/api/engagement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ action: "comment", ...target, content }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: { id: string; created_at: string } };
    return body.data;
  } catch (err) {
    console.error("[engagement] comment failed:", err);
    return null;
  }
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/engagement?commentId=${encodeURIComponent(commentId)}`, {
      method: "DELETE",
      credentials: "include",
    });
    return res.ok;
  } catch (err) {
    console.error("[engagement] delete comment failed:", err);
    return false;
  }
}
