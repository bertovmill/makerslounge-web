/**
 * The viewer's private tags and notes about other members, via
 * `/api/profile-annotations`.
 *
 * Every call is scoped to the signed-in member by the route. There is no way to
 * read anyone else's annotations, and none of these functions take an owner id.
 */

import type { ProfileAnnotation } from "./profile-annotations";

export type { ProfileAnnotation } from "./profile-annotations";

/** All of my annotations, or just the one about `profileId`. Returns [] on failure. */
export async function fetchMyAnnotations(profileId?: string): Promise<ProfileAnnotation[]> {
  const qs = profileId ? `?profileId=${encodeURIComponent(profileId)}` : "";
  try {
    const res = await fetch(`/api/profile-annotations${qs}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: ProfileAnnotation[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[profile-annotations] unreachable:", err);
    return [];
  }
}

export interface SaveAnnotationResult {
  success: boolean;
  data?: ProfileAnnotation;
  error?: string;
}

/**
 * Replace my tags and note about `profileId`. Sending empty tags and an empty note
 * deletes the row, so "clear everything" and "delete" are the same call.
 */
export async function saveAnnotation(input: {
  profileId: string;
  tags: string[];
  note: string | null;
}): Promise<SaveAnnotationResult> {
  try {
    const res = await fetch("/api/profile-annotations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: ProfileAnnotation | null;
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false, error: body.detail || body.error || "save_failed" };
    return { success: true, data: body.data ?? undefined };
  } catch (err) {
    console.error("[profile-annotations] save failed:", err);
    return { success: false, error: "save_failed" };
  }
}
