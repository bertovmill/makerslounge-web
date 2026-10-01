import { generateObject, type LanguageModelUsage } from "ai";
import { z } from "zod";
import type { Participant, PersonMatches } from "@/lib/meetup-matcher";

/**
 * The "needs met" judge: for each person who said what they need, can at least
 * one of their three matches actually help with it?
 *
 * A different, cheaper model than May on purpose, so she isn't grading her own
 * homework. Its verdicts are checked against Berto's thumbs up/down at
 * /admin/matcher-evals; agreement there is what makes this score trustworthy.
 */

export const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL ?? "anthropic/claude-haiku-4.5";

const verdictSchema = z.object({
  verdicts: z
    .array(
      z.object({
        matched_id: z.string(),
        helps_with_need: z.boolean().describe("Could this person plausibly help with the stated need?"),
        why: z.string().describe("One short sentence."),
      }),
    )
    .describe("One verdict per match, in the order given."),
});

export interface PersonVerdict {
  person_id: string;
  need: string;
  needs_met: boolean;
  verdicts: { matched_id: string; helps_with_need: boolean; why: string }[];
}

function describe(p: Participant): string {
  return JSON.stringify({
    name: p.name,
    role: p.role,
    company: p.company,
    building: p.currently_building,
    skills: p.skills,
    looking_for_help: p.looking_for_help,
    ...p.custom_fields,
  });
}

async function judgePerson(person: Participant, entry: PersonMatches, byId: Map<string, Participant>) {
  const matched = entry.matches.map((m) => ({ m, profile: byId.get(m.matched_id) })).filter((x) => x.profile);
  const { object, usage } = await generateObject({
    model: JUDGE_MODEL,
    schema: verdictSchema,
    temperature: 0,
    system:
      "You grade introductions made at a builder meetup. Be strict: a match helps only if their profile shows they can do or provide the specific thing asked for, not just that they work in tech.",
    prompt: `Person and what they need:\n${describe(person)}\n\nTheir matches:\n${matched
      .map(({ m, profile }) => `- id ${m.matched_id}: ${describe(profile!)}\n  May's reason: ${m.reason}`)
      .join("\n")}\n\nFor each match, could they plausibly help with: "${person.looking_for_help}"?`,
  });
  const verdicts = object.verdicts.filter((v) => matched.some(({ m }) => m.matched_id === v.matched_id));
  return {
    verdict: {
      person_id: person.id,
      need: person.looking_for_help ?? "",
      needs_met: verdicts.some((v) => v.helps_with_need),
      verdicts,
    } satisfies PersonVerdict,
    usage,
  };
}

/** "N/A", "nothing", "-": an answer to the form, not a need anyone could meet. */
export function isRealNeed(need: string | null | undefined): boolean {
  const t = (need ?? "").trim().toLowerCase().replace(/[.!]+$/, "");
  return t.length > 2 && !/^(n\/?a|none|nothing|no|nope|not sure|idk|-+)$/.test(t);
}

/** Judge everyone who stated a need, a few at a time. */
export async function judgeNeedsMet(participants: Participant[], matches: PersonMatches[], concurrency = 5) {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const entryFor = new Map(matches.map((m) => [m.person_id, m]));
  const queue = participants.filter((p) => isRealNeed(p.looking_for_help) && entryFor.get(p.id)?.matches.length);

  const verdicts: PersonVerdict[] = [];
  let inputTokens = 0;
  let outputTokens = 0;
  async function worker() {
    for (let p = queue.shift(); p; p = queue.shift()) {
      const { verdict, usage } = await judgePerson(p, entryFor.get(p.id)!, byId);
      verdicts.push(verdict);
      inputTokens += usage.inputTokens ?? 0;
      outputTokens += usage.outputTokens ?? 0;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const order = new Map(participants.map((p, i) => [p.id, i]));
  verdicts.sort((a, b) => order.get(a.person_id)! - order.get(b.person_id)!);
  return {
    verdicts,
    needs_met: verdicts.length ? verdicts.filter((v) => v.needs_met).length / verdicts.length : null,
    usage: { inputTokens, outputTokens } as Pick<LanguageModelUsage, "inputTokens" | "outputTokens">,
  };
}
