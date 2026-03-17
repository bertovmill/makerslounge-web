"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PodcastWithGuests, fetchPodcastById } from "@/lib/podcasts";
import PodcastForm from "../PodcastForm";

export default function EditPodcastPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [podcast, setPodcast] = useState<PodcastWithGuests | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push("/profile");
      return;
    }
    if (params.id) {
      fetchPodcastById(params.id as string).then((data) => {
        setPodcast(data);
        setFetching(false);
      });
    }
  }, [loading, isAdmin, router, params.id]);

  if (loading || fetching || !user || !isAdmin) return null;

  if (!podcast) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-muted-foreground">Podcast not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Badge variant="secondary" className="mb-4">Edit Episode</Badge>
      <h1 className="text-4xl font-bold mb-8">{podcast.title}</h1>
      <PodcastForm userId={user.id} podcast={podcast} />
    </div>
  );
}
