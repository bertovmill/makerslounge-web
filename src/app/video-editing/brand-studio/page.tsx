"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadBrand, BrandConfig, defaultBrand } from "@/lib/brand-storage";
import { cn } from "@/lib/utils";

export default function BrandStudioPage() {
  const [brand, setBrand] = useState<BrandConfig>(defaultBrand);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBrand(loadBrand());
    setLoaded(true);
  }, []);

  const generators = [
    {
      name: "Title Card",
      description: "Eye-catching intro slides for your videos",
      href: "/video-editing/brand-studio/title-card",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      name: "Lower Third",
      description: "Name and title overlays for speakers",
      href: "/video-editing/brand-studio/lower-third",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      comingSoon: true,
    },
    {
      name: "Section Header",
      description: "Dividers between video sections",
      href: "/video-editing/brand-studio/section-header",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      comingSoon: true,
    },
    {
      name: "End Screen",
      description: "Call-to-action outros",
      href: "/video-editing/brand-studio/end-screen",
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      ),
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="space-y-8">
          {/* Back link */}
          <Link
            href="/video-editing"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Video Editing
          </Link>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Brand Studio</h1>
              <p className="text-muted-foreground mt-1">
                Generate on-brand graphics for your videos
              </p>
            </div>
            <Link
              href="/video-editing/brand-studio/setup"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Brand Settings
            </Link>
          </div>

          {/* Current Brand Preview */}
          {loaded && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-medium text-muted-foreground mb-4">Current Brand</h2>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Colors:</span>
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: brand.primaryColor }}
                      title="Primary"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: brand.secondaryColor }}
                      title="Secondary"
                    />
                    <div
                      className="w-6 h-6 rounded-full border border-border"
                      style={{ backgroundColor: brand.accentColor }}
                      title="Accent"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Font:</span>
                  <span className="text-sm font-medium">{brand.fontHeading}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Style:</span>
                  <span className="text-sm font-medium capitalize">{brand.style}</span>
                </div>
              </div>
            </div>
          )}

          {/* Generators Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {generators.map((gen) => (
              <Link
                key={gen.name}
                href={gen.comingSoon ? "#" : gen.href}
                className={cn(
                  "group relative flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200",
                  gen.comingSoon
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-primary/50 hover:shadow-lg"
                )}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {gen.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{gen.name}</h3>
                    {gen.comingSoon && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{gen.description}</p>
                </div>
                {!gen.comingSoon && (
                  <svg
                    className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
