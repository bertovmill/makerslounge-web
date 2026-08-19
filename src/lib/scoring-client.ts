/**
 * Hackathon judging, via the judge-gated routes.
 *
 * Every call carries the shared judging password in `x-admin-password`, which is how
 * these screens have always authenticated — see src/lib/api/judge-auth.ts for why that
 * is still a shared secret and what is wrong with it.
 */

export interface Finalist {
  id: string;
  title: string | null;
  team_name: string | null;
  challenge_track: string | null;
  description: string | null;
}

export interface ScoreRow {
  submission_id: string;
  judge_name: string;
  criterion_key: string;
  score: number;
}

function headers(password: string): HeadersInit {
  return { "Content-Type": "application/json", "x-admin-password": password };
}

/** Finalist submissions, display fields only. */
export async function fetchFinalists(password: string): Promise<Finalist[]> {
  try {
    const res = await fetch("/api/hackathon/finalists", {
      headers: headers(password),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data: Finalist[] };
    return body.data ?? [];
  } catch (err) {
    console.error("[scoring] finalists unreachable:", err);
    return [];
  }
}

/**
 * Scores. Pass a `judgeName` for one judge's, or `all` for the whole tally.
 *
 * The screens used to read these per submission, or select the entire table.
 */
export async function fetchScores(
  password: string,
  opts: { judgeName?: string; all?: boolean } = {},
): Promise<ScoreRow[]> {
  const params = new URLSearchParams();
  if (opts.judgeName) params.set("judge_name", opts.judgeName);
  if (opts.all) params.set("all", "1");

  try {
    const res = await fetch(`/api/admin/hackathon-scores?${params}`, {
      headers: headers(password),
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as ScoreRow[];
  } catch (err) {
    console.error("[scoring] scores unreachable:", err);
    return [];
  }
}

/** Record one criterion's score. Upserts on (judge, submission, criterion). */
export async function saveScore(
  password: string,
  input: { judgeName: string; submissionId: string; criterionKey: string; score: number },
): Promise<boolean> {
  try {
    const res = await fetch("/api/admin/hackathon-scores", {
      method: "POST",
      headers: headers(password),
      body: JSON.stringify({
        judge_name: input.judgeName,
        submission_id: input.submissionId,
        criterion_key: input.criterionKey,
        score: input.score,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[scoring] save failed:", err);
    return false;
  }
}

/** Clear every score a judge has entered. */
export async function resetJudgeScores(password: string, judgeName: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/admin/hackathon-scores?judge_name=${encodeURIComponent(judgeName)}`,
      { method: "DELETE", headers: headers(password) },
    );
    return res.ok;
  } catch (err) {
    console.error("[scoring] reset failed:", err);
    return false;
  }
}
