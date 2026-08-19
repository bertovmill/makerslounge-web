import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonSubmissions } from "@/db/site/schema";
import { requireJudge } from "@/lib/api/judge-auth";
import { handleApiError } from "@/lib/api/respond";

/**
 * Finalist submissions, display fields only.
 *
 * Separate from `/api/admin/hackathon-submissions`, which returns the whole row —
 * including `builder_emails` and the file list. The scoring and demo-night screens only
 * need something to put on screen, so this sends only that rather than shipping
 * entrants' contact details to every judging browser.
 */
export async function GET(req: NextRequest) {
  try {
    requireJudge(req);

    const rows = await getSiteDb()
      .select({
        id: hackathonSubmissions.id,
        title: hackathonSubmissions.title,
        team_name: hackathonSubmissions.teamName,
        challenge_track: hackathonSubmissions.challengeTrack,
        description: hackathonSubmissions.description,
      })
      .from(hackathonSubmissions)
      .where(eq(hackathonSubmissions.isFinalist, true))
      .orderBy(asc(hackathonSubmissions.challengeTrack), asc(hackathonSubmissions.title));

    return NextResponse.json({ data: rows });
  } catch (err) {
    return handleApiError(err, "api/hackathon/finalists GET");
  }
}
