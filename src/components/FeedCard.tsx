"use client";

import Link from "next/link";

interface FeedCardProps {
  project: {
    id: string;
    title: string;
    description: string | null;
    media_urls: string[] | null;
    created_at: string;
    profiles: {
      id: string;
      name: string | null;
      photo_url: string | null;
    } | null;
  };
  onAuthRequired?: () => void;
}

export default function FeedCard({ project, onAuthRequired }: FeedCardProps) {
  const initials = project.profiles?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Author header */}
      <div className="p-4 flex items-center gap-3">
        <Link href={`/profile/${project.profiles?.id}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
            {project.profiles?.photo_url ? (
              <img
                src={project.profiles.photo_url}
                alt={project.profiles.name || "User"}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${project.profiles?.id}`}>
            <p className="font-semibold text-sm hover:underline cursor-pointer">
              {project.profiles?.name || "Anonymous"}
            </p>
          </Link>
          <p className="text-xs text-gray-500">{timeAgo(project.created_at)}</p>
        </div>
      </div>

      {/* Project content */}
      <div className="px-4 pb-3">
        <h3 className="font-semibold text-lg mb-1">{project.title}</h3>
        {project.description && (
          <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
        )}
      </div>

      {/* Media */}
      {project.media_urls && project.media_urls.length > 0 && (
        <div className="relative">
          <img
            src={project.media_urls[0]}
            alt={project.title}
            className="w-full aspect-video object-cover"
          />
          {project.media_urls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{project.media_urls.length - 1} more
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex items-center gap-4">
        <button
          onClick={onAuthRequired}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Like
        </button>
        <button
          onClick={onAuthRequired}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Comment
        </button>
      </div>
    </div>
  );
}
