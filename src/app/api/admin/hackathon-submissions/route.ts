import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonSubmissions } from "@/db/site/schema";
import { requireJudge, requireJudgeOrAdmin } from "@/lib/api/judge-auth";
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

/** Flag a submission as a finalist / through to round 2, or set its review status. */
export async function PATCH(req: NextRequest) {
  try {
    // Either gate: the judging screens send the shared password, the Clerk-gated
    // admin page has a session instead.
    await requireJudgeOrAdmin(req);

    const body = (await req.json()) as {
      id?: string;
      is_finalist?: boolean;
      is_round2?: boolean;
      status?: string;
    };
    if (!body.id) return badRequest("id required");

    const update: {
      isFinalist?: boolean;
      isRound2?: boolean;
      status?: string;
      reviewedAt?: string;
    } = {};
    if (body.is_finalist !== undefined) update.isFinalist = body.is_finalist;
    if (body.is_round2 !== undefined) update.isRound2 = body.is_round2;
    if (body.status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(body.status)) {
        return badRequest("status must be pending, approved or rejected");
      }
      update.status = body.status;
      // Stamped server-side: the client used to send this, and a reviewed_at from a
      // wrong clock is worse than useless in an audit trail.
      update.reviewedAt = new Date().toISOString();
    }

    // An empty `set` is a runtime error in Drizzle, where PostgREST quietly
    // accepted it as a no-op.
    if (Object.keys(update).length === 0) {
      return badRequest("provide is_finalist, is_round2 or status");
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
