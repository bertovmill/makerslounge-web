"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import PodcastForm from "../PodcastForm";

export default function NewPodcastPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin) router.push("/profile");
  }, [loading, isAdmin, router]);

  if (loading || !user || !isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Badge variant="secondary" className="mb-4">New Episode</Badge>
      <h1 className="text-4xl font-bold mb-8">Create Podcast Episode</h1>
      <PodcastForm userId={user.id} />
    </div>
  );
}
