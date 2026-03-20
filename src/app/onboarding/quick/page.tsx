"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import QuickForm from "@/components/onboarding/QuickForm";
import ProfilePreview, { type ProfileData } from "@/components/onboarding/ProfilePreview";

export default function QuickOnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<ProfileData>>({});
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, name, first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) { router.push("/people"); return; }

      // Pre-fill name from existing data
      const partial: Partial<ProfileData> = {};
      if (profile?.first_name) {
        partial.firstName = profile.first_name;
        partial.lastName = profile.last_name || "";
      } else if (profile?.name) {
        const parts = profile.name.split(" ");
        partial.firstName = parts[0] || "";
        partial.lastName = parts.slice(1).join(" ") || "";
      } else if (user.user_metadata?.full_name) {
        const parts = user.user_metadata.full_name.split(" ");
        partial.firstName = parts[0] || "";
        partial.lastName = parts.slice(1).join(" ") || "";
      }
      setInitialData(partial);
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
    <QuickForm
      initialData={initialData}
      onComplete={setProfileData}
      onBack={() => router.push("/onboarding")}
    />
  );
}
