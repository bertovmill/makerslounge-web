"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAllPostsAdmin } from "@/lib/blog-list-client";
import { deletePost } from "@/lib/blog-client";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  published_at: string | null;
  tags: string[];
  read_time_minutes: number;
}

export default function BlogPostsSection() {
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  // Named `loadPosts`: `fetchAllPostsAdmin` is the import, and a local `fetchPosts`
  // beside it invited the same shadowing trap as elsewhere in this migration.
  const loadPosts = async () => {
    try {
      setPosts(await fetchAllPostsAdmin());
    } catch (err) {
      console.error("Error fetching blog posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      if (!(await deletePost(postId))) throw new Error("delete failed");

      // Refresh the list
      loadPosts();
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post");
    }
  };

  return (
    <Card className="p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Blog Posts</h2>
          <p className="text-muted-foreground">
            {posts.length} total posts
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Post
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading blog posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No blog posts yet
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            // Determine post status
            const now = new Date();
            const publishDate = post.published_at ? new Date(post.published_at) : null;
            const isScheduled = post.is_published && publishDate && publishDate > now;
            const isPublished = post.is_published && publishDate && publishDate <= now;

            let statusBadge;
            if (!post.is_published) {
              statusBadge = <Badge variant="secondary" className="flex-shrink-0">Draft</Badge>;
            } else if (isScheduled) {
              statusBadge = <Badge variant="outline" className="border-blue-500 text-blue-600 flex-shrink-0">Scheduled</Badge>;
            } else {
              statusBadge = <Badge variant="default" className="flex-shrink-0">Published</Badge>;
            }

            return (
              <div
                key={post.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{post.title}</h3>
                    {statusBadge}
                    {post.is_featured && (
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600 flex-shrink-0">
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isScheduled && publishDate ? (
                      <>
                        Scheduled for {publishDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </>
                    ) : isPublished && publishDate ? (
                      <>
                        Published {publishDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </>
                    ) : (
                      <>
                        Created {new Date(post.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </>
                    )}
                    {" • "}
                    {post.tags.length} {post.tags.length === 1 ? "tag" : "tags"}
                    {" • "}
                    {post.read_time_minutes} min read
                  </p>
              </div>

                <div className="flex gap-2 flex-shrink-0">
                  {isPublished && (
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        View
                      </Link>
                    </Button>
                  )}
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/blog/${post.id}`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </Link>
                </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(post.id, post.title)}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
