import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";
import { pickProfileUpdates, publicProfileColumns } from "@/lib/api/profile-fields";

/**
 * One profile by id. Public, per the `USING (true)` SELECT policy — /profile/[id]
 * is a shareable page.
 *
 * Members write their own profile at `/api/profiles/me`, keyed by the session. The
 * PATCH here is the admin path for editing *someone else's* profile, used by the
 * meetup matcher's inline editor.
 *
 * That editor was previously writing straight to `profiles` by id, which the row-owner
 * policy only ever permitted for the admin's own row — so editing any other member
 * silently did nothing, with no error surfaced. Making it work for an admin is a
 * behaviour change, and a deliberate one: an admin tool that appears to save and
 * doesn't is worse than either alternative.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // A malformed uuid makes Postgres raise a type error rather than return no
    // rows, which would surface as a 500 for what is really a 404.
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const [row] = await getSiteDb()
      .select(publicProfileColumns)
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (err) {
    return handleApiError(err, "api/profiles/[id] GET");
  }
}

/** Edit another member's profile. Admin only. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    // The same whitelist members are held to, so an admin cannot set
    // `application_status` or `linkedin_data` through this either — those have their
    // own routes.
    const updates = pickProfileUpdates(body);
    if (Object.keys(updates).length === 0) return badRequest("no writable fields provided");
    updates.updatedAt = new Date().toISOString();

    const [updated] = await getSiteDb()
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, id))
      .returning(publicProfileColumns);

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleApiError(err, "api/profiles/[id] PATCH");
  }
}
