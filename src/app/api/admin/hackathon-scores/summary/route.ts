import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { hackathonScores, hackathonSubmissions } from "@/db/site/schema";
import { requireJudge } from "@/lib/api/judge-auth";
import { handleApiError } from "@/lib/api/respond";

const JUDGE_COUNT = 5;

const TRACK_CRITERIA: Record<string, { key: string; weight: number }[]> = {
  "Validating a Business Idea": [
    { key: "pipeline_coverage", weight: 0.25 },
    { key: "scoring_logic", weight: 0.35 },
    { key: "speed_scalability", weight: 0.25 },
    { key: "demo_clarity", weight: 0.15 },
  ],
  "Continuous Market Monitoring": [
    { key: "signal_relevance", weight: 0.35 },
    { key: "realtime_capability", weight: 0.25 },
    { key: "actionability", weight: 0.25 },
    { key: "demo_clarity", weight: 0.15 },
  ],
  "Synthetic Customers": [
    { key: "feedback_fidelity", weight: 0.35 },
    { key: "nonobvious_insights", weight: 0.25 },
    { key: "time_cost_savings", weight: 0.25 },
    { key: "demo_clarity", weight: 0.15 },
  ],
};

export async function GET(req: NextRequest) {
  try {
    return await summary(req);
  } catch (err) {
    return handleApiError(err, "api/admin/hackathon-scores/summary");
  }
}

async function summary(req: NextRequest) {
  requireJudge(req);

  const db = getSiteDb();

  const submissions = await db
    .select({
      id: hackathonSubmissions.id,
      title: hackathonSubmissions.title,
      team_name: hackathonSubmissions.teamName,
      challenge_track: hackathonSubmissions.challengeTrack,
    })
    .from(hackathonSubmissions)
    .where(eq(hackathonSubmissions.isFinalist, true));

  if (!submissions.length) return NextResponse.json({ tracks: {} });

  const submissionIds = submissions.map((s) => s.id);

  const allScores = await db
    .select({
      submission_id: hackathonScores.submissionId,
      judge_name: hackathonScores.judgeName,
      criterion_key: hackathonScores.criterionKey,
      score: hackathonScores.score,
    })
    .from(hackathonScores)
    .where(inArray(hackathonScores.submissionId, submissionIds));

  const result: Record<string, {
    pct: number;
    judgesIn: number;
    judgesTotal: number;
    winner: { title: string; team_name: string | null; avg_score: number } | null;
  }> = {};

  for (const [track, criteria] of Object.entries(TRACK_CRITERIA)) {
    const trackSubs = submissions.filter((s) => s.challenge_track === track);
    if (!trackSubs.length) {
      result[track] = { pct: 0, judgesIn: 0, judgesTotal: JUDGE_COUNT, winner: null };
      continue;
    }

    const trackSubIds = new Set(trackSubs.map((s) => s.id));
    const trackScores = allScores.filter((s) => trackSubIds.has(s.submission_id));

    // Count distinct judges who have scored at least one submission in this track
    const judgesIn = new Set(trackScores.map((s) => s.judge_name)).size;
    const pct = Math.min(Math.round((judgesIn / JUDGE_COUNT) * 100), 100);

    // Calculate winner: highest average weighted score across all judges
    const scoresBySubmission: Record<string, { total: number; judgeCount: number }> = {};
    for (const sub of trackSubs) {
      const subScores = trackScores.filter((s) => s.submission_id === sub.id);
      const judgeNames = [...new Set(subScores.map((s) => s.judge_name))];
      if (!judgeNames.length) continue;

      let judgeWeightedTotal = 0;
      for (const judge of judgeNames) {
        const judgeScores = subScores.filter((s) => s.judge_name === judge);
        const scoreMap: Record<string, number> = {};
        for (const s of judgeScores) scoreMap[s.criterion_key] = s.score;
        const weighted = criteria.reduce((sum, c) => sum + (scoreMap[c.key] ?? 0) * c.weight, 0) * 20;
        judgeWeightedTotal += weighted;
      }
      scoresBySubmission[sub.id] = { total: judgeWeightedTotal, judgeCount: judgeNames.length };
    }

    let winner: { title: string; team_name: string | null; avg_score: number } | null = null;
    let bestAvg = -1;
    for (const sub of trackSubs) {
      const entry = scoresBySubmission[sub.id];
      if (!entry) continue;
      const avg = entry.total / entry.judgeCount;
      if (avg > bestAvg) {
        bestAvg = avg;
        winner = { title: sub.title ?? sub.team_name ?? "Untitled", team_name: sub.team_name, avg_score: Math.round(avg) };
      }
    }

    result[track] = { pct, judgesIn, judgesTotal: JUDGE_COUNT, winner };
  }

  return NextResponse.json({ tracks: result });
}
