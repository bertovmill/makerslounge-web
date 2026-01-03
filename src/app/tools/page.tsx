"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export default function ToolsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [toolIdea, setToolIdea] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (user === null) {
      // Wait a moment to ensure we've checked auth state
      const timer = setTimeout(() => {
        if (!user) {
          window.location.href = "/auth";
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolIdea.trim() || submitting) return;

    setSubmitting(true);
    try {
      await supabase.from("feedback").insert({
        message: `Tool Idea: ${toolIdea}`,
        email: user?.email || null,
        completed: false,
      });

      setSubmitted(true);
      setToolIdea("");

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting tool idea:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const isAllowedUser = user?.email === "bertmill19@gmail.com";

  const tools = [
    {
      name: "Matcher",
      description: "Find your perfect collaborator match based on skills and interests",
      href: isAllowedUser ? "/matcher" : "#",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
      gradient: "from-pink-500 to-rose-500",
      comingSoon: !isAllowedUser,
    },
    // Placeholder for future tools
    {
      name: "More Tools Coming Soon",
      description: "We're building more tools to help makers collaborate and grow",
      href: "#",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      ),
      gradient: "from-blue-500 to-indigo-500",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold tracking-tight">Maker Tools</h1>
            <p className="text-lg text-muted-foreground">
              Powerful tools to help you connect, collaborate, and grow in the maker community
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
                  (tool.disabled || tool.comingSoon) && "pointer-events-none opacity-60"
                )}
              >
                {/* Coming Soon Badge */}
                {tool.comingSoon && (
                  <div className="absolute top-4 right-4 px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Coming Soon
                  </div>
                )}

                {/* Gradient background on hover */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-5",
                    tool.gradient
                  )}
                />

                <div className="relative space-y-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "inline-flex rounded-lg bg-gradient-to-br p-3 text-white transition-transform duration-300 group-hover:scale-110",
                      tool.gradient
                    )}
                  >
                    {tool.icon}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tool.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  {!tool.disabled && !tool.comingSoon && (
                    <div className="flex items-center text-sm font-medium text-primary transition-transform duration-300 group-hover:translate-x-1">
                      Try it out
                      <svg
                        className="ml-1 w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Call to action */}
          <div className="mt-12 glass-card rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">Have a tool idea?</h2>
            <p className="text-muted-foreground mb-6">
              We're always looking to build tools that help makers succeed. Share your ideas with us!
            </p>

            {submitted ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500/10 text-green-600 font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Thanks! Your idea was taken
              </div>
            ) : (
              <form onSubmit={handleSubmitIdea} className="max-w-md mx-auto">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={toolIdea}
                    onChange={(e) => setToolIdea(e.target.value)}
                    placeholder="Describe your tool idea..."
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={submitting}
                  />
                  <button
                    type="submit"
                    disabled={!toolIdea.trim() || submitting}
                    className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
