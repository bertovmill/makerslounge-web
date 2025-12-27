"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PodcastPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Podcast</h1>
        <p className="text-muted-foreground mb-8">
          Coming soon — conversations with makers building the future.
        </p>

        <Card className="glass-card p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">Stay tuned</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;re working on bringing you interviews and stories from the maker community.
          </p>
          <Button variant="outline" className="rounded-full" disabled>
            Subscribe — Coming Soon
          </Button>
        </Card>
      </div>
    </div>
  );
}
