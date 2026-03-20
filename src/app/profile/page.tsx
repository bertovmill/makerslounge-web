"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import SkillsInput from "@/components/SkillsInput";
import Link from "next/link";
import {
  ExternalLink,
  Upload,
  Check,
  Camera,
  Linkedin,
  Globe,
  Instagram,
} from "lucide-react";

interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
  looking_for_skills: string[] | null;
  currently_building: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  website: string | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    id: "",
    username: "",
    name: "",
    first_name: "",
    last_name: "",
    photo_url: null,
    bio: "",
    skills: [],
    looking_for_skills: [],
    currently_building: null,
    linkedin: "",
    twitter: "",
    instagram: "",
    website: "",
  });

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }
      setUser(user);

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select(
          "id, username, name, first_name, last_name, photo_url, bio, skills, looking_for_skills, currently_building, linkedin, twitter, instagram, website"
        )
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        const newProfile = {
          id: user.id,
          username: null,
          name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "",
          first_name: null,
          last_name: null,
          photo_url: user.user_metadata?.avatar_url || null,
          bio: "",
          skills: [],
          looking_for_skills: [],
          currently_building: null,
          linkedin: "",
          twitter: "",
          instagram: "",
          website: "",
        };
        await supabase.from("profiles").insert(newProfile);
        setProfile(newProfile);
      }

      setLoading(false);
    };
    init();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username,
          name: profile.name,
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          skills: profile.skills,
          looking_for_skills: profile.looking_for_skills,
          currently_building: profile.currently_building,
          linkedin: profile.linkedin,
          twitter: profile.twitter,
          instagram: profile.instagram,
          website: profile.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `profiles/${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath);
      setProfile({ ...profile, photo_url: publicUrl });

      await supabase
        .from("profiles")
        .update({ photo_url: publicUrl })
        .eq("id", user.id);
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const profileUrl = profile.username
    ? `/p/${profile.username}`
    : `/profile/${user?.id}`;
  const initials =
    profile.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-12 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Edit profile</h1>
        <Link
          href={profileUrl}
          target="_blank"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          View public profile
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Profile header card */}
      <div className="rounded-xl bg-card border border-border/50 p-5 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-lg overflow-hidden group shrink-0"
          >
            {profile.photo_url ? (
              <img
                src={profile.photo_url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-semibold truncate">
              {profile.first_name || profile.last_name
                ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
                : profile.name || "Your name"}
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm text-primary hover:underline mt-0.5"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Basic info card */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Basic info
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  First name
                </label>
                <input
                  type="text"
                  value={profile.first_name || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      first_name: e.target.value,
                      name: `${e.target.value} ${profile.last_name || ""}`.trim(),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Last name
                </label>
                <input
                  type="text"
                  value={profile.last_name || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      last_name: e.target.value,
                      name: `${profile.first_name || ""} ${e.target.value}`.trim(),
                    })
                  }
                  className="w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Username
              </label>
              <div className="flex items-center h-10 rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-shadow">
                <span className="text-xs text-muted-foreground pl-3 pr-1 shrink-0">
                  makerslounge.ca/p/
                </span>
                <input
                  type="text"
                  value={profile.username || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      username: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-_]/g, ""),
                    })
                  }
                  placeholder="yourname"
                  className="flex-1 h-full pr-3 text-sm outline-none bg-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Bio</label>
              <textarea
                value={profile.bio || ""}
                onChange={(e) =>
                  setProfile({ ...profile, bio: e.target.value })
                }
                placeholder="Tell people about yourself..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
              />
            </div>
          </div>
        </div>

        {/* Currently building card */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Currently building
          </h2>
          <textarea
            value={profile.currently_building || ""}
            onChange={(e) =>
              setProfile({ ...profile, currently_building: e.target.value })
            }
            placeholder="What are you working on?"
            rows={2}
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-ring focus:ring-offset-1 transition-shadow"
          />
        </div>

        {/* Skills card */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Your skills
          </h2>
          <SkillsInput
            skills={profile.skills || []}
            onChange={(skills) => setProfile({ ...profile, skills })}
            maxSkills={10}
          />
        </div>

        {/* Looking for card */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Looking for
          </h2>
          <SkillsInput
            skills={profile.looking_for_skills || []}
            onChange={(looking_for_skills) =>
              setProfile({ ...profile, looking_for_skills })
            }
            maxSkills={10}
            mode="looking_for"
          />
        </div>

        {/* Social links card */}
        <div className="rounded-xl bg-card border border-border/50 p-5">
          <h2 className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
            Social links
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "LinkedIn",
                key: "linkedin" as const,
                prefix: "linkedin.com/in/",
                placeholder: "yourname",
                icon: Linkedin,
              },
              {
                label: "X (Twitter)",
                key: "twitter" as const,
                prefix: "x.com/",
                placeholder: "handle",
                icon: () => (
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
              {
                label: "Instagram",
                key: "instagram" as const,
                prefix: "instagram.com/",
                placeholder: "handle",
                icon: Instagram,
              },
              {
                label: "Website",
                key: "website" as const,
                prefix: "https://",
                placeholder: "yoursite.com",
                icon: Globe,
              },
            ].map((field) => {
              // Extract the slug/handle from a full URL for display
              const fullValue = profile[field.key] || "";
              const displayValue =
                field.key === "website"
                  ? fullValue.replace(/^https?:\/\//, "")
                  : fullValue
                      .replace(/^https?:\/\/(www\.)?/, "")
                      .replace(
                        new RegExp(
                          `^${field.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
                          "i"
                        ),
                        ""
                      )
                      .replace(/^\//, "")
                      .replace(/\/$/, "");

              const handleChange = (input: string) => {
                if (field.key === "website") {
                  // For website, store with https:// prefix
                  const clean = input.replace(/^https?:\/\//, "");
                  setProfile({
                    ...profile,
                    [field.key]: clean ? `https://${clean}` : "",
                  });
                } else {
                  // For social links, store the full URL
                  const clean = input
                    .replace(/^https?:\/\/(www\.)?/, "")
                    .replace(
                      new RegExp(
                        `^${field.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
                        "i"
                      ),
                      ""
                    )
                    .replace(/^\//, "")
                    .replace(/\/$/, "");
                  setProfile({
                    ...profile,
                    [field.key]: clean
                      ? `https://${field.prefix}${clean}`
                      : "",
                  });
                }
              };

              return (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                    <field.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 flex items-center h-10 rounded-lg border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-shadow">
                    <span className="text-xs text-muted-foreground pl-3 pr-0.5 shrink-0">
                      {field.prefix}
                    </span>
                    <input
                      type="text"
                      value={displayValue}
                      onChange={(e) => handleChange(e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 h-full pr-3 text-sm outline-none bg-transparent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:opacity-80 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {saved ? (
            <>
              <Check className="w-4 h-4" />
              Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save changes"
          )}
        </button>
      </div>

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
