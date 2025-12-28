"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UserCard from "@/components/UserCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Profile {
  id: string;
  name: string | null;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
}

const SKILL_FILTERS = [
  "AI", "Web Dev", "Design", "Marketing", "Sales", "Product",
  "Mobile Dev", "Data Science", "E-commerce", "Community"
];

function PeopleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get("skills")?.split(",").filter(Boolean) || []
  );
  const [totalCount, setTotalCount] = useState(0);
  const [searchInterpretation, setSearchInterpretation] = useState<string>("");
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Get current user for similarity searches
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id });
      }
    });
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    try {
      // Call AI-powered search API
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          currentUserId: user?.id,
          filters: { skills: selectedSkills }
        })
      });

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const { results, metadata } = await response.json();

      // Deduplicate profiles by name (keep first occurrence)
      const seen = new Set<string>();
      const uniqueProfiles = (results || []).filter((profile: Profile) => {
        const key = profile.name?.toLowerCase() || profile.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setProfiles(uniqueProfiles);
      setTotalCount(uniqueProfiles.length);
      setSearchInterpretation(metadata.interpretation || "");
    } catch (err) {
      console.error("AI search error:", err);
      setSearchInterpretation("Search failed. Please try again.");
      setProfiles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSkills, user?.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProfiles]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedSkills.length > 0) params.set("skills", selectedSkills.join(","));

    const newUrl = params.toString() ? `/people?${params.toString()}` : "/people";
    router.replace(newUrl, { scroll: false });
  }, [searchQuery, selectedSkills, router]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSkills([]);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner with People Photos */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="/makerslounge-photos/lounge-networking.jpeg"
            alt="Networking at MakersLounge"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/coffee-chat.jpeg"
            alt="Coffee chat"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/team-photo.jpeg"
            alt="MakersLounge community"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Discover Makers
          </h1>
          <p className="text-muted-foreground">
            Find and connect with talented people in the community
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search makers..."
              className="w-full px-6 py-5 text-xl bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
            />
            {searchQuery || selectedSkills.length > 0 ? (
              <button
                onClick={clearFilters}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                Clear
              </button>
            ) : (
              <svg
                className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>

        {/* Skills Filter Pills */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {SKILL_FILTERS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedSkills.includes(skill)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card text-muted-foreground hover:bg-secondary border border-border"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* AI Interpretation */}
        {searchInterpretation && !loading && (
          <div className="max-w-3xl mx-auto mb-4">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-primary">AI:</span> {searchInterpretation}
              </p>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="text-center text-sm text-muted-foreground mb-6">
          {loading ? (
            <span>AI analyzing your search...</span>
          ) : (
            `${totalCount} ${totalCount === 1 ? "person" : "people"} found`
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">AI analyzing your search...</p>
              <p className="text-xs text-muted-foreground/60 mt-1">This may take a few seconds</p>
            </div>
          </div>
        ) : profiles.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <p className="text-muted-foreground mb-2">No people found</p>
            <p className="text-sm text-muted-foreground/70">
              Try adjusting your search or filters
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {profiles.map((profile) => (
              <UserCard
                key={profile.id}
                user={profile}
                showSkills={true}
                highlightedSkills={selectedSkills}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <PeopleContent />
    </Suspense>
  );
}
