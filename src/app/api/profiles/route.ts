import { NextRequest, NextResponse } from "next/server";
import { and, arrayOverlaps, asc, desc, eq, ilike, inArray, isNotNull, or } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";
import { publicProfileColumns } from "@/lib/api/profile-fields";

/**
 * Browse and search profiles.
 *
 * Public, matching the `"Public profiles are viewable by everyone" USING (true)`
 * policy — /people and the public profile pages are meant to be reachable while
 * signed out.
 *
 * Query parameters:
 *   ?ids=a,b,c        specific profiles (used to hydrate lists of ids)
 *   ?username=foo     exact match, for /p/[username]
 *   ?q=text           name / bio / currently_building
 *   ?skills=a,b       overlaps skills
 *   ?named=1          only profiles with a name set (i.e. finished onboarding)
 *   ?sort=created|name
 *   ?limit=n          capped at 200
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const db = getSiteDb();

    const conditions = [];

    const ids = searchParams.get("ids");
    if (ids) {
      const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
      // An empty `inArray` is invalid SQL in Drizzle, and "no ids" means "no rows"
      // rather than "everything".
      if (list.length === 0) return NextResponse.json({ data: [] });
      conditions.push(inArray(profiles.id, list));
    }

    const username = searchParams.get("username");
    if (username) conditions.push(eq(profiles.username, username.trim().toLowerCase()));

    const q = searchParams.get("q");
    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      conditions.push(
        or(
          ilike(profiles.name, term),
          ilike(profiles.bio, term),
          ilike(profiles.currentlyBuilding, term),
        )!,
      );
    }

    const skills = searchParams.get("skills");
    if (skills) {
      const list = skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (list.length > 0) conditions.push(arrayOverlaps(profiles.skills, list));
    }

    if (searchParams.get("named") === "1") conditions.push(isNotNull(profiles.name));

    const limitParam = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 200;

    const orderBy =
      searchParams.get("sort") === "name" ? asc(profiles.name) : desc(profiles.createdAt);

    const rows = await db
      .select(publicProfileColumns)
      .from(profiles)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(orderBy)
      .limit(limit);

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/profiles GET");
  }
}
