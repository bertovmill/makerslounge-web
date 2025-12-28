"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

export default function ToolsPage() {
  const [user, setUser] = useState<User | null>(null);

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

  const tools = [
    {
      name: "Matcher",
      description: "Find your perfect collaborator match based on skills and interests",
      href: "/matcher",
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
    <div className="min-h-screen md:ml-60">
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
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
                  tool.disabled && "pointer-events-none opacity-60"
                )}
              >
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
                  {!tool.disabled && (
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
            <Link
              href="/feedback"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Share Feedback
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
