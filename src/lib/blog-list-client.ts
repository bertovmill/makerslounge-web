import type { BlogPost, BlogPostRow } from "./blog-types";

/**
 * Blog listings from the browser, via `/api/blog`.
 *
 * Separate from `blog-client.ts` (mutations) so a page that only renders posts does not
 * pull the write helpers in with it.
 */

async function list<T>(qs: string): Promise<T[]> {
  try {
    const res = await fetch(`/api/blog${qs}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: T[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[blog] list unreachable:", err);
    return [];
  }
}

/** Published posts, newest first. */
export function fetchPosts(): Promise<BlogPost[]> {
  return list<BlogPost>("");
}

export function fetchFeaturedPosts(): Promise<BlogPost[]> {
  return list<BlogPost>("?featured=1");
}

/** All posts including drafts. Admin only; returns [] otherwise. */
export function fetchAllPostsAdmin(): Promise<BlogPostRow[]> {
  return list<BlogPostRow>("?all=1");
}
