import { NextResponse } from "next/server";
import { getSiteDb } from "@/db/site";
import { blogPosts } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Create a blog post.
 *
 * Authorization mirrors the RLS policy this replaces, which was
 * `"Authenticated users can create posts" WITH CHECK (current_profile_id() IS NOT
 * NULL)` — any signed-in user, not just the admin.
 *
 * That is looser than it looks from the UI: only /admin/blog exposes the form, and
 * it checks for the admin email. But the browser talked to PostgREST directly, so
 * the policy was the real boundary and any member could have created a post by
 * calling the API. Preserved deliberately rather than tightened, because
 * tightening it here would be a behaviour change smuggled into a database
 * migration. Worth revisiting on its own — see docs/rls-policy-inventory.md, which
 * flags exactly this class of policy as "opened up during development and never
 * tightened".
 *
 * `author_id` is taken from the session, never the body, so a post cannot be
 * attributed to someone else. That also means the author checks on update and
 * delete are meaningful.
 */
export async function POST(request: Request) {
  try {
    const profileId = await requireUser();

    const body = (await request.json()) as Record<string, unknown>;

    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const excerpt = typeof body.excerpt === "string" ? body.excerpt : "";
    const content = typeof body.content === "string" ? body.content : "";

    // All four are NOT NULL in the database.
    if (!slug || !title || !excerpt || !content) {
      return badRequest("slug, title, excerpt and content are required");
    }

    const isPublished = body.is_published === true;

    let created;
    try {
      [created] = await getSiteDb()
        .insert(blogPosts)
        .values({
          slug,
          title,
          excerpt,
          content,
          authorId: profileId,
          coverImage: typeof body.cover_image === "string" ? body.cover_image : null,
          tags: Array.isArray(body.tags) ? (body.tags as string[]) : [],
          readTimeMinutes:
            typeof body.read_time_minutes === "number" ? body.read_time_minutes : 5,
          isPublished,
          isFeatured: body.is_featured === true,
          // Publishing without a date would make the post invisible: every public
          // read requires published_at <= now(), and a NULL never satisfies it.
          publishedAt:
            typeof body.published_at === "string"
              ? body.published_at
              : isPublished
                ? new Date().toISOString()
                : null,
        })
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

    return NextResponse.json({ success: true, data: created });
  } catch (err) {
    return handleApiError(err, "api/blog POST");
  }
}
