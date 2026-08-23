import { notFound } from "next/navigation";
import { getServerAppUser } from "@/lib/clerk-server";
import { isAdmin } from "@/lib/api/auth";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import BlogCard from "@/components/BlogCard";
import BlogPostContent from "@/components/BlogPostContent";
import BlogEngagement from "@/components/BlogEngagement";
import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { comments, likes, profiles } from "@/db/site/schema";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Engagement, server-side. Blog likes and comments are keyed by
  // (target_type, target_id) with the post *slug* as the id — these tables were
  // built for projects and generalised later.
  const db = getSiteDb();

  const [{ likesCount }] = await db
    .select({ likesCount: sql<number>`count(*)::int` })
    .from(likes)
    .where(and(eq(likes.targetType, "blog_post"), eq(likes.targetId, post.slug)));

  // A left join, not inner: a comment whose author has since been deleted should
  // still render, with the fallback name, rather than vanishing from the thread.
  const commentRows = await db
    .select({
      id: comments.id,
      content: comments.content,
      created_at: comments.createdAt,
      authorId: profiles.id,
      authorName: profiles.name,
      authorPhoto: profiles.photoUrl,
    })
    .from(comments)
    .leftJoin(profiles, eq(profiles.id, comments.userId))
    .where(and(eq(comments.targetType, "blog_post"), eq(comments.targetId, post.slug)))
    .orderBy(desc(comments.createdAt));

  const commentsData = commentRows.map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    profiles: c.authorId
      ? { id: c.authorId, name: c.authorName, photo_url: c.authorPhoto }
      : null,
  }));

  // Get current user (server-side)
  const user = await getServerAppUser();

  // Check if user has liked this post
  let hasLiked = false;
  if (user) {
    const [userLike] = await db
      .select({ id: likes.id })
      .from(likes)
      .where(
        and(
          eq(likes.userId, user.id),
          eq(likes.targetType, "blog_post"),
          eq(likes.targetId, post.slug),
        ),
      )
      .limit(1);

    hasLiked = !!userLike;
  }

  // Get related posts
  const allPosts = await getAllPosts();
  const relatedPosts = allPosts
    .filter(
      (p) =>
        p.id !== post.id &&
        p.tags.some((tag) => post.tags.includes(tag))
    )
    .slice(0, 3);

  // If not enough related posts with matching tags, fill with recent posts
  if (relatedPosts.length < 3) {
    const additionalPosts = allPosts
      .filter((p) => p.id !== post.id && !relatedPosts.includes(p))
      .slice(0, 3 - relatedPosts.length);
    relatedPosts.push(...additionalPosts);
  }

  const formattedDate = new Date(post.publishDate).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const authorInitials = post.author.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          {/* Back button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-8 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to all posts
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Cover Image */}
            <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl">
              {post.coverImage ? (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-400/20 to-orange-400/20 flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-white/30"
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
            </div>

            {/* Post Info */}
            <div className="text-white">
              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-white/10 text-white border-white/20"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>

              <p className="text-xl text-white/80 mb-6 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-white/60 mb-6">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{formattedDate}</span>
                </div>
                <div className="w-1 h-1 bg-white/40 rounded-full self-center" />
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{post.readTimeMinutes} min read</span>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
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
                <div>
                  <p className="font-semibold text-white">{post.author.name}</p>
                  {post.author.role && (
                    <p className="text-sm text-white/60">{post.author.role}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="relative py-12 bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <BlogPostContent content={post.content} />
        </div>
      </section>

      {/* Engagement Section */}
      <section className="relative py-8 bg-background border-y border-border">
        <div className="max-w-3xl mx-auto px-4">
          <BlogEngagement
            postId={post.slug}
            currentUserId={user?.id || null}
            canComment={await isAdmin()}
            initialLikeCount={likesCount || 0}
            initialHasLiked={hasLiked}
            initialComments={commentsData || []}
          />
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="relative py-12 bg-muted/30">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">More from the blog</h2>
              <Button variant="outline" asChild>
                <Link href="/blog">View all</Link>
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
