"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { ArrowRight, Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [projects, setProjects] = useState<string[]>([""]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth"); return; }
        setUser(user);

        // Check if profile already has a name (already onboarded)
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, first_name, last_name, currently_building")
          .eq("id", user.id)
          .single();

        if (profile?.name) {
          router.push("/home");
          return;
        }

        // Pre-fill name from auth metadata
        if (user.user_metadata?.full_name) {
          const parts = user.user_metadata.full_name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }
      } catch (error) {
        console.error("Onboarding auth check error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();
      const filteredProjects = projects.filter(p => p.trim());

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name,
        currently_building: filteredProjects.length > 0 ? JSON.stringify(filteredProjects) : null,
      });

      if (error) throw error;
      router.push("/home");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaving(false);
    }
  };

  const canSave = firstName.trim().length > 0;

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex items-start md:items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight mb-1">
          Welcome to MakersLounge
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Tell us a bit about yourself to get started.
        </p>

        <div className="space-y-5">
          {/* Name */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                autoFocus
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1.5">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              />
            </div>
          </div>

          {/* Projects */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              What project(s) are you working on?
            </label>
            {projects.map((project, i) => (
              <input
                key={i}
                type="text"
                value={project}
                onChange={e => {
                  const u = [...projects]; u[i] = e.target.value; setProjects(u);
                }}
                placeholder={i === 0 ? "e.g., A marketplace for local artisans" : "Another project..."}
                className="w-full h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 mb-2"
              />
            ))}
            {projects.length < 3 && (
              <button
                type="button"
                onClick={() => setProjects([...projects, ""])}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                + Add another project
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full h-11 md:h-10 mt-8 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Get started
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <button
          onClick={() => router.push("/home")}
          className="w-full text-sm text-muted-foreground hover:text-foreground mt-3 py-2"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
