import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { blogPosts } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { getPostById } from "@/lib/blog";

/**
 * Read, update and delete one blog post.
 *
 * Replaces three RLS policies:
 *   GET     "Authenticated users can read all posts"  -> requireUser()
 *   PATCH   "Authors can update their own posts"      -> requireUser() + author scope
 *   DELETE  "Authors can delete their own posts"      -> requireUser() + author scope
 *
 * The author scope is enforced in the WHERE clause rather than by reading the row
 * first and comparing: one statement, no race between the check and the write, and
 * a non-author simply matches no rows.
 */

type Params = { params: Promise<{ id: string }> };

/** Drafts included — this backs the admin edit form. */
export async function GET(_request: Request, { params }: Params) {
  try {
    await requireUser();
    const { id } = await params;

    const post = await getPostById(id);
    if (!post) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ data: post });
  } catch (err) {
    return handleApiError(err, "api/blog/[id] GET");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const profileId = await requireUser();
    const { id } = await params;

    const body = (await request.json()) as Record<string, unknown>;

    // Only copy across fields the caller actually sent. `author_id` is not
    // assignable: allowing it would let an author hand a post to someone else and
    // lose their own ability to edit it.
    const updates: Partial<typeof blogPosts.$inferInsert> = {};
    if (typeof body.slug === "string") updates.slug = body.slug.trim();
    if (typeof body.title === "string") updates.title = body.title.trim();
    if (typeof body.excerpt === "string") updates.excerpt = body.excerpt;
    if (typeof body.content === "string") updates.content = body.content;
    if (typeof body.cover_image === "string" || body.cover_image === null) {
      updates.coverImage = body.cover_image as string | null;
    }
    if (Array.isArray(body.tags)) updates.tags = body.tags as string[];
    if (typeof body.read_time_minutes === "number") {
      updates.readTimeMinutes = body.read_time_minutes;
    }
    if (typeof body.is_published === "boolean") updates.isPublished = body.is_published;
    if (typeof body.is_featured === "boolean") updates.isFeatured = body.is_featured;
    if (typeof body.published_at === "string" || body.published_at === null) {
      updates.publishedAt = body.published_at as string | null;
    }
    if (typeof body.newsletter_sent_at === "string" || body.newsletter_sent_at === null) {
      updates.newsletterSentAt = body.newsletter_sent_at as string | null;
    }

    // Publishing a post that has no date would hide it: public reads all require
    // published_at <= now(), which a NULL never satisfies.
    if (updates.isPublished === true && updates.publishedAt === undefined) {
      const existing = await getPostById(id);
      if (existing && !existing.published_at) {
        updates.publishedAt = new Date().toISOString();
      }
    }

    // Drizzle throws on an empty SET where PostgREST accepted it as a no-op.
    if (Object.keys(updates).length === 0) return badRequest("no fields to update");

    let updated;
    try {
      [updated] = await getSiteDb()
        .update(blogPosts)
        .set(updates)
        .where(and(eq(blogPosts.id, id), eq(blogPosts.authorId, profileId)))
        .returning();
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === "23505" || e.message?.includes("blog_posts_slug_key")) {
        return NextResponse.json(
          { error: "A post with that slug already exists" },
          { status: 409 },
        );
      }
      throw err;
    }

    // Either the post is gone or the caller does not own it. Not distinguished on
    // purpose — telling a non-author that a draft exists is itself a leak.
    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    return handleApiError(err, "api/blog/[id] PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const profileId = await requireUser();
    const { id } = await params;

    const [deleted] = await getSiteDb()
      .delete(blogPosts)
      .where(and(eq(blogPosts.id, id), eq(blogPosts.authorId, profileId)))
      .returning({ id: blogPosts.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/blog/[id] DELETE");
  }
}
