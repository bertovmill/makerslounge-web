"use client";

import { useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, ArrowUp, Users, Sparkles, Calendar, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/home";
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { resolved, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");
  const router = useRouter();
  const [query, setQuery] = useState("");

  const quickActions = [
    { label: "Browse makers", icon: Users, href: "/people" },
    { label: "AI match", icon: Sparkles, href: "/matcher" },
    { label: "Upcoming events", icon: Calendar, href: "/events" },
    { label: "Post a project", icon: Briefcase, href: "/auth?mode=signup" },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/auth${params}`);
  }

  return (
    <div className="min-h-svh flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 pt-6">
        <span className="text-xl font-serif tracking-tight">makerslounge</span>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/auth"
            className="text-sm font-medium px-4 py-2 rounded-md bg-foreground text-background hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm font-medium px-4 py-2 rounded-md border border-border hover:bg-secondary transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero — Manus-style centered layout */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] tracking-tight leading-[1.15] mb-10 text-center">
          How can the community
          <br />
          help you?
        </h1>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="w-full max-w-[640px] mb-6">
          <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe what you're looking for..."
              rows={3}
              className="w-full resize-none bg-transparent px-5 pt-4 pb-12 text-[15px] placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <div className="absolute bottom-3 right-3">
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30"
                disabled={!query.trim()}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Quick action pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
