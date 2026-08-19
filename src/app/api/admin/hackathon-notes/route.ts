import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonVoterNotes } from "@/db/site/schema";
import { requireJudge } from "@/lib/api/judge-auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * GET /api/admin/hackathon-notes?submission_id=...&judge_name=...
 *
 * `hackathon_voter_notes` had RLS enabled with zero policies, which in Postgres
 * denies everything rather than allowing it — only the service-role key reached
 * it. That is why this route exists at all, and why the judging screens cannot
 * query the table directly.
 */
export async function GET(req: NextRequest) {
  try {
    requireJudge(req);

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get("submission_id");
    const judgeName = searchParams.get("judge_name");
    if (!submissionId || !judgeName) {
      return badRequest("submission_id and judge_name required");
    }

    const [row] = await getSiteDb()
      .select({ notes: hackathonVoterNotes.notes })
      .from(hackathonVoterNotes)
      .where(
        and(
          eq(hackathonVoterNotes.submissionId, submissionId),
          eq(hackathonVoterNotes.judgeName, judgeName),
        ),
      )
      .limit(1);

    return NextResponse.json({ notes: row?.notes ?? "" });
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-notes GET");
  }
}

/** POST /api/admin/hackathon-notes  { judge_name, submission_id, notes } */
export async function POST(req: NextRequest) {
  try {
    requireJudge(req);

    const { judge_name, submission_id, notes } = (await req.json()) as {
      judge_name?: string;
      submission_id?: string;
      notes?: string;
    };

    if (!judge_name || !submission_id) {
      return badRequest("judge_name and submission_id are required");
    }

    const text = notes ?? "";
    const updatedAt = new Date().toISOString();

    await getSiteDb()
      .insert(hackathonVoterNotes)
      .values({ judgeName: judge_name, submissionId: submission_id, notes: text, updatedAt })
      // The table's primary key is (judge_name, submission_id), which is what the
      // previous upsert conflicted on.
      .onConflictDoUpdate({
        target: [hackathonVoterNotes.judgeName, hackathonVoterNotes.submissionId],
        set: { notes: text, updatedAt },
      });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-notes POST");
  }
}
