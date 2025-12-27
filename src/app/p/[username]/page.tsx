"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProjectCard from "@/components/ProjectCard";
import { renderAvatar } from "@/components/AvatarPicker";

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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">This profile doesn&apos;t exist or has been removed.</p>
          <Link href="/" className="text-[#F4A261] hover:underline">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.name || "Profile"}
                  className="w-full h-full object-cover"
                />
              ) : (
                renderAvatar(profile?.avatar_style, profile?.name || "", "lg")
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-serif font-bold mb-2">
                {profile?.name || "Anonymous"}
              </h1>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-gray-600 mt-2">
                  {profile.bio}
                </p>
              )}

              {/* Skills */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-sm bg-[#F4A261]/20 text-[#c77f4a] px-3 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 mt-4">
                {profile?.linkedin && (
                  <a
                    href={profile.linkedin.startsWith("http") ? profile.linkedin : `https://${profile.linkedin}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#0077B5] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}

                {profile?.twitter && (
                  <a
                    href={
                      profile.twitter.startsWith("http")
                        ? profile.twitter
                        : profile.twitter.startsWith("@")
                        ? `https://twitter.com/${profile.twitter.slice(1)}`
                        : `https://twitter.com/${profile.twitter}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter
                  </a>
                )}

                {profile?.website && (
                  <a
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#F4A261] transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Section */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Portfolio</h2>

          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-100">
              <p>No projects yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => setSelectedProject(project)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Media Gallery */}
            {selectedProject.media_urls && selectedProject.media_urls.length > 0 && (
              <div className="mb-6">
                {selectedProject.media_urls.length === 1 ? (
                  <div className="rounded-xl overflow-hidden">
                    <img
                      src={selectedProject.media_urls[0]}
                      alt={selectedProject.title}
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProject.media_urls.map((url, index) => (
                      <div key={index} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={url}
                          alt={`${selectedProject.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <h2 className="text-2xl font-serif font-bold mb-2">
              {selectedProject.title}
            </h2>

            {selectedProject.description && (
              <p className="text-gray-600">{selectedProject.description}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
