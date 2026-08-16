"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth, type AuthUser } from "@/context/AuthContext";
import VoiceConversation from "@/components/onboarding/VoiceConversation";
import ProfilePreview, { type ProfileData } from "@/components/onboarding/ProfilePreview";

export default function VoiceOnboardingPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = authUser;
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
    <VoiceConversation
      onComplete={setProfileData}
      onBack={() => router.push("/onboarding")}
    />
  );
}
