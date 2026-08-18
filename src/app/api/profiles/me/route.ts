import { NextResponse } from "next/server";
import { eq, ne, and } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { pickProfileUpdates, publicProfileColumns } from "@/lib/api/profile-fields";

/**
 * The signed-in member's own profile.
 *
 * Replaces the `"Users can update own profile" USING (current_profile_id() = id)`
 * policy: the row is chosen by the session rather than by an id in the request, so
 * there is no id to check against.
 *
 * Note this route is `/api/profiles/me` while `/api/profiles/[id]` handles reads by
 * id. Next resolves the static segment first, so `me` is never mistaken for a uuid.
 */

export async function GET() {
  try {
    const profileId = await requireUser();

    const [row] = await getSiteDb()
      .select(publicProfileColumns)
      .from(profiles)
      .where(eq(profiles.id, profileId))
      .limit(1);

    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (err) {
    return handleApiError(err, "api/profiles/me GET");
  }
}

export async function PATCH(request: Request) {
  try {
    const profileId = await requireUser();
    const body = (await request.json()) as Record<string, unknown>;

    const updates = pickProfileUpdates(body);
    if (Object.keys(updates).length === 0) return badRequest("no writable fields provided");

    // Normalise the username before the uniqueness check so casing can't create
    // two profiles that collide on /p/[username].
    if (typeof updates.username === "string") {
      const username = updates.username.trim().toLowerCase();
      if (username === "") {
        updates.username = null;
      } else {
        if (!/^[a-z0-9_-]{2,30}$/.test(username)) {
          return badRequest(
            "Username must be 2–30 characters, using letters, numbers, hyphens or underscores",
          );
        }
        updates.username = username;

        const [taken] = await getSiteDb()
          .select({ id: profiles.id })
          .from(profiles)
          .where(and(eq(profiles.username, username), ne(profiles.id, profileId)))
          .limit(1);

        if (taken) {
          return NextResponse.json({ error: "username_taken" }, { status: 409 });
        }
      }
    }

    updates.updatedAt = new Date().toISOString();

    const [updated] = await getSiteDb()
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, profileId))
      .returning(publicProfileColumns);

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    // The unique index is still the real guarantee — the check above narrows the
    // race window but does not close it.
    const e = err as { code?: string; message?: string };
    if (e.code === "23505" || e.message?.includes("profiles_username_key")) {
      return NextResponse.json({ error: "username_taken" }, { status: 409 });
    }
    return handleApiError(err, "api/profiles/me PATCH");
  }
}
