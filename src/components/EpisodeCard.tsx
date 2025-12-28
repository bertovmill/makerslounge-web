"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PodcastEpisode } from "@/lib/podcast";
import Link from "next/link";

interface EpisodeCardProps {
  episode: PodcastEpisode;
}

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const formattedDate = new Date(episode.publishDate).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const durationText = `${episode.durationMinutes} min`;

  return (
    <Link href={`/podcast/${episode.slug}`}>
      <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Cover image or gradient placeholder */}
        <div className="relative aspect-square bg-gradient-to-br from-rose-400/20 to-orange-400/20">
          {episode.coverImage ? (
            <img
              src={episode.coverImage}
              alt={episode.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-primary/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          )}
          {/* Episode number badge */}
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
            <p className="text-xs font-semibold text-foreground">
              EP {episode.episodeNumber}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {episode.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {episode.description}
          </p>

          {/* Guests */}
          {episode.guests.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              {episode.guests.slice(0, 3).map((guest) => {
                const initials = guest.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={guest.name}
                    className="w-7 h-7 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                  >
                    {guest.photo ? (
                      <img
                        src={guest.photo}
                        alt={guest.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                );
              })}
              <span className="text-xs text-muted-foreground">
                {episode.guests[0].name}
                {episode.guests.length > 1 && ` +${episode.guests.length - 1}`}
              </span>
            </div>
          )}

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span>{durationText}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
