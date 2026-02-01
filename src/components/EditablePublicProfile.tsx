"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { ThemedProfile } from "./ThemedProfile";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { renderAvatar } from "./AvatarPicker";
import { getCoverStyle } from "@/lib/coverImages";
import { useTheme, getThemeShadow } from "./ThemeProvider";
import ProjectModal from "./ProjectModal";
import { ThemeConfig } from "@/lib/themes";
import CoverPicker from "./CoverPicker";
import ValuePortfolioSection from "./ValuePortfolioSection";
import { ValuePortfolioItem } from "./ValuePortfolioModal";
import dynamic from "next/dynamic";

// Dynamically import WhiteboardEditor to avoid SSR issues
const WhiteboardEditor = dynamic(() => import("./WhiteboardEditor"), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
      <p className="text-gray-500">Loading whiteboard editor...</p>
    </div>
  ),
});

interface Profile {
  id: string;
  name: string | null;
  username: string | null;
  bio: string | null;
  skills: string[] | null;
  photo_url: string | null;
  avatar_style: string | null;
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
  user_id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
}

interface EditablePublicProfileProps {
  profile: Profile;
  projects: Project[];
  valuePortfolio?: ValuePortfolioItem[];
  onUpdateProfile: (updates: Partial<Profile>) => Promise<void>;
  onUpdateProjects: (projects: Project[]) => void;
  onUpdateValuePortfolio?: (items: ValuePortfolioItem[]) => void;
  onPhotoUpload: (file: File) => Promise<void>;
  onAvatarSelect: (style: string) => Promise<void>;
}

/**
 * EditablePublicProfile - WYSIWYG profile editing
 *
 * Shows the profile exactly as visitors see it, with inline edit controls.
 */
