"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UserCard from "@/components/UserCard";
import MatcherDrawer from "@/components/MatcherDrawer";
import { Search, X, Sparkles } from "lucide-react";

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
  const [matcherOpen, setMatcherOpen] = useState(false);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("profiles")
        .select("id, name, photo_url, bio, skills");

      if (searchQuery.trim()) {
        const searchTerm = `%${searchQuery.trim()}%`;
        query = query.or(`name.ilike.${searchTerm},bio.ilike.${searchTerm}`);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      let filteredProfiles = data || [];

      if (selectedSkills.length > 0) {
        filteredProfiles = filteredProfiles.filter((profile) => {
          if (!profile.skills || profile.skills.length === 0) return false;
          return selectedSkills.some((selectedSkill) =>
            profile.skills!.some(
              (profileSkill: string) =>
                profileSkill.toLowerCase().includes(selectedSkill.toLowerCase()) ||
                selectedSkill.toLowerCase().includes(profileSkill.toLowerCase())
            )
          );
        });
      }

      const seen = new Set<string>();
      const uniqueProfiles = filteredProfiles.filter((profile) => {
        const key = profile.name?.toLowerCase() || profile.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setProfiles(uniqueProfiles);
      setTotalCount(uniqueProfiles.length);
    } catch (err) {
      console.error("Search error:", err);
      setProfiles([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSkills]);

  useEffect(() => {
    const timer = setTimeout(() => fetchProfiles(), 300);
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
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const hasFilters = searchQuery || selectedSkills.length > 0;

  return (
    <div className="flex min-h-0">
      {/* Main content — shrinks when drawer opens */}
      <div className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-8">
          {/* Header */}
          <div className="mb-5 md:mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">People</h1>
              <p className="text-[13px] md:text-sm text-muted-foreground">
                {loading ? "Searching..." : `${totalCount} makers in the community`}
              </p>
            </div>
            <button
              onClick={() => setMatcherOpen(!matcherOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                matcherOpen
                  ? "bg-secondary text-foreground"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Match</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3 md:mb-4">
            <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or bio..."
              className="w-full h-9 md:h-10 pl-9 md:pl-10 pr-9 md:pr-10 rounded-[10px] md:rounded-md bg-secondary md:bg-background md:border md:border-input text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(""); setSelectedSkills([]); }}
                className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Skill filters */}
          <div className="flex gap-1.5 mb-6 md:mb-8 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
            {SKILL_FILTERS.map((skill) => (
              <button
                key={skill}
                onClick={() => toggleSkill(skill)}
                className={`px-3 py-1.5 rounded-full md:rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedSkills.includes(skill)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className={`grid gap-3 ${matcherOpen ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-md border border-border p-5 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-secondary animate-pulse" />
                  <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No people found. Try adjusting your search.</p>
            </div>
          ) : (
            <div className={`grid gap-3 ${matcherOpen ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
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

      {/* Matcher drawer — inline on desktop, overlay on mobile */}
      <MatcherDrawer open={matcherOpen} onClose={() => setMatcherOpen(false)} />
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="h-8 bg-secondary rounded animate-pulse w-32 mb-8" />
          <div className="h-10 bg-secondary rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border p-5 space-y-3">
                <div className="w-12 h-12 rounded-full bg-secondary animate-pulse" />
                <div className="h-4 bg-secondary rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        </div>
      }
    >
      <PeopleContent />
    </Suspense>
  );
}
