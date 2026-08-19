import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, notInArray, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { blockedUsers, comments, likes, profiles, projects } from "@/db/site/schema";
import { optionalUser, requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Posts and projects — the feed.
 *
 * Reads are public (`"Projects are viewable by everyone"`); writes are row-owner
 * (`current_profile_id() = user_id`), enforced here by taking `user_id` from the
 * session and scoping updates and deletes by it.
 *
 * Likes and comment counts come back with the posts. The feed used to fetch the
 * posts, then the like counts, then the caller's own likes, then the comments, as
 * four separate browser round trips that had to be stitched together client-side.
 *
 * Query parameters:
 *   ?userId=<uuid>      only that member's posts (their profile page)
 *   ?limit=n            capped at 100
 *   ?withComments=1     include each post's comments inline
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const db = getSiteDb();
    const me = await optionalUser();

    const conditions = [];

    const userId = searchParams.get("userId");
    if (userId) conditions.push(eq(projects.userId, userId));

    // Hide posts by people the viewer has blocked. This was a separate query whose
    // result the client filtered on; as a subquery it cannot be forgotten.
    if (me) {
      const blocked = db
        .select({ id: blockedUsers.blockedId })
        .from(blockedUsers)
        .where(eq(blockedUsers.blockerId, me));
      conditions.push(notInArray(projects.userId, blocked));
    }

    const withComments = searchParams.get("withComments") === "1";

    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 100) : 50;

    const rows = await db
      .select({
        id: projects.id,
        user_id: projects.userId,
        title: projects.title,
        description: projects.description,
        media_urls: projects.mediaUrls,
        category: projects.category,
        metadata: projects.metadata,
        created_at: projects.createdAt,
        authorId: profiles.id,
        authorName: profiles.name,
        authorPhoto: profiles.photoUrl,
        authorUsername: profiles.username,
        like_count: sql<number>`(
          select count(*)::int from ${likes} l
          where l.target_type = 'project' and l.project_id = ${projects.id}
        )`,
        comment_count: sql<number>`(
          select count(*)::int from ${comments} c
          where c.target_type = 'project' and c.project_id = ${projects.id}
        )`,
        // Null for a signed-out viewer, which the UI reads as "not liked".
        liked_by_me: me
          ? sql<boolean>`exists (
              select 1 from ${likes} l
              where l.target_type = 'project' and l.project_id = ${projects.id}
                and l.user_id = ${me}
            )`
          : sql<boolean>`false`,
        // The feed renders comments inline. Aggregated in the same statement rather
        // than fetched as a second bulk query and grouped client-side.
        // `coalesce` because json_agg over no rows yields NULL, not an empty array.
        comments: withComments
          ? sql<
              { id: string; content: string; created_at: string; profiles: unknown }[]
            >`coalesce((
              select json_agg(json_build_object(
                'id', c.id,
                'content', c.content,
                'created_at', c.created_at,
                'profiles', case when p2.id is null then null else json_build_object(
                  'id', p2.id, 'name', p2.name, 'photo_url', p2.photo_url
                ) end
              ) order by c.created_at desc)
              from ${comments} c
              left join ${profiles} p2 on p2.id = c.user_id
              where c.target_type = 'project' and c.project_id = ${projects.id}
            ), '[]'::json)`
          : sql<never[]>`'[]'::json`,
      })
      .from(projects)
      .innerJoin(profiles, eq(profiles.id, projects.userId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(projects.createdAt))
      .limit(limit);

    const data = rows.map((r) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      description: r.description,
      media_urls: r.media_urls,
      category: r.category,
      metadata: r.metadata,
      created_at: r.created_at,
      profiles: {
        id: r.authorId,
        name: r.authorName,
        photo_url: r.authorPhoto,
        username: r.authorUsername,
      },
      like_count: r.like_count,
      comment_count: r.comment_count,
      liked_by_me: r.liked_by_me,
      comments: r.comments,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    return handleApiError(err, "api/projects GET");
  }
}

/** Create a post. `user_id` comes from the session. */
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return badRequest("title is required");

    const [created] = await getSiteDb()
      .insert(projects)
      .values({
        userId: me,
        title,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        mediaUrls: Array.isArray(body.media_urls) ? (body.media_urls as string[]) : null,
        category: typeof body.category === "string" ? body.category : null,
        metadata: body.metadata ?? null,
      })
      .returning({ id: projects.id });

    return NextResponse.json({ data: created });
  } catch (err) {
    return handleApiError(err, "api/projects POST");
  }
}
