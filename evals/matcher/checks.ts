import type { Participant, PersonMatches } from "@/lib/meetup-matcher";
import type { MatcherDataset } from "./dataset";

/**
 * Deterministic checks on May's output. Free, instant, and no judgement calls:
 * these are the rules in her own system prompt, enforced.
 */

export interface PersonCheck {
  person_id: string;
  /** Rule violations for this person's matches; empty means they passed. */
  issues: string[];
  /** Matches whose reason or starter mentions something the matched person actually wrote. */
  grounded: number;
  total: number;
}

const STOPWORDS = new Set(
  "about after again also always because before being between build building could their there these those through would which while with without your yours they them this that from have into just like more most need needs other some such than what when where who will want looking great match people person really".split(" "),
);

/** Distinctive words from a profile: the vocabulary a specific reason would reuse. */
export function profileTerms(p: Participant): Set<string> {
  const text = [
    p.role,
    p.company,
    p.currently_building,
    p.looking_for_help,
    p.bio,
    ...(p.skills ?? []),
    ...Object.values(p.custom_fields ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return new Set(text.split(/[^a-z0-9+#.]+/).filter((w) => w.length >= 5 && !STOPWORDS.has(w)));
}

/** Does this text reuse at least one distinctive word from the profile? */
export function mentionsProfile(text: string, terms: Set<string>): boolean {
  const words = text.toLowerCase().split(/[^a-z0-9+#.]+/);
  return words.some((w) => terms.has(w));
}

export function checkPerson(entry: PersonMatches | undefined, person: Participant, byId: Map<string, Participant>): PersonCheck {
  if (!entry) return { person_id: person.id, issues: ["no matches returned"], grounded: 0, total: 0 };

  const issues: string[] = [];
  if (entry.matches.length !== 3) issues.push(`${entry.matches.length} matches (needs exactly 3)`);

  const seen = new Set<string>();
  let grounded = 0;
  for (const m of entry.matches) {
    const target = byId.get(m.matched_id);
    if (m.matched_id === person.id) issues.push("matched with themselves");
    if (!target) {
      issues.push(`unknown id ${m.matched_id}`);
      continue;
    }
    if (seen.has(m.matched_id)) issues.push(`duplicate match ${m.matched_id}`);
    seen.add(m.matched_id);
    if (target.name !== m.matched_name) issues.push(`name "${m.matched_name}" doesn't match id ${m.matched_id} (${target.name})`);
    if (!m.reason.trim() || !m.conversation_starter.trim()) issues.push(`empty reason or starter for ${m.matched_id}`);
    if (mentionsProfile(`${m.reason} ${m.conversation_starter}`, profileTerms(target))) grounded++;
  }
  return { person_id: person.id, issues, grounded, total: entry.matches.length };
}

export interface CheckSummary {
  people: PersonCheck[];
  /** Share of participants May returned matches for. */
  coverage: number;
  /** Share of participants whose matches break no rule. */
  structural_pass_rate: number;
  /** Share of matches whose reason or starter references the matched person's profile. */
  grounding: number;
  /** Share of planted pairs found in the person's top 3 (null when the dataset plants none). */
  planted_recall: number | null;
  planted_missed: { person_id: string; should_match_id: string }[];
  /** Entries for people who aren't at the meetup. */
  extra_entries: string[];
}

export function runChecks(dataset: MatcherDataset, matches: PersonMatches[]): CheckSummary {
  const byId = new Map(dataset.participants.map((p) => [p.id, p]));
  const entryFor = new Map(matches.map((m) => [m.person_id, m]));

  const people = dataset.participants.map((p) => checkPerson(entryFor.get(p.id), p, byId));
  const n = dataset.participants.length;
  const totalMatches = people.reduce((s, p) => s + p.total, 0);

  const planted = dataset.planted ?? [];
  const planted_missed = planted
    .filter((pp) => !entryFor.get(pp.person_id)?.matches.some((m) => m.matched_id === pp.should_match_id))
    .map(({ person_id, should_match_id }) => ({ person_id, should_match_id }));

  return {
    people,
    coverage: people.filter((p) => p.total > 0).length / n,
    structural_pass_rate: people.filter((p) => p.issues.length === 0).length / n,
    grounding: totalMatches ? people.reduce((s, p) => s + p.grounded, 0) / totalMatches : 0,
    planted_recall: planted.length ? (planted.length - planted_missed.length) / planted.length : null,
    planted_missed,
    extra_entries: matches.map((m) => m.person_id).filter((id) => !byId.has(id)),
  };
}
