"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { fetchProfiles } from "@/lib/profiles-client";
import { fetchContacts, createContact } from "@/lib/contacts-client";
import { useAuth } from "@/context/AuthContext";
import { Search, X, UserPlus } from "lucide-react";

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

interface AddPersonForm {
  name: string;
  email: string;
  bio: string;
  skills: string;
  company: string;
  role: string;
}

const EMPTY_FORM: AddPersonForm = { name: "", email: "", bio: "", skills: "", company: "", role: "" };

export default function PeoplePage() {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddPersonForm>(EMPTY_FORM);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Named `loadPeople`: `fetchProfiles` and `fetchContacts` are imported.
  async function loadPeople() {
    const rows = await fetchProfiles({ sort: "name" });

    const allProfiles: Profile[] = rows.map((p) => ({
      id: p.id,
      username: p.username,
      name: p.name,
      bio: p.bio,
      skills: p.skills,
      photo_url: p.photo_url,
      currently_building: p.currently_building,
      _type: "profile" as const,
    }));

    // Still gated on `isAdmin` for the request, but the route is the boundary now:
    // a non-admin gets only contacts marked public regardless of what the UI asks for.
    if (isAdmin) {
      const contacts = await fetchContacts();
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

    setProfiles(allProfiles);
    setLoading(false);
  }

  useEffect(() => {
    loadPeople();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  async function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setAddLoading(true);
    setAddError(null);

    const skillsArray = addForm.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await createContact({
      name: addForm.name.trim(),
      email: addForm.email.trim() || null,
      summary: addForm.bio.trim() || null,
      skills: skillsArray.length ? skillsArray : null,
      company: addForm.company.trim() || null,
      role: addForm.role.trim() || null,
    });

    if (!result.success) {
      setAddError(result.error ?? "Could not add this person.");
      setAddLoading(false);
      return;
    }

    setAddLoading(false);
    setShowAddModal(false);
    setAddForm(EMPTY_FORM);
    await loadPeople();
  }

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[28px] md:text-2xl font-bold md:font-semibold tracking-tight mb-0.5">
            People
          </h1>
          <p className="text-[13px] md:text-sm text-muted-foreground">
            {filtered.length} maker{filtered.length !== 1 ? "s" : ""} in the community
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add person
          </button>
        )}
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
      {/* Add Person Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-background shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold">Add person</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPerson} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Company</label>
                  <input
                    type="text"
                    placeholder="Acme Inc."
                    value={addForm.company}
                    onChange={(e) => setAddForm((f) => ({ ...f, company: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                  <input
                    type="text"
                    placeholder="Founder, Engineer..."
                    value={addForm.role}
                    onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  placeholder="optional"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Bio / Summary</label>
                <textarea
                  rows={3}
                  placeholder="What are they working on?"
                  value={addForm.bio}
                  onChange={(e) => setAddForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  Skills <span className="font-normal">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  placeholder="React, AI, Design..."
                  value={addForm.skills}
                  onChange={(e) => setAddForm((f) => ({ ...f, skills: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              {addError && (
                <p className="text-xs text-destructive">{addError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading || !addForm.name.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  {addLoading ? "Adding..." : "Add person"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
