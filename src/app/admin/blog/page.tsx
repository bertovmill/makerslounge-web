import { redirect } from "next/navigation";
import { getServerAppUser } from "@/lib/clerk-server";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getAllPostsAdmin } from "@/lib/blog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DeletePostButton from "./DeletePostButton";

export default async function AdminBlogPage() {
  // Check authentication
  const user = await getServerAppUser();

  if (!user || user.email !== "bertmill19@gmail.com") {
    redirect("/profile");
  }

  // Fetch all posts (including drafts)
  const posts = await getAllPostsAdmin();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge variant="secondary" className="mb-4">
              Blog Admin
            </Badge>
            <h1 className="text-4xl font-bold mb-2">Manage Blog Posts</h1>
            <p className="text-muted-foreground">
              Create, edit, and manage all blog posts
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/admin/blog/new">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Post
            </Link>
          </Button>
        </div>

        {posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-6">No blog posts yet</p>
            <Button asChild>
              <Link href="/admin/blog/new">Create your first post</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const authorName = Array.isArray(post.profiles)
                ? post.profiles[0]?.name || "Unknown"
                : post.profiles?.name || "Unknown";

              return (
                <Card key={post.id} className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-bold truncate">
                          {post.title}
                        </h2>
                        <Badge variant={post.is_published ? "default" : "secondary"}>
                          {post.is_published ? "Published" : "Draft"}
                        </Badge>
                        {post.is_featured && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Featured
                          </Badge>
                        )}
                        {post.tags?.includes("newsletter") && (
                          <Badge
                            variant="outline"
                            className={
                              post.newsletter_sent_at
                                ? "border-green-500 text-green-600"
                                : "border-blue-500 text-blue-600"
                            }
                          >
                            {post.newsletter_sent_at
                              ? `Newsletter sent ${new Date(post.newsletter_sent_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                              : "Newsletter (not sent)"}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>By {authorName}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}</span>
                        {post.published_at && (
                          <>
                            <span>•</span>
                            <span>Published {new Date(post.published_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{post.tags.length} {post.tags.length === 1 ? "tag" : "tags"}</span>
                        <span>•</span>
                        <span>{post.read_time_minutes} min read</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {post.is_published && (
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
                      <DeletePostButton postId={post.id} postTitle={post.title} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
