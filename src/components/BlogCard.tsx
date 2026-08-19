"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BlogPost } from "@/lib/blog-types";
import Link from "next/link";

interface BlogCardProps {
  post: BlogPost;
}

export default function BlogCard({ post }: BlogCardProps) {
  const formattedDate = new Date(post.publishDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const readTimeText = `${post.readTimeMinutes} min read`;

  const authorInitials = post.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/blog/${post.slug}`}>
      <Card className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Cover image or gradient placeholder */}
        <div className="relative aspect-video bg-gradient-to-br from-rose-400/20 to-orange-400/20">
          {post.coverImage ? (
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-primary/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}
          {/* Tag badges - show first tag */}
          {post.tags.length > 0 && (
            <div className="absolute top-3 left-3">
              <Badge variant="secondary" className="backdrop-blur-sm">
                {post.tags[0]}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg mb-1 line-clamp-2">
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt}
          </p>

          {/* Author */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden flex-shrink-0">
              {post.author.photo ? (
                <img
                  src={post.author.photo}
                  alt={post.author.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                authorInitials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {post.author.name}
              </p>
              {post.author.role && (
                <p className="text-xs text-muted-foreground truncate">
                  {post.author.role}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{formattedDate}</span>
            <span>{readTimeText}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
