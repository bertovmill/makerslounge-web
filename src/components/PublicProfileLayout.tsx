"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { renderAvatar } from '@/components/AvatarPicker';
import { getCoverStyle } from '@/lib/coverImages';
import { useTheme, getThemeShadow } from '@/components/ThemeProvider';
import dynamic from 'next/dynamic';

// Dynamically import WhiteboardViewer to avoid SSR issues
const WhiteboardViewer = dynamic(() => import('./WhiteboardViewer'), {
  ssr: false,
  loading: () => (
    <div className="h-96 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
      <p className="text-gray-500">Loading whiteboard...</p>
    </div>
  ),
});

interface Project {
  id: string;
  title: string;
  description: string | null;
  media_urls: string[] | null;
}

interface PublicProfileProps {
  profile: {
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
    whiteboard_data: any | null;
    show_whiteboard: boolean | null;
  };
  projects: Project[];
}

/**
 * PublicProfileLayout component
 *
 * Unified themed layout for public profile pages.
 * Works for both /profile/[id] and /p/[username] routes.
 */
export function PublicProfileLayout({ profile, projects }: PublicProfileProps) {
  const { theme } = useTheme();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const coverStyle = getCoverStyle(profile.cover_image);
  const shadowClass = getThemeShadow(theme.effects.shadowStyle);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* Cover Image */}
      <div
        className="h-48 md:h-64 w-full"
        style={
          theme.effects.gradientStyle
            ? { background: theme.effects.gradientStyle }
            : coverStyle
        }
      />

      {/* Profile Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Profile Header */}
        <div
          className={`-mt-16 md:-mt-20 mb-8 p-6 md:p-8 rounded-2xl ${
            theme.effects.glassEffect ? 'glass-card' : ''
          } ${shadowClass}`}
          style={{
            backgroundColor: 'var(--theme-card)',
            borderRadius: `var(--theme-card-radius)`,
            border: `1px solid var(--theme-border)`,
          }}
        >
          {/* Avatar */}
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden flex-shrink-0 border-4"
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

            <div className="flex-1">
              <h1
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{
                  fontFamily: 'var(--theme-font-heading)',
                  color: 'var(--theme-fg)',
                }}
              >
                {profile.name || 'Anonymous Maker'}
              </h1>

              {profile.bio && (
                <p
                  className="text-lg mb-4"
                  style={{ color: 'var(--theme-muted-foreground)' }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Skills */}
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

              {/* Social Links */}
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

        {/* Whiteboard Section - only show if enabled */}
        {profile.show_whiteboard && profile.whiteboard_data && (
          <div className="mb-12">
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-fg)',
              }}
            >
              Whiteboard
            </h2>
            <WhiteboardViewer data={profile.whiteboard_data} className="h-96" />
          </div>
        )}

        {/* Portfolio Section */}
        {projects && projects.length > 0 && (
          <div>
            <h2
              className="text-2xl font-bold mb-6"
              style={{
                fontFamily: 'var(--theme-font-heading)',
                color: 'var(--theme-fg)',
              }}
            >
              Portfolio
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 ${shadowClass}`}
                  onClick={() => setSelectedProject(project)}
                  style={{
                    backgroundColor: 'var(--theme-card)',
                    borderRadius: `var(--theme-card-radius)`,
                    border: `1px solid var(--theme-border)`,
                  }}
                >
                  {/* Project Thumbnail */}
                  {project.media_urls && project.media_urls.length > 0 && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img
                        src={project.media_urls[0]}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}

                  {/* Project Info */}
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
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!projects || projects.length === 0) && (
          <Card
            className={`p-12 text-center border-dashed ${shadowClass}`}
            style={{
              backgroundColor: 'var(--theme-card)',
              borderRadius: `var(--theme-card-radius)`,
              border: `2px dashed var(--theme-border)`,
            }}
          >
            <p style={{ color: 'var(--theme-muted-foreground)' }}>
              No projects yet
            </p>
          </Card>
        )}
      </div>

      {/* Project Modal */}
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
            {/* Close button */}
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

            {/* Media Gallery */}
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
