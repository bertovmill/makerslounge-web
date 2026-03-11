"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowUp, Users, Sparkles, Calendar, Briefcase } from "lucide-react";
import Link from "next/link";

const quickActions = [
  { label: "Browse makers", icon: Users, href: "/people" },
  { label: "AI match", icon: Sparkles, href: "/matcher" },
  { label: "Upcoming events", icon: Calendar, href: "/events" },
  { label: "Post a project", icon: Briefcase, href: "/profile" },
];

export default function NewTaskPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/matcher?q=${encodeURIComponent(query.trim())}`);
    }
  }

  if (loading || !user) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[calc(100svh-3rem)] md:min-h-svh">
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
    </div>
  );
}
