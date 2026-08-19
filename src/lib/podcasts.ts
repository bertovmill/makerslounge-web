import { uploadToBlob } from "@/lib/upload-client";
import { fetchProfiles } from "@/lib/profiles-client";

/**
 * Podcast reads and writes from the browser, via `/api/podcasts`.
 *
 * Every consumer of this module is a client component, so this stays a fetch layer
 * rather than becoming a Drizzle one — the queries live in the routes.
 *
 * The signatures and result shapes are unchanged, so the admin form, the episode
 * pages and ProfileView keep working as they were.
 */

export interface PodcastRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  transcript: string | null;
  audio_url: string | null;
  video_url: string | null;
  cover_image_url: string | null;
  duration_seconds: number | null;
  episode_number: number | null;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface PodcastGuest {
  id: string;
  name: string | null;
  username: string | null;
  photo_url: string | null;
}

export interface PodcastWithGuests extends PodcastRow {
  guests: PodcastGuest[];
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", ...init });
    if (!res.ok) {
      if (res.status !== 404) console.error(`[podcasts] ${url} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[podcasts] ${url} unreachable:`, err);
    return null;
  }
}

/**
 * Published episodes, guests included.
 *
 * The guests come back with the episodes in a single response. This used to be two
 * queries per episode from the browser — the join rows, then the profiles — so a page
 * of ten episodes was twenty-one round trips.
 */
export async function fetchPublishedPodcasts(): Promise<PodcastWithGuests[]> {
  const body = await getJson<{ data: PodcastWithGuests[] }>("/api/podcasts");
  return body?.data ?? [];
}

/** All episodes including drafts. Admin only; returns [] for anyone else. */
export async function fetchAllPodcasts(): Promise<PodcastWithGuests[]> {
  const body = await getJson<{ data: PodcastWithGuests[] }>("/api/podcasts?all=1");
  return body?.data ?? [];
}

export async function fetchPodcastBySlug(slug: string): Promise<PodcastWithGuests | null> {
  const body = await getJson<{ data: PodcastWithGuests[] }>(
    `/api/podcasts?slug=${encodeURIComponent(slug)}`,
  );
  return body?.data?.[0] ?? null;
}

/** One episode by id, drafts included. Admin only. */
export async function fetchPodcastById(id: string): Promise<PodcastWithGuests | null> {
  const body = await getJson<{ data: PodcastWithGuests }>(`/api/podcasts/${id}`);
  return body?.data ?? null;
}

/** Published episodes a profile is credited on. */
export async function fetchPodcastsByGuest(profileId: string): Promise<PodcastWithGuests[]> {
  const body = await getJson<{ data: PodcastWithGuests[] }>(
    `/api/podcasts?guest=${encodeURIComponent(profileId)}`,
  );
  return body?.data ?? [];
}

export async function createPodcast(data: {
  title: string;
  slug: string;
  description?: string;
  transcript?: string;
  audio_url?: string;
  video_url?: string;
  cover_image_url?: string;
  duration_seconds?: number;
  episode_number?: number;
  is_published: boolean;
  published_at?: string | null;
  // Accepted for call-site compatibility and ignored: the route sets created_by from
  // the session, so an episode cannot be attributed to someone else.
  created_by?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch("/api/podcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = (await res.json().catch(() => ({}))) as {
      data?: PodcastRow;
      error?: string;
      detail?: string;
    };
    if (!res.ok) return { success: false, error: body.detail || body.error || "create_failed" };
    return { success: true, id: body.data?.id };
  } catch (err) {
    console.error("[podcasts] create failed:", err);
    return { success: false, error: "create_failed" };
  }
}

export async function updatePodcast(
  id: string,
  data: Partial<PodcastRow>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/podcasts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    if (!res.ok) return { success: false, error: body.detail || body.error || "update_failed" };
    return { success: true };
  } catch (err) {
    console.error("[podcasts] update failed:", err);
    return { success: false, error: "update_failed" };
  }
}

export async function deletePodcast(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/podcasts/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) return { success: false, error: "delete_failed" };
    return { success: true };
  } catch (err) {
    console.error("[podcasts] delete failed:", err);
    return { success: false, error: "delete_failed" };
  }
}

async function guestAction(podcastId: string, action: "add" | "remove", profileId: string) {
  const res = await fetch(`/api/podcasts/${podcastId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action, profileId }),
  });
  return { error: res.ok ? null : { message: `HTTP ${res.status}` } };
}

export async function addGuest(podcastId: string, profileId: string) {
  return guestAction(podcastId, "add", profileId);
}

export async function removeGuest(podcastId: string, profileId: string) {
  return guestAction(podcastId, "remove", profileId);
}

/** Profile search for guest tagging. */
export async function searchProfiles(query: string): Promise<PodcastGuest[]> {
  if (!query || query.length < 2) return [];
  const rows = await fetchProfiles({ q: query, limit: 5 });
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    username: p.username,
    photo_url: p.photo_url,
  }));
}

/**
 * Episode asset uploads.
 *
 * Keyed by episode rather than by uploader, so the Blob path is derived from the
 * podcast id. The upload route's whitelist is `podcasts/{callerProfileId}/`, so the
 * caller's id is what scopes the write; the episode id is part of the filename.
 */
async function uploadPodcastAsset(
  podcastId: string,
  file: File,
  kind: "audio" | "video" | "cover",
  uploaderProfileId: string,
): Promise<{ url: string | null; error?: string }> {
  try {
    const ext = file.name.split(".").pop() ?? kind;
    const { url } = await uploadToBlob(
      `podcasts/${uploaderProfileId}/${podcastId}-${kind}.${ext}`,
      file,
    );
    return { url };
  } catch (err) {
    console.error(`[podcasts] ${kind} upload failed:`, err);
    return { url: null, error: err instanceof Error ? err.message : "upload failed" };
  }
}

export function uploadPodcastAudio(podcastId: string, file: File, uploaderProfileId: string) {
  return uploadPodcastAsset(podcastId, file, "audio", uploaderProfileId);
}

export function uploadPodcastVideo(podcastId: string, file: File, uploaderProfileId: string) {
  return uploadPodcastAsset(podcastId, file, "video", uploaderProfileId);
}

export function uploadPodcastCover(podcastId: string, file: File, uploaderProfileId: string) {
  return uploadPodcastAsset(podcastId, file, "cover", uploaderProfileId);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  }
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}
