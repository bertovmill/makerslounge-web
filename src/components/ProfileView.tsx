"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface ProfileViewProps {
  profile: {
    id: string;
    name: string | null;
    photo_url: string | null;
    bio: string | null;
    skills: string[] | null;
    looking_for_skills: string[] | null;
    currently_building: string | null;
    linkedin: string | null;
    twitter: string | null;
    instagram: string | null;
    website: string | null;
  };
}

export default function ProfileView({ profile }: ProfileViewProps) {
  const initials = profile.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const socialLinks = [
    profile.linkedin && { label: "LinkedIn", href: profile.linkedin },
    profile.twitter && { label: "X", href: profile.twitter },
    profile.instagram && { label: "Instagram", href: profile.instagram },
    profile.website && { label: "Website", href: profile.website },
  ].filter(Boolean) as { label: string; href: string }[];

  let buildingItems: string[] = [];
  if (profile.currently_building) {
    try {
      const parsed = JSON.parse(profile.currently_building);
      buildingItems = Array.isArray(parsed) ? parsed : [profile.currently_building];
    } catch {
      buildingItems = [profile.currently_building];
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-12">
      {/* Avatar + Name */}
      <div className="flex flex-col items-center text-center md:flex-row md:text-left gap-4 mb-8 md:mb-6">
        <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-lg overflow-hidden shrink-0">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt={profile.name || ""} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold md:font-semibold">{profile.name || "Anonymous"}</h1>
          {profile.bio && (
            <p className="text-[14px] md:text-sm text-muted-foreground mt-1 md:mt-0.5">{profile.bio}</p>
          )}
        </div>
      </div>

      {/* Info sections in iOS grouped style on mobile */}
      <div className="space-y-4 md:space-y-6">
        {/* Currently building */}
        {buildingItems.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent p-4 md:p-0">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-2">Currently building</h2>
            <ul className="space-y-1">
              {buildingItems.map((item, i) => (
                <li key={i} className="text-[15px] md:text-sm text-foreground md:text-muted-foreground">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent p-4 md:p-0">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-2">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full md:rounded-md bg-secondary text-xs text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Looking for */}
        {profile.looking_for_skills && profile.looking_for_skills.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent p-4 md:p-0">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground mb-2">Looking for</h2>
            <div className="flex flex-wrap gap-1.5">
              {profile.looking_for_skills.map((skill) => (
                <span key={skill} className="px-2.5 py-1 rounded-full md:rounded-md bg-secondary text-xs text-muted-foreground">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Social links */}
        {socialLinks.length > 0 && (
          <div className="rounded-xl md:rounded-none bg-card md:bg-transparent overflow-hidden">
            <h2 className="text-[13px] md:text-sm font-medium text-muted-foreground md:text-foreground px-4 md:px-0 pt-4 md:pt-0 mb-1 md:mb-2">Links</h2>
            {socialLinks.map((link, i) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-4 md:px-0 py-3 md:py-1 text-[15px] md:text-sm active:bg-secondary/50 md:active:bg-transparent transition-colors ${
                  i < socialLinks.length - 1 ? "border-b border-border/50 md:border-none" : ""
                }`}
              >
                <span className="text-foreground md:text-muted-foreground">{link.label}</span>
                <ExternalLink className="w-4 h-4 md:w-3 md:h-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Back */}
      <div className="mt-8 md:mt-10 pt-6 border-t border-border">
        <Link href="/people" className="text-sm text-muted-foreground hover:text-foreground">
          &larr; Back to people
        </Link>
      </div>
    </div>
  );
}
