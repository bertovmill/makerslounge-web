"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ThemedProfile } from "@/components/ThemedProfile";
import { PublicProfileLayout } from "@/components/PublicProfileLayout";
import { ValuePortfolioItem } from "@/components/ValuePortfolioModal";
import { Button } from "@/components/ui/button";
import { ThemeConfig } from "@/lib/themes";

interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  photo_url: string | null;
  avatar_style: string | null;
  bio: string | null;
  skills: string[] | null;
  linkedin: string | null;
  twitter: string | null;
  website: string | null;
  cover_image: string | null;
  theme_config: ThemeConfig | null;
  whiteboard_data: any | null;
  show_whiteboard: boolean | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [valuePortfolio, setValuePortfolio] = useState<ValuePortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);

      // Fetch value portfolio
      const { data: portfolioData } = await supabase
        .from("value_portfolio")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setValuePortfolio(portfolioData || []);
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

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
      <PublicProfileLayout profile={profile} projects={projects} valuePortfolio={valuePortfolio} />
    </ThemedProfile>
  );
}
