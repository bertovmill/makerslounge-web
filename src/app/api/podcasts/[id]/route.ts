import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { podcastGuests, podcasts } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { attachGuests, podcastColumns } from "@/lib/api/podcast-shape";

/**
 * One podcast episode: read, update, delete, and guest credits.
 *
 * All admin-only, replacing `"Admin full access to podcasts"` and
 * `"Admin full access to podcast guests"`. GET is admin too because it returns
 * drafts — the public path is `GET /api/podcasts?slug=…`, which filters to published.
 */

type Params = { params: Promise<{ id: string }> };

const WRITABLE = {
  title: "title",
  slug: "slug",
  description: "description",
  transcript: "transcript",
  audio_url: "audioUrl",
  video_url: "videoUrl",
  cover_image_url: "coverImageUrl",
  duration_seconds: "durationSeconds",
  episode_number: "episodeNumber",
  is_published: "isPublished",
  published_at: "publishedAt",
} as const;

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const rows = await getSiteDb()
      .select(podcastColumns)
      .from(podcasts)
      .where(eq(podcasts.id, id))
      .limit(1);

    const [withGuests] = await attachGuests(rows);
    if (!withGuests) return NextResponse.json({ error: "not_found" }, { status: 404 });

    return NextResponse.json({ data: withGuests });
  } catch (err) {
    return handleApiError(err, "api/podcasts/[id] GET");
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    for (const [wire, column] of Object.entries(WRITABLE)) {
      if (wire in body) updates[column] = body[wire];
    }

    // Publishing an episode with no date would hide it: the public list filters and
    // orders on published_at.
    if (updates.isPublished === true && updates.publishedAt === undefined) {
      const [existing] = await getSiteDb()
        .select({ publishedAt: podcasts.publishedAt })
        .from(podcasts)
        .where(eq(podcasts.id, id))
        .limit(1);
      if (existing && !existing.publishedAt) updates.publishedAt = new Date().toISOString();
    }

    if (Object.keys(updates).length === 0) return badRequest("no writable fields provided");
    updates.updatedAt = new Date().toISOString();

    let updated;
    try {
      [updated] = await getSiteDb()
        .update(podcasts)
        .set(updates)
        .where(eq(podcasts.id, id))
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

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleApiError(err, "api/podcasts/[id] PATCH");
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [deleted] = await getSiteDb()
      .delete(podcasts)
      .where(eq(podcasts.id, id))
      .returning({ id: podcasts.id });

    if (!deleted) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/podcasts/[id] DELETE");
  }
}

/** Add or remove a guest credit. `{ action: "add" | "remove", profileId }` */
export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action, profileId } = (await request.json()) as {
      action?: string;
      profileId?: string;
    };

    if (!profileId) return badRequest("profileId is required");
    const db = getSiteDb();

    if (action === "add") {
      await db
        .insert(podcastGuests)
        .values({ podcastId: id, profileId })
        // Crediting the same guest twice is a no-op rather than an error.
        .onConflictDoNothing();
      return NextResponse.json({ success: true });
    }

    if (action === "remove") {
      await db
        .delete(podcastGuests)
        .where(and(eq(podcastGuests.podcastId, id), eq(podcastGuests.profileId, profileId)));
      return NextResponse.json({ success: true });
    }

    return badRequest("action must be 'add' or 'remove'");
  } catch (err) {
    return handleApiError(err, "api/podcasts/[id] POST");
  }
}
