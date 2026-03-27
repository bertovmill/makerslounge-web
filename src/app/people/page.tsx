"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Search, X } from "lucide-react";

interface Profile {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  skills: string[] | null;
  photo_url: string | null;
  currently_building: string | null;
  _type?: "profile" | "community";
}

export default function PeoplePage() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfiles() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, name, bio, skills, photo_url, currently_building")
        .order("name", { ascending: true });

      const allProfiles: Profile[] = (data || []).map((p) => ({ ...p, _type: "profile" as const }));

      // Admin sees all community contacts; others see public ones
      if (isAdmin) {
        const { data: contacts } = await supabase
          .from("community_contacts")
          .select("id, name, first_name, last_name, summary, skills")
          .order("name", { ascending: true });

        if (contacts) {
          const registeredEmails = new Set((data || []).map((p: Record<string, unknown>) => p.email));
          for (const c of contacts) {
            const displayName = c.name || [c.first_name, c.last_name].filter(Boolean).join(" ");
            if (!displayName) continue;
            allProfiles.push({
              id: c.id,
              username: null,
              name: displayName,
              bio: c.summary,
              skills: c.skills,
              photo_url: null,
              currently_building: null,
              _type: "community",
            });
          }
        }
      }

      setProfiles(allProfiles);
      setLoading(false);
    }
    fetchProfiles();
  }, [isAdmin]);

  // All unique skills sorted by frequency
  const allSkills = useMemo(() => {
    const map = new Map<string, number>();
    profiles.forEach((p) => {
      p.skills?.forEach((s) => {
        const normalized = s.trim();
        if (normalized) map.set(normalized, (map.get(normalized) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [profiles]);

  const filtered = useMemo(() => {
    return profiles.filter((p) => {
      // Only show profiles that have a name
      if (!p.name?.trim()) return false;

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.bio?.toLowerCase().includes(q) ||
        p.currently_building?.toLowerCase().includes(q) ||
        p.skills?.some((s) => s.toLowerCase().includes(q));

      const matchesSkill =
        !selectedSkill || p.skills?.some((s) => s.trim() === selectedSkill);

      return matchesSearch && matchesSkill;
    });
  }, [profiles, search, selectedSkill]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <div className="h-8 bg-secondary rounded animate-pulse w-48 mb-2" />
        <div className="h-4 bg-secondary rounded animate-pulse w-72 mb-8" />
        <div className="h-10 bg-secondary rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-52 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">
          People
        </h1>
        <p className="text-[13px] md:text-sm text-muted-foreground">
          {filtered.length} maker{filtered.length !== 1 ? "s" : ""} in the community
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, skill, or bio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Skill filters */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {allSkills.slice(0, 15).map((skill) => (
          <button
            key={skill}
            onClick={() => setSelectedSkill(selectedSkill === skill ? null : skill)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedSkill === skill
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {skill}
          </button>
        ))}
        {selectedSkill && !allSkills.slice(0, 15).includes(selectedSkill) && (
          <button
            onClick={() => setSelectedSkill(null)}
            className="px-3 py-1 rounded-full text-xs font-medium bg-foreground text-background"
          >
            {selectedSkill}
          </button>
        )}
      </div>

      {/* People grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm">No makers found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((profile) => (
            <Link
              key={`${profile._type}-${profile.id}`}
              href={
                profile._type === "community"
                  ? `/community/${profile.id}`
                  : profile.username
                    ? `/p/${profile.username}`
                    : `/profile/${profile.id}`
              }
              className="group rounded-xl border border-border bg-background p-5 hover:border-foreground/20 transition-colors"
            >
              <div className="flex items-start gap-3.5 mb-3">
                {profile.photo_url ? (
                  <img
                    src={profile.photo_url}
                    alt={profile.name || ""}
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                    profile._type === "community"
                      ? "bg-primary/10"
                      : "bg-secondary"
                  }`}>
                    <span className={`text-sm font-medium ${
                      profile._type === "community"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}>
                      {profile.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                      {profile.name}
                    </h3>
                    {profile._type === "community" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary shrink-0">
                        Community
                      </span>
                    )}
                  </div>
                  {profile.currently_building && (
                    <p className="text-xs text-muted-foreground truncate">
                      Building {profile.currently_building.replace(/[\[\]"]/g, '')}
                    </p>
                  )}
                </div>
              </div>

              {profile.bio && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {profile.bio}
                </p>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.skills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-full bg-secondary text-[11px] text-secondary-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                  {profile.skills.length > 4 && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-[11px] text-muted-foreground">
                      +{profile.skills.length - 4}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
