"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import SkillsInput from "@/components/SkillsInput";
import type { ProfileData } from "./ProfilePreview";
import { getGitHubAuthUrl } from "@/lib/github-oauth";

interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  html_url: string;
  stargazers_count: number;
  updated_at: string;
}

interface GitHubData {
  name: string;
  bio: string | null;
  blog: string | null;
  twitter_username: string | null;
  repos: GitHubRepo[];
  languages: string[];
}

interface GitHubImportProps {
  onComplete: (data: ProfileData) => void;
  onBack: () => void;
}

export default function GitHubImport({ onComplete, onBack }: GitHubImportProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GitHubData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepos, setSelectedRepos] = useState<Set<string>>(new Set());
  const [skills, setSkills] = useState<string[]>([]);
  const [lookingForSkills, setLookingForSkills] = useState<string[]>([]);

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        const res = await fetch("/api/github/repos");
        if (res.status === 401) {
          // No token — redirect to GitHub OAuth
          window.location.href = getGitHubAuthUrl();
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch GitHub data");
        const ghData: GitHubData = await res.json();
        setData(ghData);

        // Pre-select top 5 repos
        const topRepos = ghData.repos.slice(0, 5).map(r => r.name);
        setSelectedRepos(new Set(topRepos));

        // Infer skills from languages
        const langToSkill: Record<string, string> = {
          JavaScript: "Web Dev", TypeScript: "Web Dev", Python: "Backend",
          Rust: "Backend", Go: "Backend", Java: "Backend", "C#": "Backend",
          Swift: "Mobile Dev", Kotlin: "Mobile Dev", Dart: "Mobile Dev",
          Ruby: "Backend", PHP: "Backend", HTML: "Frontend", CSS: "Frontend",
          Shell: "DevOps", Dockerfile: "DevOps", HCL: "DevOps",
          Jupyter: "Data Science", R: "Data Science",
        };
        const inferred = new Set<string>();
        ghData.languages.forEach(lang => {
          const skill = langToSkill[lang];
          if (skill) inferred.add(skill);
        });
        setSkills(Array.from(inferred));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load GitHub data");
      } finally {
        setLoading(false);
      }
    };
    fetchGitHubData();
  }, []);

  const toggleRepo = (name: string) => {
    setSelectedRepos(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleContinue = () => {
    if (!data) return;
    const nameParts = (data.name || "").split(" ");
    const projectDescriptions = data.repos
      .filter(r => selectedRepos.has(r.name))
      .map(r => r.description ? `${r.name}: ${r.description}` : r.name);

    onComplete({
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      projects: projectDescriptions.length > 0 ? projectDescriptions : [""],
      skills,
      lookingForSkills,
      linkedin: "",
      twitter: data.twitter_username || "",
      instagram: "",
      website: data.blog || "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Fetching your GitHub profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-svh flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-sm text-destructive mb-4">{error}</p>
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground underline">
            Go back and try another option
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-svh flex items-start md:items-center justify-center px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-md md:max-w-lg">
        <h1 className="text-[24px] md:text-2xl font-bold md:font-semibold tracking-tight mb-1">
          Import from GitHub
        </h1>
        <p className="text-[13px] md:text-sm text-muted-foreground mb-6">
          We found your profile! Select repos and adjust skills below.
        </p>

        <div className="space-y-6 mb-8">
          {/* Name preview */}
          {data.name && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Name</label>
              <p className="text-sm">{data.name}</p>
            </div>
          )}

          {/* Repos */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Select repos to feature ({selectedRepos.size} selected)
            </label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto rounded-lg border border-border p-2">
              {data.repos.map(repo => (
                <label
                  key={repo.name}
                  className={`flex items-start gap-3 p-2 rounded-md cursor-pointer transition-colors ${
                    selectedRepos.has(repo.name) ? "bg-primary/10" : "hover:bg-secondary"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedRepos.has(repo.name)}
                    onChange={() => toggleRepo(repo.name)}
                    className="mt-0.5 rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{repo.name}</span>
                      {repo.language && (
                        <span className="text-xs text-muted-foreground">{repo.language}</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                    )}
                  </div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground"
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </label>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Skills (inferred from languages)
            </label>
            <SkillsInput skills={skills} onChange={setSkills} maxSkills={10} />
          </div>

          {/* Looking for */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Who do you want to meet?
            </label>
            <SkillsInput skills={lookingForSkills} onChange={setLookingForSkills} maxSkills={10} mode="looking_for" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="h-11 md:h-10 px-4 rounded-xl md:rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleContinue}
            disabled={skills.length === 0}
            className="flex-1 h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Preview profile
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
