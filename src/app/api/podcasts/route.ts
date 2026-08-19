import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { podcastGuests, podcasts } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { attachGuests, podcastColumns } from "@/lib/api/podcast-shape";

/**
 * Podcast episodes.
 *
 * Reads are public for published episodes, matching the `"Anyone can view published
 * podcasts"` policy. Drafts and writes are admin-only — the original policy was
 * `"Admin full access to podcasts"` keyed on a hardcoded email, which is now
 * `requireAdmin()`.
 *
 * Query parameters:
 *   ?all=1          include drafts (admin only)
 *   ?slug=foo       one episode by slug
 *   ?guest=<uuid>   episodes a given profile appears on
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const db = getSiteDb();

    const wantsDrafts = searchParams.get("all") === "1";
    if (wantsDrafts) await requireAdmin();

    const conditions = wantsDrafts ? [] : [eq(podcasts.isPublished, true)];

    const slug = searchParams.get("slug");
    if (slug) conditions.push(eq(podcasts.slug, slug));

    const guest = searchParams.get("guest");
    if (guest) {
      // Restrict to episodes this profile is credited on. Done as a subquery rather
      // than the previous two-step (fetch ids, then fetch episodes), which returned
      // nothing at all when the first query came back empty and needed an early
      // return to say so.
      const guestEpisodes = db
        .select({ id: podcastGuests.podcastId })
        .from(podcastGuests)
        .where(eq(podcastGuests.profileId, guest));
      conditions.push(inArray(podcasts.id, guestEpisodes));
    }

    const rows = await db
      .select(podcastColumns)
      .from(podcasts)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(podcasts.publishedAt));

    return NextResponse.json({ data: await attachGuests(rows) });
  } catch (err) {
    return handleApiError(err, "api/podcasts GET");
  }
}

/** Create an episode. Admin only. */
export async function POST(request: Request) {
  try {
    const profileId = await requireAdmin();
    const body = (await request.json()) as Record<string, unknown>;

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    if (!title || !slug) return badRequest("title and slug are required");

    const isPublished = body.is_published === true;

    let created;
    try {
      [created] = await getSiteDb()
        .insert(podcasts)
        .values({
          title,
          slug,
          description: (body.description as string) ?? null,
          transcript: (body.transcript as string) ?? null,
          audioUrl: (body.audio_url as string) ?? null,
          videoUrl: (body.video_url as string) ?? null,
          coverImageUrl: (body.cover_image_url as string) ?? null,
          durationSeconds:
            typeof body.duration_seconds === "number" ? body.duration_seconds : null,
          episodeNumber: typeof body.episode_number === "number" ? body.episode_number : null,
          isPublished,
          // Publishing with no date would hide the episode: public reads order and
          // filter on published_at.
          publishedAt:
            typeof body.published_at === "string"
              ? body.published_at
              : isPublished
                ? new Date().toISOString()
                : null,
          createdBy: profileId,
        })
        .returning(podcastColumns);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      if (e.code === "23505" || e.message?.includes("podcasts_slug_key")) {
        return NextResponse.json(
          { error: "An episode with that slug already exists" },
          { status: 409 },
        );
      }
      throw err;
    }

    return NextResponse.json({ data: { ...created, guests: [] } });
  } catch (err) {
    return handleApiError(err, "api/podcasts POST");
  }
}
