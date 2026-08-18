import type { BlogPostRow } from "./blog-types";

/**
 * Blog mutations from the browser, via `/api/blog`.
 *
 * These used to call PostgREST directly and let RLS decide. Neon is not reachable
 * from a browser, so each of these is now a fetch to a route that does the
 * equivalent check — see `src/app/api/blog/[id]/route.ts`.
 *
 * The signatures and `{ success, data, error }` result shape are unchanged so the
 * existing callers (BlogPostForm, DeletePostButton, the admin edit page) keep
 * working as they were.
 */

interface MutationResult {
  success: boolean;
  data?: BlogPostRow;
  error?: string;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; detail?: string };
    return body.detail || body.error || fallback;
  } catch {
    return fallback;
  }
}

export async function createPost(post: Partial<BlogPostRow>): Promise<MutationResult> {
  try {
    const res = await fetch("/api/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(post),
    });
    if (!res.ok) return { success: false, error: await readError(res, "Failed to create post") };
    const body = (await res.json()) as { data: BlogPostRow };
    return { success: true, data: body.data };
  } catch (err) {
    console.error("Error creating post:", err);
    return { success: false, error: "Failed to create post" };
  }
}

export async function updatePost(
  id: string,
  updates: Partial<BlogPostRow>,
): Promise<MutationResult> {
  try {
    const res = await fetch(`/api/blog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updates),
    });
    if (!res.ok) return { success: false, error: await readError(res, "Failed to update post") };
    const body = (await res.json()) as { data: BlogPostRow };
    return { success: true, data: body.data };
  } catch (err) {
    console.error("Error updating post:", err);
    return { success: false, error: "Failed to update post" };
  }
}

export async function deletePost(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/blog/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return { success: false, error: await readError(res, "Failed to delete post") };
    return { success: true };
  } catch (err) {
    console.error("Error deleting post:", err);
    return { success: false, error: "Failed to delete post" };
  }
}

/** One post including drafts, for the admin edit form. */
export async function getPostById(id: string): Promise<BlogPostRow | null> {
  try {
    const res = await fetch(`/api/blog/${id}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    const body = (await res.json()) as { data: BlogPostRow };
    return body.data;
  } catch (err) {
    console.error("Error fetching post by ID:", err);
    return null;
  }
}