export function EditablePublicProfile({
  profile,
  projects,
  valuePortfolio = [],
  onUpdateProfile,
  onUpdateProjects,
  onUpdateValuePortfolio,
  onPhotoUpload,
  onAvatarSelect,
}: EditablePublicProfileProps) {
  const { theme } = useTheme();
  const shadowClass = getThemeShadow(theme.effects.shadowStyle);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverStyle = getCoverStyle(profile.cover_image);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onPhotoUpload(file);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleStartEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSaveField = async (field: keyof Profile) => {
    if (tempValue !== profile[field]) {
      await onUpdateProfile({ [field]: tempValue || null });
    }
    setEditingField(null);
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue("");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* Cover Image with Edit Button */}
      <div className="relative group cursor-pointer" onClick={() => setShowCoverPicker(true)}>
        <div
          className="h-48 md:h-64 w-full"
          style={
            theme.effects.gradientStyle
              ? { background: theme.effects.gradientStyle }
              : coverStyle
          }
        />
        {/* Cover Edit Button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
          <Button
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full"
            variant="secondary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Change Cover
          </Button>
        </div>
      </div>

      {/* Profile Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Profile Header */}
        <div
          className={`-mt-16 md:-mt-20 mb-8 p-6 md:p-8 rounded-2xl relative group ${
            theme.effects.glassEffect ? 'glass-card' : ''
          } ${shadowClass}`}
          style={{
            backgroundColor: 'var(--theme-card)',
            borderRadius: `var(--theme-card-radius)`,
            border: `1px solid var(--theme-border)`,
          }}
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
            {/* Avatar with Edit on Hover */}
            <div className="relative group/avatar" onClick={handlePhotoClick}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0 border-4 cursor-pointer"
                style={{
                  borderColor: 'var(--theme-card)',
                  borderRadius: `var(--theme-card-radius)`,
                }}
              >
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  renderAvatar(profile.avatar_style, profile.name || '', 'xl')
                )}
              </div>
              {/* Edit overlay on hover */}
              <div className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="text-white text-sm font-medium">Change Photo</span>
              </div>
            </div>

            <div className="flex-1 w-full">
              {/* Name - Inline Editable */}
              {editingField === 'name' ? (
                <div className="mb-2">
                  <input
                    type="text"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveField('name');
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="text-3xl md:text-4xl font-bold border-2 border-blue-500 rounded px-2 py-1 w-full"
                    style={{
                      fontFamily: 'var(--theme-font-heading)',
                      color: 'var(--theme-fg)',
                    }}
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleSaveField('name')}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <h1
                  className="text-3xl md:text-4xl font-bold mb-2 cursor-pointer hover:bg-blue-50/50 rounded px-2 py-1 -mx-2 transition-colors group/name"
                  style={{
                    fontFamily: 'var(--theme-font-heading)',
                    color: 'var(--theme-fg)',
                  }}
                  onClick={() => handleStartEdit('name', profile.name || '')}
                >
                  {profile.name || 'Your Name'}
                  <span className="ml-2 opacity-0 group-hover/name:opacity-100 text-sm text-gray-400">
                    ✏️ Click to edit
                  </span>
                </h1>
              )}

              {/* Bio - Inline Editable */}
              {editingField === 'bio' ? (
                <div className="mb-4">
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') handleCancelEdit();
                    }}
                    className="text-lg w-full border-2 border-blue-500 rounded px-3 py-2 min-h-[80px]"
                    style={{ color: 'var(--theme-muted-foreground)' }}
                    autoFocus
                    placeholder="Tell people about yourself..."
                  />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleSaveField('bio')}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-lg mb-4 cursor-pointer hover:bg-blue-50/50 rounded px-3 py-2 -mx-3 transition-colors group/bio min-h-[60px] flex items-center"
                  onClick={() => handleStartEdit('bio', profile.bio || '')}
                  style={{ color: 'var(--theme-muted-foreground)' }}
                >
                  {profile.bio || (
                    <span className="text-gray-400 italic">
                      Click to add a bio...
                    </span>
                  )}
                  {profile.bio && (
                    <span className="ml-2 opacity-0 group-hover/bio:opacity-100 text-sm text-gray-400">
                      ✏️
                    </span>
                  )}
                </div>
              )}

              {/* Skills - will add inline editing in next iteration */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1"
                      style={{
                        backgroundColor: 'var(--theme-primary)',
                        color: 'var(--theme-primary-foreground)',
                        opacity: 0.9,
                      }}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Social Links - simplified for now */}
              <div className="flex flex-wrap gap-3">
                {profile.linkedin && (
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                    LinkedIn
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={
                      profile.twitter.startsWith('http')
                        ? profile.twitter
                        : `https://twitter.com/${profile.twitter.replace('@', '')}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--theme-accent)' }}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--theme-accent)' }}
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

        {/* Whiteboard Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-fg)',
              }}
            >
              My Whiteboard
            </h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={profile.show_whiteboard || false}
                onChange={(e) => {
                  onUpdateProfile({ show_whiteboard: e.target.checked });
                }}
                className="rounded"
              />
              <span style={{ color: 'var(--theme-muted-foreground)' }}>
                Show on public profile
              </span>
            </label>
          </div>

          <WhiteboardEditor
            initialData={profile.whiteboard_data}
            onSave={async (data) => {
              await onUpdateProfile({ whiteboard_data: data });
            }}
            className="h-96"
          />

          <p className="text-xs mt-2" style={{ color: 'var(--theme-muted-foreground)' }}>
            Use this whiteboard to share your ideas, workflows, or visual thinking. Changes auto-save every 3 seconds.
          </p>
        </div>

        {/* Value Portfolio Section */}
        <ValuePortfolioSection
          items={valuePortfolio}
          userId={profile.id}
          isEditable={true}
          onUpdateItems={onUpdateValuePortfolio}
        />

        {/* Recent Posts Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-fg)',
              }}
            >
              Recent Posts
            </h2>
            <Button
              onClick={() => {
                setEditingProject(null);
                setShowProjectModal(true);
              }}
              className="rounded-full"
            >
              + Add Project
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card
              className={`p-12 text-center border-dashed ${shadowClass}`}
              style={{
                backgroundColor: 'var(--theme-card)',
                borderRadius: `var(--theme-card-radius)`,
                border: `2px dashed var(--theme-border)`,
              }}
              onClick={() => setShowProjectModal(true)}
            >
              <p style={{ color: 'var(--theme-muted-foreground)' }} className="mb-4">
                No projects yet
              </p>
              <Button className="rounded-full">Add Your First Project</Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 relative ${shadowClass}`}
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderRadius: `var(--theme-card-radius)`,
                    border: `1px solid var(--theme-border)`,
                  }}
                >
                  {/* Edit button on hover */}
                  <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProject(project);
                        setShowProjectModal(true);
                      }}
                      className="rounded-full"
                    >
                      Edit
                    </Button>
                  </div>

                  <div onClick={() => setSelectedProject(project)}>
                    {project.media_urls && project.media_urls.length > 0 && (
                      <div className="aspect-video bg-muted overflow-hidden">
                        <img
                          src={project.media_urls[0]}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3
                        className="font-semibold text-lg mb-2"
                        style={{
                          fontFamily: 'var(--theme-font-heading)',
                          color: 'var(--theme-fg)',
                        }}
                      >
                        {project.title}
                      </h3>
                      {project.description && (
                        <p
                          className="text-sm line-clamp-2"
                          style={{ color: 'var(--theme-muted-foreground)' }}
                        >
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <ProjectModal
          project={editingProject}
          userId={profile.id}
          onClose={() => {
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onSave={(savedProject) => {
            if (editingProject) {
              // Update existing
              onUpdateProjects(projects.map((p) => (p.id === savedProject.id ? savedProject : p)));
            } else {
              // Add new
              onUpdateProjects([...projects, savedProject]);
            }
            setShowProjectModal(false);
            setEditingProject(null);
          }}
          onDelete={() => {
            if (editingProject) {
              onUpdateProjects(projects.filter((p) => p.id !== editingProject.id));
            }
            setShowProjectModal(false);
            setEditingProject(null);
          }}
        />
      )}

      {/* Cover Picker Modal */}
      {showCoverPicker && (
        <CoverPicker
          currentCover={profile.cover_image}
          onSelect={(coverId) => {
            onUpdateProfile({ cover_image: coverId });
          }}
          onClose={() => setShowCoverPicker(false)}
        />
      )}

      {/* Project Detail Modal (Read-only) */}
      {selectedProject && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className={`rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto ${shadowClass}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--theme-card)',
              borderRadius: `var(--theme-card-radius)`,
            }}
          >
            <button
              onClick={() => setSelectedProject(null)}
              className="float-right hover:opacity-70"
              style={{ color: 'var(--theme-muted-foreground)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2
              className="text-2xl font-bold mb-4"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-fg)',
              }}
            >
              {selectedProject.title}
            </h2>

            {selectedProject.media_urls && selectedProject.media_urls.length > 0 && (
              <div className="mb-6 space-y-4">
                {selectedProject.media_urls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`${selectedProject.title} - ${index + 1}`}
                    className="w-full rounded-lg"
                  />
                ))}
              </div>
            )}

            {selectedProject.description && (
              <p
                className="text-lg leading-relaxed"
                style={{ color: 'var(--theme-fg)' }}
              >
                {selectedProject.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
