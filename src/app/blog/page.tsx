"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import BlogCard from "@/components/BlogCard";
import EmailSignup from "@/components/EmailSignup";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPosts, getAllPosts, getAllTags } from "@/lib/blog";

function BlogContent() {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const featuredPosts = getFeaturedPosts();
  const allPosts = getAllPosts();
  const allTags = getAllTags();

  // Filter posts based on selected tag and search query
  const filteredPosts = useMemo(() => {
    let filtered = allPosts;

    if (selectedTag) {
      filtered = filtered.filter((post) => post.tags.includes(selectedTag));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(query) ||
          post.excerpt.toLowerCase().includes(query) ||
          post.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [allPosts, selectedTag, searchQuery]);

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-3 gap-1">
          <img
            src="/makerslounge-photos/hackathon-working.jpeg"
            alt="Makers working together"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/presenting-slides.jpeg"
            alt="Workshop presentation"
            className="w-full h-full object-cover"
          />
          <img
            src="/makerslounge-photos/lounge-working.jpeg"
            alt="Hands-on learning"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
          <Badge variant="secondary" className="mb-3">
            MakersLounge Blog
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Stories from the maker community
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Insights, lessons, and stories from Toronto's most creative builders
            and makers.
          </p>
        </div>
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="relative py-20 bg-background">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-4">
                Featured
              </Badge>
              <h2 className="text-4xl font-bold mb-4">Latest Posts</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Discover the latest stories and insights from our community
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Search and Filter Section */}
      <section className="relative py-12 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts by title, topic, or tag..."
                className="w-full px-4 py-3 pl-12 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedTag === null
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                All Posts
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* All Posts */}
      <section className="relative py-20 bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2">
              {selectedTag
                ? `Posts tagged "${selectedTag}"`
                : searchQuery
                ? `Search results for "${searchQuery}"`
                : "All Posts"}
            </h2>
            <p className="text-muted-foreground">
              {filteredPosts.length === 0
                ? "No posts found"
                : `${filteredPosts.length} post${filteredPosts.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {filteredPosts.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <Card className="glass-card p-12 text-center">
              <svg
                className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-xl font-semibold mb-2">No posts found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter to find what you're looking
                for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag(null);
                }}
                className="text-primary hover:underline"
              >
                Clear filters
              </button>
            </Card>
          )}
        </div>
      </section>

      {/* Email Signup */}
      <section className="relative py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="glass-card p-12">
            <EmailSignup
              title="Get New Posts in your inbox"
              description="Subscribe to our email list and be the first to know when new blog posts and events are released."
            />
          </Card>
        </div>
      </section>

      {/* About Section */}
      <section className="relative py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About the Blog</h2>
            <div className="prose prose-lg mx-auto text-muted-foreground">
              <p>
                The MakersLounge blog shares stories, insights, and lessons from
                Toronto's vibrant maker community. From hardware startups to AI
                innovations, we explore the creative process behind exceptional
                work.
              </p>
              <p className="mt-4">
                Whether you're building your first product or scaling your tenth
                company, you'll find practical wisdom and inspiration from fellow
                makers who've been there.
              </p>
            </div>
          </div>

          {/* Contact */}
          <Card className="glass-card p-8 text-center">
            <h3 className="font-semibold text-lg mb-2">
              Want to contribute?
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              We're always looking for interesting stories from the maker
              community.
            </p>
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
              <a href="mailto:hello@makerslounge.com?subject=Blog Contribution">
                Get in touch
              </a>
            </button>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function BlogPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-muted-foreground">Loading blog...</div>
        </div>
      }
    >
      <BlogContent />
    </Suspense>
  );
}
