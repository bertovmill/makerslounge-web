"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function PodcastHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Gradient orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-orange-500/15 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/3 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Wave gradient accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-wave" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <Badge
            variant="outline"
            className="mb-8 px-4 py-2 text-sm border-white/20 text-white/80 bg-white/5 backdrop-blur-sm"
          >
            MakersLounge Podcast
          </Badge>

          {/* Microphone icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-orange-500/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/10">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8 text-white tracking-tight">
            Conversations with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
              makers
            </span>
          </h1>

          <p className="text-xl text-white/60 mb-10 leading-relaxed max-w-2xl mx-auto">
            MakersLounge interviews some of the most productive and creative individuals in the world — and discusses what is their process to creating their best work.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-10">
            <div className="text-white/80">
              <span className="text-white font-semibold">3 Episodes</span> available
            </div>
            <div className="w-1 h-1 bg-white/40 rounded-full" />
            <div className="text-white/80">
              New episodes <span className="text-white font-semibold">weekly</span>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full px-8 py-6 text-lg bg-white text-slate-900 hover:bg-white/90 shadow-lg shadow-white/10"
            >
              <a href="#episodes">Browse episodes</a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-lg border-white/20 text-white bg-white/5 backdrop-blur-sm hover:bg-white/10"
              asChild
            >
              <a
                href="https://open.spotify.com/show/example"
                target="_blank"
                rel="noopener noreferrer"
              >
                Subscribe on Spotify
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs uppercase tracking-widest">Scroll</span>
        <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
}
