import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { innovationHackathonSignups } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Find-a-team signups.
 *
 * Admin-only, matching `innovation_hackathon_signups_admin_select`. The rows carry
 * email addresses and free-text background, so the public surface is the count at
 * /api/hackathon/signups-count, not this.
 */
export async function GET() {
  try {
    await requireAdmin();

    const rows = await getSiteDb()
      .select()
      .from(innovationHackathonSignups)
      .orderBy(desc(innovationHackathonSignups.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/hackathon/signups GET");
  }
}

/** Assign a matched team, or flag a finalist. */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { id, matchedTeam, isFinalist } = (await request.json()) as {
      id?: string;
      matchedTeam?: string | null;
      isFinalist?: boolean;
    };

    if (!id) return badRequest("id is required");

    const updates: Record<string, unknown> = {};
    if (matchedTeam !== undefined) updates.matchedTeam = matchedTeam;
    if (isFinalist !== undefined) updates.isFinalist = isFinalist;
    if (Object.keys(updates).length === 0) return badRequest("nothing to update");

    const [updated] = await getSiteDb()
      .update(innovationHackathonSignups)
      .set(updates)
      .where(eq(innovationHackathonSignups.id, id))
      .returning({ id: innovationHackathonSignups.id });

    if (!updated) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/hackathon/signups PATCH");
  }
}
