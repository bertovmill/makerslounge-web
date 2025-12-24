"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UserCard from "@/components/UserCard";

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

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    try {
      let query = supabase
        .from("profiles")
        .select("id, name, photo_url, bio, skills", { count: "exact" });

      // Apply search using ILIKE for name and bio
      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
        );
      }

      // Apply skills filter if selected
      if (selectedSkills.length > 0) {
        query = query.overlaps("skills", selectedSkills);
      }

      // Order by name
      query = query.order("name", { ascending: true, nullsFirst: false });
      query = query.limit(50);

      const { data, count, error } = await query;

      if (error) {
        console.error("Search error:", error);
        setProfiles([]);
        setTotalCount(0);
      } else {
        setProfiles(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedSkills]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProfiles]);

  // Update URL params
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
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
            Discover Makers
          </h1>
          <p className="text-gray-600">
            Find and connect with talented people in the community
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center bg-white rounded-full shadow-lg p-2">
            <svg
              className="w-5 h-5 text-gray-400 ml-4"
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
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, bio, or skills..."
              className="flex-1 px-4 py-3 text-lg bg-transparent outline-none"
            />
            {(searchQuery || selectedSkills.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-gray-400 hover:text-gray-600 px-4"
              >
                Clear
              </button>
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedSkills.includes(skill)
                    ? "bg-[#1a1a1a] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="text-center text-sm text-gray-500 mb-6">
          {loading ? (
            "Searching..."
          ) : (
            `${totalCount} ${totalCount === 1 ? "person" : "people"} found`
          )}
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <p className="text-gray-500 mb-2">No people found</p>
            <p className="text-sm text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
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
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      }
    >
      <PeopleContent />
    </Suspense>
  );
}
