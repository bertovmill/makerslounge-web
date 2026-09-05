import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profileAnnotations, profiles } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { normalizeNote, normalizeTags } from "@/lib/profile-annotations";

/**
 * Private tags + note one member keeps about another.
 *
 * Everything is keyed on `owner_id = me`. These are the viewer's own labels for
 * people, not labels attached to those people for anyone to read — the subject of
 * an annotation must never be able to fetch it. `?profileId=` narrows within my
 * rows; it never widens them.
 */

const selectColumns = {
  profile_id: profileAnnotations.profileId,
  tags: profileAnnotations.tags,
  note: profileAnnotations.note,
  updated_at: profileAnnotations.updatedAt,
};

export async function GET(request: NextRequest) {
  try {
    const me = await requireUser();
    const profileId = new URL(request.url).searchParams.get("profileId");

    const rows = await getSiteDb()
      .select(selectColumns)
      .from(profileAnnotations)
      .where(
        profileId
          ? and(eq(profileAnnotations.ownerId, me), eq(profileAnnotations.profileId, profileId))
          : eq(profileAnnotations.ownerId, me),
      )
      .orderBy(desc(profileAnnotations.updatedAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/profile-annotations GET");
  }
}

/**
 * Replace my annotation about one member. Idempotent: the same body twice leaves
 * the same row. Empty tags and an empty note delete the row rather than storing a
 * blank one, so the client has a single "save" path.
 */
export async function PUT(request: Request) {
  try {
    const me = await requireUser();
    const raw = (await request.json().catch(() => null)) as {
      profileId?: unknown;
      tags?: unknown;
      note?: unknown;
    } | null;

    const profileId = typeof raw?.profileId === "string" ? raw.profileId : "";
    if (!profileId) return badRequest("profileId is required");
    if (profileId === me) return badRequest("you cannot annotate yourself");
    if (raw?.tags !== undefined && !Array.isArray(raw.tags)) return badRequest("tags must be an array");
    if (raw?.note !== undefined && raw.note !== null && typeof raw.note !== "string") {
      return badRequest("note must be a string");
    }

    const tags = normalizeTags(((raw?.tags as unknown[]) ?? []).filter((t) => typeof t === "string") as string[]);
    const note = normalizeNote(raw?.note as string | null | undefined);

    const db = getSiteDb();

    if (tags.length === 0 && note === null) {
      await db
        .delete(profileAnnotations)
        .where(and(eq(profileAnnotations.ownerId, me), eq(profileAnnotations.profileId, profileId)));
      return NextResponse.json({ data: null });
    }

    // A dangling profile id would fail the foreign key anyway; checking first turns
    // that into a 404 the client can show rather than a 500.
    const [subject] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);
    if (!subject) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const [row] = await db
      .insert(profileAnnotations)
      .values({ ownerId: me, profileId, tags, note })
      .onConflictDoUpdate({
        target: [profileAnnotations.ownerId, profileAnnotations.profileId],
        set: { tags, note, updatedAt: sql`now()` },
      })
      .returning(selectColumns);

    return NextResponse.json({ data: row });
  } catch (err) {
    return handleApiError(err, "api/profile-annotations PUT");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const me = await requireUser();
    const profileId = new URL(request.url).searchParams.get("profileId");
    if (!profileId) return badRequest("profileId is required");

    await getSiteDb()
      .delete(profileAnnotations)
      .where(and(eq(profileAnnotations.ownerId, me), eq(profileAnnotations.profileId, profileId)));

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/profile-annotations DELETE");
  }
}
