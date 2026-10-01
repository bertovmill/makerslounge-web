import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { matcherEvalLabels, matcherEvalRuns } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";

type Ctx = { params: Promise<{ id: string }> };

/** One run: every match May made, the judge's verdicts, and Berto's labels so far. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    await requireAdmin();
    const { id } = await params;
    const db = getSiteDb();
    const [run] = await db.select().from(matcherEvalRuns).where(eq(matcherEvalRuns.id, id));
    if (!run) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const labels = await db.select().from(matcherEvalLabels).where(eq(matcherEvalLabels.runId, id));
    return NextResponse.json({
      run,
      labels: labels.map((l) => ({ person_id: l.personId, matched_id: l.matchedId, good: l.good, note: l.note })),
    });
  } catch (err) {
    return handleApiError(err, "matcher-evals:get");
  }
}
