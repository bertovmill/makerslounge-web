import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { matcherEvalLabels, matcherEvalRuns } from "@/db/site/schema";
import { requireAdmin } from "@/lib/api/auth";
import { handleApiError } from "@/lib/api/respond";
import { judgeAgreement, type EvalLabel, type RunResults, type RunSummary } from "@/lib/matcher-evals";

/** Recent eval runs of May, newest first, with how far grading has got on each. */
export async function GET() {
  try {
    await requireAdmin();
    const db = getSiteDb();
    const [runs, labels] = await Promise.all([
      db.select().from(matcherEvalRuns).orderBy(desc(matcherEvalRuns.createdAt)).limit(30),
      db.select().from(matcherEvalLabels),
    ]);
    const summaries: RunSummary[] = runs.map((run) => {
      const results = run.results as RunResults;
      const runLabels: EvalLabel[] = labels.filter((l) => l.runId === run.id).map((l) => ({
        person_id: l.personId,
        matched_id: l.matchedId,
        good: l.good,
        note: l.note,
      }));
      return {
        id: run.id,
        dataset: run.dataset,
        model: run.model,
        judge_model: run.judgeModel,
        git_sha: run.gitSha,
        passed: run.passed,
        metrics: run.metrics as RunSummary["metrics"],
        thresholds: run.thresholds as RunSummary["thresholds"],
        created_at: run.createdAt,
        total_matches: results.people.reduce((n, p) => n + p.matches.length, 0),
        labeled: runLabels.length,
        judge_agreement: judgeAgreement(results, runLabels),
      };
    });
    return NextResponse.json({ runs: summaries });
  } catch (err) {
    return handleApiError(err, "matcher-evals:list");
  }
}
