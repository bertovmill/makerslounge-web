"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AudioPlayer from "@/components/AudioPlayer";
import { getEpisodeBySlug, getAllEpisodes } from "@/lib/podcast";
import type { PodcastEpisode } from "@/lib/podcast";

interface EpisodePageProps {
  params: {
    slug: string;
  };
}

export default function EpisodePage({ params }: EpisodePageProps) {
  const episode = getEpisodeBySlug(params.slug);

  if (!episode) {
    notFound();
  }

  const allEpisodes = getAllEpisodes();
  const relatedEpisodes = allEpisodes
    .filter((e) => e.id !== episode.id)
    .slice(0, 3);

  const formattedDate = new Date(episode.publishDate).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          {/* Back button */}
          <Link
            href="/podcast"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all episodes
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Cover Image */}
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              {episode.coverImage ? (
                <img
                  src={episode.coverImage}
                  alt={episode.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-400/20 to-orange-400/20 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-white/30"
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
            </div>

            {/* Episode Info */}
            <div className="text-white">
              <Badge className="mb-4 bg-white/10 text-white border-white/20">
                Episode {episode.episodeNumber}
              </Badge>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {episode.title}
              </h1>

              <p className="text-xl text-white/80 mb-6 leading-relaxed">
                {episode.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-6">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formattedDate}</span>
                </div>
                <div className="w-1 h-1 bg-white/40 rounded-full self-center" />
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{episode.durationMinutes} minutes</span>
                </div>
              </div>

              {/* Guest badges */}
              {episode.guests.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm text-white/60">With:</span>
                  {episode.guests.map((guest) => (
                    <div
                      key={guest.name}
                      className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full pl-1 pr-4 py-1"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {guest.photo ? (
                          <img
                            src={guest.photo}
                            alt={guest.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          guest.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)
                        )}
                      </div>
                      <span className="text-sm font-medium">{guest.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Audio Player Section */}
      <section className="relative bg-background py-8 border-b border-border">
        <div className="max-w-5xl mx-auto px-4">
          <AudioPlayer
            title={episode.title}
            platforms={episode.platforms}
            episodeNumber={episode.episodeNumber}
          />
        </div>
      </section>

      {/* Show Notes */}
      <section className="relative py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Show Notes</h2>
          <div className="prose prose-lg max-w-none text-muted-foreground whitespace-pre-line">
            {episode.showNotes}
          </div>
        </div>
      </section>

      {/* Guests Section */}
      {episode.guests.length > 0 && (
        <section className="relative py-12 bg-muted/30">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">
              {episode.guests.length === 1 ? "Guest" : "Guests"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {episode.guests.map((guest) => (
                <GuestCard key={guest.name} guest={guest} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Episodes */}
      {relatedEpisodes.length > 0 && (
        <section className="relative py-12 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">More Episodes</h2>
              <Button variant="outline" asChild>
                <Link href="/podcast">View all</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedEpisodes.map((ep) => (
                <EpisodePreviewCard key={ep.id} episode={ep} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Guest Card Component
function GuestCard({ guest }: { guest: PodcastEpisode["guests"][0] }) {
  const initials = guest.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="glass-card p-6 flex gap-4">
      <div className="w-20 h-20 bg-gradient-to-br from-rose-400 to-orange-400 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 overflow-hidden">
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
      <div className="flex-1">
        <h3 className="font-bold text-lg mb-1">{guest.name}</h3>
        {guest.bio && (
          <p className="text-sm text-muted-foreground mb-3">{guest.bio}</p>
        )}
        {guest.links && (
          <div className="flex gap-2">
            {guest.links.twitter && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={
                    guest.links.twitter.startsWith("http")
                      ? guest.links.twitter
                      : `https://twitter.com/${guest.links.twitter.replace(
                          "@",
                          ""
                        )}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  Twitter
                </a>
              </Button>
            )}
            {guest.links.linkedin && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={guest.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  LinkedIn
                </a>
              </Button>
            )}
            {guest.links.website && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={guest.links.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs"
                >
                  Website
                </a>
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// Episode Preview Card (simpler than main EpisodeCard for related section)
function EpisodePreviewCard({ episode }: { episode: PodcastEpisode }) {
  return (
    <Link href={`/podcast/${episode.slug}`}>
      <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
        <div className="relative h-48 bg-gradient-to-br from-rose-400/20 to-orange-400/20">
          {episode.coverImage ? (
            <img
              src={episode.coverImage}
              alt={episode.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-12 h-12 text-primary/30"
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
          <div className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
            <p className="text-xs font-semibold">EP {episode.episodeNumber}</p>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold mb-1 line-clamp-2">{episode.title}</h3>
          <p className="text-sm text-muted-foreground">
            {episode.durationMinutes} min
          </p>
        </div>
      </Card>
    </Link>
  );
}
