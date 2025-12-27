"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import ProjectCard from "@/components/ProjectCard";
import ProjectModal from "@/components/ProjectModal";
import SkillsInput from "@/components/SkillsInput";
import AvatarPicker, { renderAvatar } from "@/components/AvatarPicker";

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

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
  });
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `profiles/${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      // Update profile with new photo URL
      setProfile({ ...profile, photo_url: publicUrl });

      await supabase
        .from("profiles")
        .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      setMessage("Photo updated!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username || null,
          name: profile.name,
          bio: profile.bio,
          skills: profile.skills,
          linkedin: profile.linkedin,
          twitter: profile.twitter,
          website: profile.website,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage("Profile saved!");
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const profileUrl = profile.username ? `/p/${profile.username}` : `/profile/${user?.id}`;
  const fullProfileUrl = typeof window !== "undefined"
    ? `${window.location.origin}${profileUrl}`
    : profileUrl;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-serif font-bold">Your Profile</h1>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Public Profile
          </a>
        </div>

        {/* Profile Photo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4">Profile Photo</h2>

          <div className="flex items-center gap-6">
            <div
              className="w-24 h-24 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => profile.photo_url ? fileInputRef.current?.click() : setShowAvatarPicker(true)}
            >
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                renderAvatar(profile.avatar_style, profile.name || "", "lg")
              )}
            </div>

            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="block bg-[#1a1a1a] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Photo"}
              </button>
              {!profile.photo_url && (
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="block bg-gradient-to-r from-[#F4A261] to-[#E76F51] text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Choose Fun Avatar
                </button>
              )}
              {profile.photo_url && (
                <button
                  onClick={async () => {
                    setProfile({ ...profile, photo_url: null });
                    await supabase
                      .from("profiles")
                      .update({ photo_url: null, updated_at: new Date().toISOString() })
                      .eq("id", user?.id);
                    setMessage("Photo removed!");
                    setTimeout(() => setMessage(""), 2000);
                  }}
                  className="block text-sm text-gray-500 hover:text-red-500 transition-colors"
                >
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-gray-400">JPG, PNG. Max 5MB.</p>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold mb-4">Basic Info</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="flex items-center">
                <span className="text-gray-400 text-sm mr-1">makerslounge.com/p/</span>
                <input
                  type="text"
                  value={profile.username || ""}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, "") })}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
                  placeholder="yourname"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Only lowercase letters, numbers, dashes, and underscores
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400 resize-none"
                placeholder="Tell others about yourself..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">
                {(profile.bio || "").length}/500 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills
              </label>
              <SkillsInput
                skills={profile.skills || []}
                onChange={(skills) => setProfile({ ...profile, skills })}
                maxSkills={10}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn
              </label>
              <input
                type="url"
                value={profile.linkedin || ""}
                onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter / X
              </label>
              <input
                type="text"
                value={profile.twitter || ""}
                onChange={(e) => setProfile({ ...profile, twitter: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
                placeholder="@username or URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={profile.website || ""}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-gray-400"
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1a1a1a] text-white px-6 py-3 rounded-full font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            {message && (
              <span className="text-sm text-green-600">{message}</span>
            )}
          </div>
        </div>

        {/* Projects Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Portfolio Projects</h2>
            <button
              onClick={() => {
                setEditingProject(null);
                setShowProjectModal(true);
              }}
              className="bg-[#F4A261] text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-[#e8935a] transition-colors"
            >
              + Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">No projects yet</p>
              <p className="text-sm">Add your first project to showcase your work!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  showEditButton
                  onEdit={() => {
                    setEditingProject(project);
                    setShowProjectModal(true);
                  }}
                  onDelete={async () => {
                    if (confirm("Are you sure you want to delete this project?")) {
                      await supabase.from("projects").delete().eq("id", project.id);
                      setProjects(projects.filter((p) => p.id !== project.id));
                    }
                  }}
                  onClick={() => {
                    setEditingProject(project);
                    setShowProjectModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Project Modal */}
        {showProjectModal && user && (
          <ProjectModal
            project={editingProject}
            userId={user.id}
            onClose={() => {
              setShowProjectModal(false);
              setEditingProject(null);
            }}
            onSave={(savedProject) => {
              if (editingProject) {
                setProjects(projects.map((p) =>
                  p.id === savedProject.id ? savedProject : p
                ));
              } else {
                setProjects([savedProject, ...projects]);
              }
              setShowProjectModal(false);
              setEditingProject(null);
            }}
            onDelete={() => {
              if (editingProject) {
                setProjects(projects.filter((p) => p.id !== editingProject.id));
              }
              setShowProjectModal(false);
              setEditingProject(null);
            }}
          />
        )}

        {/* Avatar Picker Modal */}
        {showAvatarPicker && (
          <AvatarPicker
            selectedAvatar={profile.avatar_style}
            name={profile.name || ""}
            onSelect={async (avatarId) => {
              setProfile({ ...profile, avatar_style: avatarId });
              if (user) {
                await supabase
                  .from("profiles")
                  .update({ avatar_style: avatarId, updated_at: new Date().toISOString() })
                  .eq("id", user.id);
              }
            }}
            onClose={() => setShowAvatarPicker(false)}
          />
        )}

      </div>
    </div>
  );
}
