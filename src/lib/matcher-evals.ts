/**
 * Shapes shared by the matcher-evals admin page and its API. A run's `results`
 * column is written by evals/matcher/run.ts; this is what the page reads back.
 */
import type { Participant, PersonMatches } from "@/lib/meetup-matcher";

export interface JudgeVerdict {
  person_id: string;
  need: string;
  needs_met: boolean;
  verdicts: { matched_id: string; helps_with_need: boolean; why: string }[];
}

export interface RunResults {
  participants: Participant[];
  planted: { person_id: string; should_match_id: string; why: string }[];
  planted_missed: { person_id: string; should_match_id: string }[];
  people: (PersonMatches & { issues: string[]; judge: JudgeVerdict | null })[];
}

export interface EvalLabel {
  person_id: string;
  matched_id: string;
  good: boolean;
  note: string | null;
}

export interface RunSummary {
  id: string;
  dataset: string;
  model: string;
  judge_model: string;
  git_sha: string | null;
  passed: boolean;
  metrics: Record<string, number | null>;
  thresholds: Record<string, number>;
  created_at: string;
  total_matches: number;
  labeled: number;
  /** Of the matches both Berto and the judge graded, the share where they agree. Null until there's overlap. */
  judge_agreement: number | null;
}

/** Agreement between Berto's thumbs and the judge's "helps with need" verdicts. */
export function judgeAgreement(results: RunResults, labels: EvalLabel[]): number | null {
  let both = 0;
  let agree = 0;
  for (const label of labels) {
    const person = results.people.find((p) => p.person_id === label.person_id);
    const verdict = person?.judge?.verdicts.find((v) => v.matched_id === label.matched_id);
    if (!verdict) continue;
    both++;
    if (verdict.helps_with_need === label.good) agree++;
  }
  return both ? agree / both : null;
}
