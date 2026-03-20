"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import GitHubImport from "@/components/onboarding/GitHubImport";
import ProfilePreview, { type ProfileData } from "@/components/onboarding/ProfilePreview";

export default function GitHubOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) { router.push("/people"); return; }
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (profileData && user) {
    return (
      <ProfilePreview
        data={profileData}
        userId={user.id}
        onBack={() => setProfileData(null)}
      />
    );
  }

  return (
    <GitHubImport
      onComplete={setProfileData}
      onBack={() => router.push("/onboarding")}
    />
  );
}
