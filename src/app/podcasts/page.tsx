"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import { PodcastWithGuests, fetchPublishedPodcasts, formatDuration } from "@/lib/podcasts";

export default function PodcastsPage() {
  const [podcasts, setPodcasts] = useState<PodcastWithGuests[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedPodcasts().then((data) => {
      setPodcasts(data);
      setLoading(false);
    });
  }, []);

  return (
    <MarketingShell>
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-2">Podcasts</h1>
      <p className="text-muted-foreground mb-8">Conversations with makers and builders.</p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : podcasts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No episodes yet. Stay tuned.</p>
      ) : (
        <div className="space-y-4">
          {podcasts.map((podcast) => (
            <Link
              key={podcast.id}
              href={`/podcasts/${podcast.slug}`}
              className="block rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex gap-4">
                {podcast.cover_image_url && (
                  <img
                    src={podcast.cover_image_url}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {podcast.episode_number && (
                      <span className="text-xs text-muted-foreground font-mono">
                        #{podcast.episode_number}
                      </span>
                    )}
                    {podcast.duration_seconds && (
                      <span className="text-xs text-muted-foreground">
                        {formatDuration(podcast.duration_seconds)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-base font-semibold mb-1 line-clamp-1">{podcast.title}</h2>
                  {podcast.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {podcast.description}
                    </p>
                  )}
                  {podcast.guests.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      {podcast.guests.map((g) => (
                        <span key={g.id} className="text-xs text-muted-foreground">
                          {g.name || g.username}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </MarketingShell>
  );
}
