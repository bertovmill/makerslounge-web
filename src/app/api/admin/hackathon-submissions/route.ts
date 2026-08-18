import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonSubmissions } from "@/db/site/schema";
import { requireJudge } from "@/lib/api/judge-auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/** All submissions, newest first. Judge-gated: these include private contact info. */
export async function GET(req: NextRequest) {
  try {
    requireJudge(req);

    const rows = await getSiteDb()
      .select({
        id: hackathonSubmissions.id,
        project_link: hackathonSubmissions.projectLink,
        title: hackathonSubmissions.title,
        description: hackathonSubmissions.description,
        video_url: hackathonSubmissions.videoUrl,
        file_urls: hackathonSubmissions.fileUrls,
        team_name: hackathonSubmissions.teamName,
        builder_emails: hackathonSubmissions.builderEmails,
        challenge_track: hackathonSubmissions.challengeTrack,
        status: hackathonSubmissions.status,
        is_finalist: hackathonSubmissions.isFinalist,
        is_round2: hackathonSubmissions.isRound2,
        created_at: hackathonSubmissions.createdAt,
      })
      .from(hackathonSubmissions)
      .orderBy(desc(hackathonSubmissions.createdAt));

    return NextResponse.json(rows);
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-submissions GET");
  }
}

/** Flag a submission as a finalist or through to round 2. */
export async function PATCH(req: NextRequest) {
  try {
    requireJudge(req);

    const body = (await req.json()) as {
      id?: string;
      is_finalist?: boolean;
      is_round2?: boolean;
    };
    if (!body.id) return badRequest("id required");

    const update: { isFinalist?: boolean; isRound2?: boolean } = {};
    if (body.is_finalist !== undefined) update.isFinalist = body.is_finalist;
    if (body.is_round2 !== undefined) update.isRound2 = body.is_round2;

    // An empty `set` is a runtime error in Drizzle, where PostgREST quietly
    // accepted it as a no-op.
    if (Object.keys(update).length === 0) {
      return badRequest("provide is_finalist or is_round2");
    }

    await getSiteDb()
      .update(hackathonSubmissions)
      .set(update)
      .where(eq(hackathonSubmissions.id, body.id));

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-submissions PATCH");
  }
}
