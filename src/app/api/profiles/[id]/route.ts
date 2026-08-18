import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";
import { publicProfileColumns } from "@/lib/api/profile-fields";

/**
 * One profile by id. Public, per the `USING (true)` SELECT policy — /profile/[id]
 * is a shareable page.
 *
 * Writes live at `/api/profiles/me`, keyed by the session, so there is no PATCH
 * here to authorise. `/api/profiles/[id]/enrich` is separate and admin-only.
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
