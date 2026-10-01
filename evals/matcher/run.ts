/**
 * Evaluate May, the meetup matcher, on one dataset.
 *
 *   npm run eval:matcher                       # synthetic meetup, judge on, saved to the DB
 *   npm run eval:matcher -- my-meetup-12       # a private dataset from data/private/
 *   npm run eval:matcher -- --no-judge         # hard checks only (free, no judge calls)
 *   npm run eval:matcher -- --no-save          # don't record the run
 *
 * Exits 1 when any metric falls below evals/matcher/thresholds.json, so it can
 * gate a deploy. Runs show up at /admin/matcher-evals for grading.
 */
import { execSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runMeetupMatcher } from "@/lib/meetup-matcher";
import { getSiteDb } from "@/db/site";
import { matcherEvalRuns } from "@/db/site/schema";
import { loadDataset } from "./dataset";
import { runChecks } from "./checks";
import { JUDGE_MODEL, judgeNeedsMet } from "./judge";

type Thresholds = Record<string, number>;

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const datasetName = args.find((a) => !a.startsWith("--")) ?? "synthetic-meetup";

const pct = (v: number | null) => (v === null ? "  n/a" : `${(v * 100).toFixed(0).padStart(4)}%`);

async function main() {
  const started = Date.now();
  const dataset = await loadDataset(datasetName);
  const thresholds: Thresholds = JSON.parse(
    await readFile(path.join(process.cwd(), "evals", "matcher", "thresholds.json"), "utf8"),
  );

  console.log(`May on "${dataset.name}": ${dataset.participants.length} people, ${dataset.planted?.length ?? 0} planted pairs`);
  const run = await runMeetupMatcher({
    meetupName: dataset.meetupName,
    participants: dataset.participants,
    onStep: (m) => console.log(`  ${m}`),
  });
  const matches = run.matches ?? [];
  if (!run.matches) console.log("  May returned no matches.");

  const checks = runChecks(dataset, matches);
  const judged = flags.has("--no-judge") ? null : await judgeNeedsMet(dataset.participants, matches);

  const metrics: Record<string, number | null> = {
    coverage: checks.coverage,
    structural_pass_rate: checks.structural_pass_rate,
    planted_recall: checks.planted_recall,
    grounding: checks.grounding,
    needs_met: judged?.needs_met ?? null,
  };

  // A metric that wasn't measured (no planted pairs, judge off) can't fail the run.
  const failures = Object.entries(thresholds).filter(([k, min]) => metrics[k] !== null && metrics[k]! < min);
  const passed = failures.length === 0;

  console.log("\n  metric                 score   min");
  for (const [k, v] of Object.entries(metrics)) {
    const min = thresholds[k];
    const mark = v === null ? " " : min !== undefined && v < min ? "✗" : "✓";
    console.log(`  ${mark} ${k.padEnd(21)} ${pct(v)}  ${min !== undefined ? pct(min) : ""}`);
  }
  for (const miss of checks.planted_missed) console.log(`  missed planted pair: ${miss.person_id} → ${miss.should_match_id}`);
  for (const person of checks.people.filter((p) => p.issues.length)) console.log(`  ${person.person_id}: ${person.issues.join("; ")}`);
  for (const unmet of judged?.verdicts.filter((v) => !v.needs_met) ?? []) console.log(`  need not met for ${unmet.person_id}: "${unmet.need}"`);

  const usage = {
    matcher: { input: run.usage.inputTokens ?? 0, output: run.usage.outputTokens ?? 0 },
    judge: judged ? { input: judged.usage.inputTokens ?? 0, output: judged.usage.outputTokens ?? 0 } : null,
  };
  console.log(`\n  tokens: May ${usage.matcher.input} in / ${usage.matcher.output} out` +
    (usage.judge ? `, judge ${usage.judge.input} in / ${usage.judge.output} out` : ""));

  if (!flags.has("--no-save") && process.env.DATABASE_URL) {
    let gitSha: string | null = null;
    try {
      gitSha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
    } catch {}
    const verdictFor = new Map(judged?.verdicts.map((v) => [v.person_id, v]) ?? []);
    const [row] = await getSiteDb()
      .insert(matcherEvalRuns)
      .values({
        dataset: dataset.name,
        model: run.model,
        judgeModel: judged ? JUDGE_MODEL : "none",
        gitSha,
        passed,
        metrics,
        thresholds,
        results: {
          participants: dataset.participants,
          planted: dataset.planted ?? [],
          planted_missed: checks.planted_missed,
          people: matches.map((m) => ({
            ...m,
            issues: checks.people.find((p) => p.person_id === m.person_id)?.issues ?? [],
            judge: verdictFor.get(m.person_id) ?? null,
          })),
        },
        usage,
        durationMs: Date.now() - started,
      })
      .returning({ id: matcherEvalRuns.id });
    console.log(`  saved run ${row.id} — grade it at /admin/matcher-evals`);
  }

  console.log(passed ? "\nPASS" : `\nFAIL: ${failures.map(([k]) => k).join(", ")} below threshold`);
  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
