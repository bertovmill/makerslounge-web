"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchProfile, type PublicProfile } from "@/lib/profiles-client";
import ProfileView from "@/components/ProfileView";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Named `load`, not `fetchProfile`: that would shadow the imported
    // `fetchProfile` and recurse into itself.
    const load = async () => {
      const data = await fetchProfile(userId);

      if (!data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    load();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-lg font-semibold mb-1">Profile not found</h1>
          <p className="text-sm text-muted-foreground mb-4">This profile doesn&apos;t exist.</p>
          <Link href="/people" className="text-sm font-medium hover:underline">
            Browse people
          </Link>
        </div>
      </div>
    );
  }

  return <ProfileView profile={profile as any} />;
}
