"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { ThemedProfile } from "@/components/ThemedProfile";
import { EditablePublicProfile } from "@/components/EditablePublicProfile";
import { ThemePicker } from "@/components/ThemePicker";
import AvatarPicker from "@/components/AvatarPicker";
import SkillsInput from "@/components/SkillsInput";
import { ThemeConfig, getDefaultThemeConfig } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  theme_config: ThemeConfig | null;
  cover_image: string | null;
}

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    id: "",
    username: "",
    name: "",
    photo_url: null,
    avatar_style: null,
    bio: "",
    skills: [],
    linkedin: "",
    twitter: "",
    website: "",
    theme_config: getDefaultThemeConfig(),
    cover_image: null,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      setUser(user);

      // Fetch or create profile
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        // Create new profile
        const newProfile = {
          id: user.id,
          username: null,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
          photo_url: user.user_metadata?.avatar_url || null,
          avatar_style: null,
          bio: "",
          skills: [],
          linkedin: "",
          twitter: "",
          website: "",
          theme_config: getDefaultThemeConfig(),
          cover_image: null,
        };

        await supabase.from("profiles").insert(newProfile);
        setProfile(newProfile);
      }

      // Fetch projects
      const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setProjects(projectsData || []);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleUpdateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setProfile({ ...profile, ...updates });
      setMessage("Saved!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Failed to save");
    }
  };

  const handlePhotoUploadFromFile = async (file: File) => {
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `profiles/${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      await handleUpdateProfile({ photo_url: publicUrl, avatar_style: null });
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handlePhotoUploadFromFile(file);
    }
  };

  const handleAvatarSelect = async (style: string) => {
    await handleUpdateProfile({ avatar_style: style, photo_url: null });
    setShowAvatarPicker(false);
  };

  const handleThemeChange = async (themeId: string) => {
    const newThemeConfig = { ...profile.theme_config, theme_id: themeId };
    await handleUpdateProfile({ theme_config: newThemeConfig });
  };

  const handleSaveAdvanced = async () => {
    await handleUpdateProfile({
      username: profile.username,
      skills: profile.skills,
      linkedin: profile.linkedin,
      twitter: profile.twitter,
      website: profile.website,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const profileUrl = profile.username ? `/p/${profile.username}` : `/profile/${user?.id}`;

  return (
    <div>
      {/* Sticky Header with View Public Profile Link */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Edit Profile</h1>
          <div className="flex items-center gap-3">
            {message && (
              <span className="text-sm text-green-600">{message}</span>
            )}
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link href={profileUrl} target="_blank" rel="noopener noreferrer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Public Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Themed Profile with Inline Editing */}
      <ThemedProfile themeConfig={profile.theme_config}>
        <EditablePublicProfile
          profile={profile}
          projects={projects}
          onUpdateProfile={handleUpdateProfile}
          onUpdateProjects={setProjects}
          onPhotoUpload={handlePhotoUploadFromFile}
          onAvatarSelect={handleAvatarSelect}
        />

        {/* Advanced Settings Section */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="bg-card border border-border rounded-2xl p-6 mt-8">
            <button
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-xl font-semibold">Advanced Settings</h2>
              <svg
                className={`w-5 h-5 transition-transform ${
                  showAdvancedSettings ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showAdvancedSettings && (
              <div className="mt-6 space-y-6">
                {/* Theme Picker */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Theme & Style</h3>
                  <ThemePicker
                    currentThemeId={profile.theme_config?.theme_id || "default"}
                    onSelectTheme={handleThemeChange}
                  />
                </div>

                <div className="border-t border-border my-6"></div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mr-2">
                      makerslounge.com/p/
                    </span>
                    <input
                      type="text"
                      value={profile.username || ""}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""),
                        })
                      }
                      className="flex-1 px-4 py-2 border border-border rounded-lg"
                      placeholder="yourname"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only lowercase letters, numbers, dashes, and underscores
                  </p>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-sm font-medium mb-2">Skills</label>
                  <SkillsInput
                    skills={profile.skills || []}
                    onChange={(skills) => setProfile({ ...profile, skills })}
                    maxSkills={10}
                  />
                </div>

                {/* Social Links */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">LinkedIn</label>
                    <input
                      type="url"
                      value={profile.linkedin || ""}
                      onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg"
                      placeholder="https://linkedin.com/in/yourname"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Twitter</label>
                    <input
                      type="text"
                      value={profile.twitter || ""}
                      onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg"
                      placeholder="@yourhandle or https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Website</label>
                    <input
                      type="url"
                      value={profile.website || ""}
                      onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveAdvanced} className="rounded-full w-full">
                  Save Advanced Settings
                </Button>
              </div>
            )}
          </div>
        </div>
      </ThemedProfile>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPicker
          selectedAvatar={profile.avatar_style}
          name={profile.name || ""}
          onSelect={(style) => {
            handleAvatarSelect(style);
          }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  );
}

