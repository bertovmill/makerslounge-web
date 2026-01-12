"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function VideoEditingPage() {
  const tools = [
    {
      name: "Recorder",
      description: "Record webcam, screen, or both with built-in controls",
      href: "/video-editing/recorder",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
      gradient: "from-red-500 to-rose-500",
    },
    {
      name: "Brand Studio",
      description: "Generate on-brand graphics: title cards, lower thirds, and more",
      href: "/video-editing/brand-studio",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      ),
      gradient: "from-violet-500 to-purple-500",
    },
    {
      name: "Hook Generator",
      description: "Generate attention-grabbing video hooks that keep viewers watching",
      href: "/video-editing/hook-generator",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      gradient: "from-amber-500 to-orange-500",
    },
    {
      name: "More Coming Soon",
      description: "Thumbnail Lab, Highlight Clipper, and more tools on the way",
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
      gradient: "from-gray-400 to-gray-500",
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-8">
          {/* Back link */}
          <Link
            href="/tools"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tools
          </Link>

          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Video Editing</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A suite of video editing tools to help makers create, edit, and share their content
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

          {/* Coming soon message */}
          <div className="mt-12 glass-card rounded-xl p-8 text-center">
            <h2 className="text-2xl font-semibold mb-3">What tools would you like to see?</h2>
            <p className="text-muted-foreground mb-6">
              We're building this suite based on what makers need. Let us know what video tools would help you most!
            </p>
            <Link
              href="/feedback"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Share your ideas
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
