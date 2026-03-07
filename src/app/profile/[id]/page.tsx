"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProfileView from "@/components/ProfileView";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, photo_url, bio, skills, looking_for_skills, currently_building, linkedin, twitter, instagram, website")
        .eq("id", userId)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };
    fetchProfile();
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
