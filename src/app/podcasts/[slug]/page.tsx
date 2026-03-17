"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PodcastWithGuests, fetchPodcastBySlug, formatDuration } from "@/lib/podcasts";
import PodcastPlayer from "@/components/PodcastPlayer";

export default function PodcastEpisodePage() {
  const params = useParams();
  const [podcast, setPodcast] = useState<PodcastWithGuests | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      fetchPodcastBySlug(params.slug as string).then((data) => {
        setPodcast(data);
        setLoading(false);
      });
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!podcast) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <p className="text-muted-foreground mb-4">Episode not found.</p>
        <Link href="/podcasts" className="text-sm hover:underline">&larr; All episodes</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
      <Link href="/podcasts" className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block">
        &larr; All episodes
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          {podcast.episode_number && <span>Episode {podcast.episode_number}</span>}
          {podcast.duration_seconds && (
            <>
              {podcast.episode_number && <span>·</span>}
              <span>{formatDuration(podcast.duration_seconds)}</span>
            </>
          )}
          {podcast.published_at && (
            <>
              <span>·</span>
              <span>
                {new Date(podcast.published_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3">{podcast.title}</h1>
        {podcast.description && (
          <p className="text-muted-foreground">{podcast.description}</p>
        )}
      </div>

      {/* Cover image */}
      {podcast.cover_image_url && (
        <img
          src={podcast.cover_image_url}
          alt={podcast.title}
          className="w-full rounded-xl mb-6 object-cover max-h-80"
        />
      )}

      {/* Audio Player */}
      {podcast.audio_url && (
        <div className="mb-8">
          <PodcastPlayer audioUrl={podcast.audio_url} title={podcast.title} />
        </div>
      )}

      {/* Guests */}
      {podcast.guests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Guests</h2>
          <div className="flex flex-wrap gap-3">
            {podcast.guests.map((guest) => (
              <Link
                key={guest.id}
                href={guest.username ? `/p/${guest.username}` : "#"}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:bg-muted/50 transition-colors"
              >
                {guest.photo_url ? (
                  <img src={guest.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                    {guest.name?.[0] || "?"}
                  </span>
                )}
                <span className="text-sm font-medium">{guest.name || guest.username}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Transcript */}
      {podcast.transcript && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Transcript</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap text-sm leading-relaxed">
              {podcast.transcript}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
