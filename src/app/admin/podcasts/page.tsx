"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PodcastWithGuests, fetchAllPodcasts, deletePodcast, formatDuration } from "@/lib/podcasts";

export default function AdminPodcastsPage() {
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [podcasts, setPodcasts] = useState<PodcastWithGuests[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      router.push("/profile");
      return;
    }
    fetchAllPodcasts().then((data) => {
      setPodcasts(data);
      setLoading(false);
    });
  }, [isAdmin, router]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const result = await deletePodcast(id);
    if (result.success) {
      setPodcasts(podcasts.filter((p) => p.id !== id));
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Badge variant="secondary" className="mb-4">Podcast Admin</Badge>
          <h1 className="text-4xl font-bold mb-2">Manage Podcasts</h1>
          <p className="text-muted-foreground">Create and manage podcast episodes</p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/podcasts/new">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Episode
          </Link>
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : podcasts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-6">No podcast episodes yet</p>
          <Button asChild>
            <Link href="/admin/podcasts/new">Create your first episode</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {podcasts.map((podcast) => (
            <Card key={podcast.id} className="p-6">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    {podcast.episode_number && (
                      <span className="text-sm text-muted-foreground font-mono">
                        #{podcast.episode_number}
                      </span>
                    )}
                    <h2 className="text-xl font-bold truncate">{podcast.title}</h2>
                    <Badge variant={podcast.is_published ? "default" : "secondary"}>
                      {podcast.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  {podcast.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {podcast.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {podcast.duration_seconds && (
                      <span>{formatDuration(podcast.duration_seconds)}</span>
                    )}
                    {podcast.guests.length > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {podcast.guests.map((g) => g.name || g.username).join(", ")}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span>
                      {new Date(podcast.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {podcast.is_published && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/podcasts/${podcast.slug}`} target="_blank">View</Link>
                    </Button>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/podcasts/${podcast.id}`}>Edit</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDelete(podcast.id, podcast.title)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
