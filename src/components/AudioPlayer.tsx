"use client";

import { Card } from "@/components/ui/card";
import PlatformLinks from "@/components/PlatformLinks";
import type { PodcastPlatforms } from "@/lib/podcast";

interface AudioPlayerProps {
  title: string;
  platforms: PodcastPlatforms;
  episodeNumber?: number;
}

export default function AudioPlayer({ title, platforms, episodeNumber }: AudioPlayerProps) {
  // Extract Spotify episode ID from URL if available
  const spotifyEpisodeId = platforms.spotify
    ? extractSpotifyId(platforms.spotify)
    : null;

  return (
    <Card className="glass-card p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          {episodeNumber && `Episode ${episodeNumber}: `}
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose your preferred platform to listen
        </p>
      </div>

      {/* Spotify Embed (if available) */}
      {spotifyEpisodeId && (
        <div className="rounded-xl overflow-hidden">
          <iframe
            src={`https://open.spotify.com/embed/episode/${spotifyEpisodeId}?utm_source=generator&theme=0`}
            width="100%"
            height="232"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-xl"
          />
        </div>
      )}

      {/* Platform Links */}
      <PlatformLinks platforms={platforms} />
    </Card>
  );
}

// Helper function to extract Spotify episode ID from URL
function extractSpotifyId(url: string): string | null {
  try {
    // Handle Spotify URLs in format:
    // https://open.spotify.com/episode/EPISODE_ID
    // https://open.spotify.com/show/SHOW_ID
    const match = url.match(/episode\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
