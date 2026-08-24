import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { getDb, podcastGuests, podcasts, profiles } from "../lib/db";
import { formatProfile } from "../lib/format";

export default defineTool({
  description:
    "Search published podcast episodes by keyword. Matches against title, description, and transcript. Use this to find podcast episodes on a topic or featuring a specific person. Returns episode info along with guest profiles.",
  inputSchema: z.object({
    query: z.string().describe("Search keyword — topic, person name, or subject"),
  }),
  async execute({ query }) {
    const db = getDb();
    const searchTerm = `%${query}%`;

    const data = await db
      .select({
        id: podcasts.id,
        title: podcasts.title,
        slug: podcasts.slug,
        description: podcasts.description,
        audio_url: podcasts.audioUrl,
        duration_seconds: podcasts.durationSeconds,
        episode_number: podcasts.episodeNumber,
        published_at: podcasts.publishedAt,
      })
      .from(podcasts)
      .where(
        and(
          eq(podcasts.isPublished, true),
          or(
            ilike(podcasts.title, searchTerm),
            ilike(podcasts.description, searchTerm),
            ilike(podcasts.transcript, searchTerm),
          ),
        ),
      )
      .orderBy(desc(podcasts.publishedAt))
      .limit(10);

    if (data.length === 0) {
      return { results: [], message: "No podcast episodes found matching that query" };
    }

    // Guests for all episodes in one join, rather than two queries per episode.
    const guestRows = await db
      .select({
        podcastId: podcastGuests.podcastId,
        id: profiles.id,
        name: profiles.name,
        username: profiles.username,
        bio: profiles.bio,
        skills: profiles.skills,
        photo_url: profiles.photoUrl,
      })
      .from(podcastGuests)
      .innerJoin(profiles, eq(profiles.id, podcastGuests.profileId))
      .where(
        inArray(
          podcastGuests.podcastId,
          data.map((d) => d.id),
        ),
      );

    const guestsByPodcast = new Map<string, ReturnType<typeof formatProfile>[]>();
    for (const g of guestRows) {
      const list = guestsByPodcast.get(g.podcastId) ?? [];
      list.push(formatProfile(g));
      guestsByPodcast.set(g.podcastId, list);
    }

    const results = data.map((podcast) => ({
      title: podcast.title,
      description: podcast.description?.slice(0, 300) || null,
      episode_number: podcast.episode_number,
      published_at: podcast.published_at,
      podcast_url: `/podcasts/${podcast.slug}`,
      audio_url: podcast.audio_url,
      duration_seconds: podcast.duration_seconds,
      guests: guestsByPodcast.get(podcast.id) ?? [],
    }));

    return { results, count: results.length };
  },
});
