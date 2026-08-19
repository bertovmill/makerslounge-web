import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { comments, likes, profiles } from "@/db/site/schema";
import { optionalUser, requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Likes and comments, for both projects and blog posts.
 *
 * One route for both because the two tables share the same generalised shape:
 * `target_type` plus either `project_id` (a uuid foreign key) or `target_id` (the
 * blog post's slug, as text). That split is historical — the tables were built for
 * projects and widened later — and is the reason blog engagement never worked until
 * neon-migrations/0003.
 *
 * Replaces four row-owner policies (`current_profile_id() = user_id` for insert and
 * delete on each table) and two `USING (true)` read policies. `user_id` comes from
 * the session, so a like or comment cannot be attributed to someone else.
 *
 *   GET    ?type=project&id=<uuid>   or  ?type=blog_post&id=<slug>
 *   POST   { action: "like" | "unlike" | "comment", type, id, content? }
 *   DELETE ?commentId=<uuid>          delete your own comment
 */

type TargetType = "project" | "blog_post";

function parseTarget(type: string | null, id: string | null) {
  if (type !== "project" && type !== "blog_post") return null;
  if (!id) return null;
  return { type: type as TargetType, id };
}

/**
 * Which column identifies the target.
 *
 * A project like stores the uuid in `project_id`; a blog like stores the slug in
 * `target_id`. Getting this wrong is silent — the row inserts and simply never
 * matches on read — so it lives in one place.
 */
function targetWhere(table: typeof likes | typeof comments, t: { type: TargetType; id: string }) {
  return t.type === "project"
    ? and(eq(table.targetType, "project"), eq(table.projectId, t.id))
    : and(eq(table.targetType, "blog_post"), eq(table.targetId, t.id));
}

function targetValues(t: { type: TargetType; id: string }) {
  return t.type === "project"
    ? { targetType: "project", projectId: t.id, targetId: null }
    : { targetType: "blog_post", projectId: null, targetId: t.id };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const target = parseTarget(searchParams.get("type"), searchParams.get("id"));
    if (!target) return badRequest("type must be project|blog_post and id is required");

    const db = getSiteDb();
    const me = await optionalUser();

    const [counts] = await db
      .select({ likeCount: sql<number>`count(*)::int` })
      .from(likes)
      .where(targetWhere(likes, target));

    const commentRows = await db
      .select({
        id: comments.id,
        content: comments.content,
        created_at: comments.createdAt,
        user_id: comments.userId,
        authorId: profiles.id,
        authorName: profiles.name,
        authorPhoto: profiles.photoUrl,
      })
      .from(comments)
      .leftJoin(profiles, eq(profiles.id, comments.userId))
      .where(targetWhere(comments, target))
      .orderBy(asc(comments.createdAt));

    let likedByMe = false;
    if (me) {
      const [mine] = await db
        .select({ id: likes.id })
        .from(likes)
        .where(and(targetWhere(likes, target), eq(likes.userId, me)))
        .limit(1);
      likedByMe = !!mine;
    }

    return NextResponse.json({
      data: {
        likeCount: counts?.likeCount ?? 0,
        likedByMe,
        comments: commentRows.map((c) => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user_id,
          // Left join: a comment whose author was deleted still renders.
          profiles: c.authorId
            ? { id: c.authorId, name: c.authorName, photo_url: c.authorPhoto }
            : null,
        })),
      },
    });
  } catch (err) {
    return handleApiError(err, "api/engagement GET");
  }
}

export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as {
      action?: string;
      type?: string;
      id?: string;
      content?: string;
    };

    const target = parseTarget(body.type ?? null, body.id ?? null);
    if (!target) return badRequest("type must be project|blog_post and id is required");

    const db = getSiteDb();

    if (body.action === "like") {
      await db
        .insert(likes)
        .values({ userId: me, ...targetValues(target) })
        // Liking twice is a no-op. `likes_user_target_key` covers blog rows and
        // `likes_user_id_project_id_key` covers project rows.
        .onConflictDoNothing();
      return NextResponse.json({ success: true });
    }

    if (body.action === "unlike") {
      await db.delete(likes).where(and(targetWhere(likes, target), eq(likes.userId, me)));
      return NextResponse.json({ success: true });
    }

    if (body.action === "comment") {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (!content) return badRequest("content is required");

      const [created] = await db
        .insert(comments)
        .values({ userId: me, content, ...targetValues(target) })
        .returning({ id: comments.id, created_at: comments.createdAt });

      // Return the author too, so the caller can render the new comment without
      // either a follow-up request or the display name plumbed in as a prop.
      const [author] = await db
        .select({ id: profiles.id, name: profiles.name, photo_url: profiles.photoUrl })
        .from(profiles)
        .where(eq(profiles.id, me))
        .limit(1);

      return NextResponse.json({
        data: { ...created, content, user_id: me, profiles: author ?? null },
      });
    }

    return badRequest("action must be like, unlike or comment");
  } catch (err) {
    return handleApiError(err, "api/engagement POST");
  }
}

/** Delete one of your own comments. */
export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const commentId = new URL(request.url).searchParams.get("commentId");
    if (!commentId) return badRequest("commentId is required");

    const [deleted] = await getSiteDb()
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, me)))
      .returning({ id: comments.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/engagement DELETE");
  }
}
