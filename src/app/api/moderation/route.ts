import { NextResponse } from "next/server";
import { getSiteDb } from "@/db/site";
import { blockedUsers, reports } from "@/db/site/schema";
import { requireUser } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

/**
 * Report or block another member.
 *
 * Both tables had row-owner INSERT policies (`current_profile_id() = reporter_id`
 * / `= blocker_id`), which the browser satisfied by sending its own id. Here the
 * id comes from the session, so a report cannot be filed in someone else's name —
 * which mattered, because a report is a moderation record about a third party.
 *
 * One route for both because the two actions are always offered together in the UI
 * and neither needs a listing endpoint: nothing in the app reads these back.
 */
export async function POST(request: Request) {
  try {
    const me = await requireUser();
    const body = (await request.json()) as {
      action?: string;
      targetUserId?: string;
      reason?: string;
      details?: string;
      /** Optional: the post being reported, when the report is about content. */
      projectId?: string;
    };

    const { action, targetUserId } = body;
    if (!targetUserId || typeof targetUserId !== "string") {
      return badRequest("targetUserId is required");
    }
    if (targetUserId === me) return badRequest("You can't report or block yourself");

    const db = getSiteDb();

    if (action === "report") {
      if (!body.reason) return badRequest("reason is required");
      await db.insert(reports).values({
        reporterId: me,
        reportedUserId: targetUserId,
        projectId: body.projectId || null,
        reason: body.reason,
        details: body.details || null,
      });
      return NextResponse.json({ success: true });
    }

    if (action === "block") {
      await db
        .insert(blockedUsers)
        .values({ blockerId: me, blockedId: targetUserId })
        // Blocking twice is not an error; the second is a no-op.
        .onConflictDoNothing();
      return NextResponse.json({ success: true });
    }

    return badRequest("action must be 'report' or 'block'");
  } catch (err) {
    return handleApiError(err, "api/moderation POST");
  }
}
