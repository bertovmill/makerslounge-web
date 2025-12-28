export interface PodcastGuest {
  name: string;
  bio?: string;
  photo?: string;
  links?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
}

export interface PodcastPlatforms {
  spotify?: string;
  apple?: string;
  youtube?: string;
  google?: string;
  overcast?: string;
}

export interface PodcastEpisode {
  id: string;
  slug: string;
  episodeNumber: number;
  title: string;
  description: string;
  publishDate: string; // ISO date string
  durationMinutes: number;
  coverImage?: string;
  platforms: PodcastPlatforms;
  guests: PodcastGuest[];
  showNotes: string;
  isFeatured: boolean;
}

// Add your podcast episodes here - they'll automatically display on the podcast page
export const podcastEpisodes: PodcastEpisode[] = [
  // Add episodes here
];

// Helper to get featured episodes
export function getFeaturedEpisodes(): PodcastEpisode[] {
  return podcastEpisodes
    .filter((ep) => ep.isFeatured)
    .sort(
      (a, b) =>
        new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
    );
}

// Helper to get all episodes sorted by date
export function getAllEpisodes(): PodcastEpisode[] {
  return [...podcastEpisodes].sort(
    (a, b) =>
      new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
  );
}

// Helper to get a single episode by slug
export function getEpisodeBySlug(
  slug: string
): PodcastEpisode | undefined {
  return podcastEpisodes.find((ep) => ep.slug === slug);
}
