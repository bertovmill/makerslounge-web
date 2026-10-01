import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { matcherEvalLabels } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { badRequest, handleApiError } from "@/lib/api/respond";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Grade one match: { person_id, matched_id, good, note? }. Grading the same
 * match again replaces the earlier grade. DELETE with the same ids undoes it.
 */
export async function POST(req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await req.json();
    if (typeof b.person_id !== "string" || typeof b.matched_id !== "string" || typeof b.good !== "boolean") {
      return badRequest("person_id, matched_id and good are required");
    }
    const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 1000) : null;
    await getSiteDb()
      .insert(matcherEvalLabels)
      .values({ runId: id, personId: b.person_id, matchedId: b.matched_id, good: b.good, note })
      .onConflictDoUpdate({
        target: [matcherEvalLabels.runId, matcherEvalLabels.personId, matcherEvalLabels.matchedId],
        set: { good: b.good, note },
      });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "matcher-evals:label");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const b = await req.json();
    await getSiteDb()
      .delete(matcherEvalLabels)
      .where(
        and(
          eq(matcherEvalLabels.runId, id),
          eq(matcherEvalLabels.personId, String(b.person_id)),
          eq(matcherEvalLabels.matchedId, String(b.matched_id)),
        ),
      );
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err, "matcher-evals:unlabel");
  }
}
