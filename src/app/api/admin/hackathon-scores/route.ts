import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonScores } from "@/db/site/schema";
import { requireJudge } from "@/lib/api/judge-auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/** GET /api/admin/hackathon-scores?submission_id=...&judge_name=... */
export async function GET(req: NextRequest) {
  try {
    requireJudge(req);

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submission_id");
    const judgeName = searchParams.get("judge_name");
    if (!submissionId || !judgeName) {
      return badRequest("submission_id and judge_name required");
    }

    const rows = await getSiteDb()
      .select({ criterion_key: hackathonScores.criterionKey, score: hackathonScores.score })
      .from(hackathonScores)
      .where(
        and(
          eq(hackathonScores.submissionId, submissionId),
          eq(hackathonScores.judgeName, judgeName),
        ),
      );

    return NextResponse.json(rows);
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-scores GET");
  }
}

/** POST /api/admin/hackathon-scores  { judge_name, submission_id, criterion_key, score } */
export async function POST(req: NextRequest) {
  try {
    requireJudge(req);

    const body = (await req.json()) as {
      judge_name?: string;
      submission_id?: string;
      criterion_key?: string;
      score?: number;
    };

    // Validated explicitly because the columns are NOT NULL and a missing field
    // used to surface as an opaque PostgREST error.
    if (!body.judge_name || !body.submission_id || !body.criterion_key) {
      return badRequest("judge_name, submission_id and criterion_key are required");
    }
    if (typeof body.score !== "number" || !Number.isFinite(body.score)) {
      return badRequest("score must be a number");
    }

    await getSiteDb()
      .insert(hackathonScores)
      .values({
        judgeName: body.judge_name,
        submissionId: body.submission_id,
        criterionKey: body.criterion_key,
        score: body.score,
      })
      // Re-scoring the same criterion overwrites, matching the previous upsert on
      // hackathon_scores_judge_name_submission_id_criterion_key_key.
      .onConflictDoUpdate({
        target: [
          hackathonScores.judgeName,
          hackathonScores.submissionId,
          hackathonScores.criterionKey,
        ],
        set: { score: body.score, updatedAt: new Date().toISOString() },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-scores POST");
  }
}
