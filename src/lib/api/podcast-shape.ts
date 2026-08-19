import { inArray, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { podcastGuests, podcasts, profiles } from "@/db/site/schema";

/**
 * Shared column shape and guest hydration for the podcast routes.
 *
 * Snake_cased because every podcast component was written against PostgREST's
 * column names.
 */
export const podcastColumns = {
  id: podcasts.id,
  title: podcasts.title,
  slug: podcasts.slug,
  description: podcasts.description,
  transcript: podcasts.transcript,
  audio_url: podcasts.audioUrl,
  video_url: podcasts.videoUrl,
  cover_image_url: podcasts.coverImageUrl,
  duration_seconds: podcasts.durationSeconds,
  episode_number: podcasts.episodeNumber,
  is_published: podcasts.isPublished,
  published_at: podcasts.publishedAt,
  created_at: podcasts.createdAt,
  updated_at: podcasts.updatedAt,
  created_by: podcasts.createdBy,
};

export interface PodcastGuest {
  id: string;
  name: string | null;
  username: string | null;
  photo_url: string | null;
}

/**
 * Attach guests to a set of episodes.
 *
 * One query for all of them, rather than the two-per-episode the client used to do
 * — `fetchGuestsForPodcast` looked up the join rows and then the profiles, called in
 * a loop, so listing ten episodes was twenty-one round trips from the browser.
 */
export async function attachGuests<T extends { id: string }>(
  rows: T[],
): Promise<(T & { guests: PodcastGuest[] })[]> {
  if (rows.length === 0) return [];

  const guestRows = await getSiteDb()
    .select({
      podcastId: podcastGuests.podcastId,
      id: profiles.id,
      name: profiles.name,
      username: profiles.username,
      photo_url: profiles.photoUrl,
    })
    .from(podcastGuests)
    .innerJoin(profiles, eq(profiles.id, podcastGuests.profileId))
    .where(
      inArray(
        podcastGuests.podcastId,
        rows.map((r) => r.id),
      ),
    );

  const byPodcast = new Map<string, PodcastGuest[]>();
  for (const g of guestRows) {
    const list = byPodcast.get(g.podcastId) ?? [];
    list.push({ id: g.id, name: g.name, username: g.username, photo_url: g.photo_url });
    byPodcast.set(g.podcastId, list);
  }

  return rows.map((r) => ({ ...r, guests: byPodcast.get(r.id) ?? [] }));
}
