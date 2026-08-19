import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { innovationHackathonSignups } from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";

/**
 * How many people have signed up to find a team.
 *
 * Replaces `supabase.rpc("innovation_signups_count")` — a SECURITY DEFINER function
 * that existed purely so an anonymous browser could get a count from a table whose
 * rows it may not read. Only the count leaves the server here, so the route does the
 * same job without the function.
 *
 * Public: the find-a-team page polls it while signed out to notice a new signup.
 * `innovation_signups_count()` still exists in Neon and is now unused.
 */
export async function GET() {
  try {
    const [row] = await getSiteDb()
      .select({ count: sql<number>`count(*)::int` })
      .from(innovationHackathonSignups);

    return NextResponse.json({ count: row?.count ?? 0 });
  } catch (err) {
    return handleApiError(err, "api/hackathon/signups-count");
  }
}
