import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_PASSWORD = "makers2026";
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

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export async function GET(req: NextRequest) {
  if (req.headers.get("x-admin-password") !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = serviceClient();

  const { data: submissions } = await db
    .from("hackathon_submissions")
    .select("id, title, team_name, challenge_track")
    .eq("is_finalist", true);

  if (!submissions?.length) return NextResponse.json({ tracks: {} });

  const submissionIds = submissions.map((s) => s.id);

  const { data: scores } = await db
    .from("hackathon_scores")
    .select("submission_id, judge_name, criterion_key, score")
    .in("submission_id", submissionIds);

  const allScores = scores ?? [];

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

    let winner = null;
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
