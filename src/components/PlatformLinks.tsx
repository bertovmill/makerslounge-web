"use client";

import { Button } from "@/components/ui/button";
import type { PodcastPlatforms } from "@/lib/podcast";

interface PlatformLinksProps {
  platforms: PodcastPlatforms;
  variant?: "default" | "compact";
}

export default function PlatformLinks({ platforms, variant = "default" }: PlatformLinksProps) {
  const platformConfig = [
    {
      name: "Spotify",
      url: platforms.spotify,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      ),
      color: "hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30",
    },
    {
      name: "Apple Podcasts",
      url: platforms.apple,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm0-22C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 13c-1.103 0-2-.897-2-2V7c0-1.103.897-2 2-2s2 .897 2 2v6c0 1.103-.897 2-2 2zm0 3c-.552 0-1 .448-1 1s.448 1 1 1 1-.448 1-1-.448-1-1-1z" />
        </svg>
      ),
      color: "hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30",
    },
    {
      name: "YouTube",
      url: platforms.youtube,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
      color: "hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30",
    },
    {
      name: "Google Podcasts",
      url: platforms.google,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm-1.5 17.25v-3h3v3h-3zm0-4.5v-7.5h3v7.5h-3z" />
        </svg>
      ),
      color: "hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30",
    },
    {
      name: "Overcast",
      url: platforms.overcast,
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 24C5.373 24 0 18.627 0 12S5.373 0 12 0s12 5.373 12 12-5.373 12-12 12zm6-12c0-3.314-2.686-6-6-6s-6 2.686-6 6c0 2.498 1.527 4.638 3.694 5.548L8.276 20.4c-2.817-1.294-4.776-4.135-4.776-7.4 0-4.515 3.685-8.2 8.2-8.2s8.2 3.685 8.2 8.2c0 3.265-1.959 6.106-4.776 7.4l-1.418-2.852C16.473 16.638 18 14.498 18 12zm-6 3c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" />
        </svg>
      ),
      color: "hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/30",
    },
  ];

  const availablePlatforms = platformConfig.filter((p) => p.url);

  if (availablePlatforms.length === 0) {
    return null;
  }

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground mr-2">Listen on:</span>
        {availablePlatforms.map((platform) => (
          <a
            key={platform.name}
            href={platform.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-lg border border-border bg-background/50 backdrop-blur-sm transition-all duration-200 ${platform.color}`}
            aria-label={platform.name}
          >
            {platform.icon}
          </a>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Listen on your favorite platform
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {availablePlatforms.map((platform) => (
          <Button
            key={platform.name}
            variant="outline"
            asChild
            className={`flex items-center gap-2 transition-all duration-200 ${platform.color}`}
          >
            <a
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {platform.icon}
              <span className="text-sm">{platform.name}</span>
            </a>
          </Button>
        ))}
      </div>
    </div>
  );
}
