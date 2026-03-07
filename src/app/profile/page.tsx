"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import SkillsInput from "@/components/SkillsInput";
import Link from "next/link";
import { ExternalLink, Upload, Check } from "lucide-react";

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/"); return; }
      setUser(user);

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, username, name, first_name, last_name, photo_url, bio, skills, looking_for_skills, currently_building, linkedin, twitter, instagram, website")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        setProfile(existingProfile);
      } else {
        const newProfile = {
          id: user.id,
          username: null,
          name: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(filePath);
      setProfile({ ...profile, photo_url: publicUrl });

      await supabase.from("profiles").update({ photo_url: publicUrl }).eq("id", user.id);
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

  const profileUrl = profile.username ? `/p/${profile.username}` : `/profile/${user?.id}`;
  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight">Edit profile</h1>
        <Link
          href={profileUrl}
          target="_blank"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          View public profile
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-16 h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold overflow-hidden group"
          >
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-4 h-4 text-white" />
            </div>
          </button>
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium hover:underline"
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            <p className="text-xs text-muted-foreground">JPG, PNG. Max 5MB.</p>
          </div>
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">First name</label>
            <input
              type="text"
              value={profile.first_name || ""}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value, name: `${e.target.value} ${profile.last_name || ""}`.trim() })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Last name</label>
            <input
              type="text"
              value={profile.last_name || ""}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value, name: `${profile.first_name || ""} ${e.target.value}`.trim() })}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Username</label>
          <div className="flex items-center h-10 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
            <span className="text-xs text-muted-foreground pl-3 pr-1">makerslounge.com/p/</span>
            <input
              type="text"
              value={profile.username || ""}
              onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
              placeholder="yourname"
              className="flex-1 h-full pr-3 text-sm outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Bio</label>
          <textarea
            value={profile.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Tell people about yourself..."
            rows={3}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>

        {/* Currently building */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Currently building</label>
          <textarea
            value={profile.currently_building || ""}
            onChange={(e) => setProfile({ ...profile, currently_building: e.target.value })}
            placeholder="What are you working on?"
            rows={2}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm outline-none resize-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
          />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Your skills</label>
          <SkillsInput skills={profile.skills || []} onChange={(skills) => setProfile({ ...profile, skills })} maxSkills={10} />
        </div>

        {/* Looking for */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Looking for</label>
          <SkillsInput
            skills={profile.looking_for_skills || []}
            onChange={(looking_for_skills) => setProfile({ ...profile, looking_for_skills })}
            maxSkills={10}
            mode="looking_for"
          />
        </div>

        {/* Social links */}
        <div>
          <label className="block text-sm font-medium mb-3">Social links</label>
          <div className="space-y-2">
            {[
              { label: "LinkedIn", key: "linkedin" as const, placeholder: "https://linkedin.com/in/..." },
              { label: "X (Twitter)", key: "twitter" as const, placeholder: "https://x.com/..." },
              { label: "Instagram", key: "instagram" as const, placeholder: "https://instagram.com/..." },
              { label: "Website", key: "website" as const, placeholder: "https://yoursite.com" },
            ].map((field) => (
              <input
                key={field.key}
                type="text"
                value={profile[field.key] || ""}
                onChange={(e) => setProfile({ ...profile, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
    </div>
  );
}
