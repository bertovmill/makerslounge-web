"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ThemedProfile } from "@/components/ThemedProfile";
import { PublicProfileLayout } from "@/components/PublicProfileLayout";
import { Button } from "@/components/ui/button";
import { ThemeConfig } from "@/lib/themes";

interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  photo_url: string | null;
  avatar_style: string | null;
  bio: string | null;
  skills: string[] | null;
  linkedin: string | null;
  twitter: string | null;
  website: string | null;
  cover_image: string | null;
  theme_config: ThemeConfig | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
}

export default function UsernameProfilePage() {
  const params = useParams();
  const username = params.username as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      // Fetch profile by username
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", profileData.id)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);
      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Profile Not Found</h1>
          <p className="text-muted-foreground mb-4">This profile doesn&apos;t exist or has been removed.</p>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ThemedProfile themeConfig={profile.theme_config}>
      <PublicProfileLayout profile={profile} projects={projects} />
    </ThemedProfile>
  );
}
