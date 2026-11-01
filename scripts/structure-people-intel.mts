/**
 * Turns each contact's free-text event answers into structured knowledge.
 *
 *   node --env-file=.env.local scripts/structure-people-intel.mts [--limit N] [--dry-run] [--redo]
 *
 * Reads what `import-luma-guests.mts` folded into `metadata.intel` (plus
 * Berto's notes and the events the person came to) and asks a model for clean
 * skill tags, projects, needs, domains and a short summary. Writes:
 *
 *   * `metadata.intel.structured`: the whole result, with model and date.
 *   * `skills`: merged with the existing tags, never replaced. The community
 *     agent's `filter_by_skills` matches this column exactly, so the model is
 *     steered onto the tags already in use.
 *   * `summary`: only where there is none, so hand-written ones win.
 *
 * Only people with something to structure are sent, and each person once;
 * `--redo` re-runs people who already have a structured result.
 */
import { generateObject } from "ai";
import { z } from "zod";
import { neon } from "@neondatabase/serverless";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const redo = args.includes("--redo");
const limit = Number(args[args.indexOf("--limit") + 1]) || null;
const MODEL = process.env.INTEL_MODEL ?? "anthropic/claude-sonnet-5.5";
const CONCURRENCY = 8;

const FREE_TEXT = ["projects", "superpowers", "needs", "tools", "ai_wishes", "communities"];

const sql = neon(process.env.DATABASE_URL!);

// The tags people already pick from on Luma forms. The model reuses these
// wording-for-wording when they fit, so filters keep working.
const vocabulary = (
  await sql.query(
    `select s from makerslounge.community_contacts, unnest(skills) s
      group by s having count(*) >= 3 order by count(*) desc`,
  )
).map((r) => r.s as string);

const people = await sql.query(
  `select c.id, c.name, c.company, c.role, c.location, c.linkedin, c.notes, c.summary, c.skills, c.metadata,
          coalesce((select jsonb_agg(jsonb_build_object(
                      'event', e.name, 'date', e.starts_at::date, 'status', g.status,
                      'checked_in', g.checked_in_at is not null) order by e.starts_at)
                      from makerslounge.luma_event_guests g join makerslounge.luma_events e on e.id = g.luma_event_id
                     where g.contact_id = c.id), '[]') as events
     from makerslounge.community_contacts c
    where c.metadata -> 'intel' ?| $1::text[]
      ${redo ? "" : "and not (c.metadata -> 'intel' ? 'structured')"}
    order by c.created_at
    ${limit ? `limit ${limit}` : ""}`,
  [FREE_TEXT],
);

const Structured = z.object({
  summary: z
    .string()
    .describe(
      "Two sentences, third person, plain facts: who they are, what they build, what they bring. No hype. " +
        "Use their first name or they/them, never he/she/his/her.",
    ),
  roles: z
    .array(z.string())
    .describe("What they are, e.g. Founder, Software Engineer, Designer, Student, Researcher, Marketer, Investor, Community Builder"),
  skills: z.array(z.string()).describe("What they are good at, as short tags"),
  can_help_with: z.array(z.string()).describe("What they offered to teach or help others with, as short tags"),
  needs_help_with: z.array(z.string()).describe("What they asked for help with, as short tags"),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string().describe("One sentence on what it is and who it is for"),
      url: z.string().nullable(),
      stage: z.string().nullable().describe("idea, building, launched, growing, or null if unknown"),
    }),
  ),
  domains: z.array(z.string()).describe("Industries and topics they work in, e.g. AI agents, Fintech, Health, Education, Climate"),
  tools: z.array(z.string()).describe("Tools, languages and products they use"),
});

const system = `You turn a community member's event-registration answers into structured knowledge for MakersLounge, a Toronto builder community.

Rules:
- Use only what the input says. Never invent employers, projects, skills or links. Empty arrays are fine.
- For skills, can_help_with and needs_help_with, prefer these existing tags, spelled exactly, when they fit: ${vocabulary.join("; ")}. Add a new short tag (1 to 3 words, sentence case) only when none fits.
- Merge duplicates: the same project mentioned at several events is one project.
- Ignore joke or filler answers.
- The summary is about the person and their work, not their event history (that is stored separately). Refer to them by first name or "they"; never guess pronouns from a name.
- Event status "invited" means they were only invited, not that they registered or came.
- Only list a project if it is something specific (a product, company, named idea). "Enterprise projects" or "my startup" alone is not a project.`;

let inputTokens = 0;
let outputTokens = 0;
let done = 0;
let failed = 0;

async function structure(p: Record<string, unknown>) {
  const { structured: _old, ...intel } = ((p.metadata as Record<string, unknown>)?.intel ?? {}) as Record<string, unknown>;
  const input = {
    name: p.name,
    company: p.company,
    role: p.role,
    location: p.location,
    organizer_notes: p.notes,
    existing_summary: p.summary,
    existing_skills: p.skills,
    answers: intel,
    events: p.events,
  };

  const { object, usage } = await generateObject({
    model: MODEL,
    schema: Structured,
    system,
    prompt: JSON.stringify(input, null, 1),
  });
  inputTokens += usage.inputTokens ?? 0;
  outputTokens += usage.outputTokens ?? 0;

  if (dryRun) {
    console.log(`\n### ${p.name}\n`, JSON.stringify(object, null, 1));
    return;
  }

  const existing = (p.skills as string[] | null) ?? [];
  const seen = new Set(existing.map((s) => s.toLowerCase()));
  const skills = [...existing, ...object.skills.filter((s) => !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()))];

  await sql.query(
    `update makerslounge.community_contacts set
       metadata   = jsonb_set(coalesce(metadata, '{}'), '{intel,structured}', $2::jsonb),
       skills     = $3::text[],
       summary    = coalesce(summary, $4),
       updated_at = now()
     where id = $1`,
    [p.id, JSON.stringify({ ...object, model: MODEL, structured_at: new Date().toISOString() }), skills, object.summary],
  );
}

console.log(`${people.length} people to structure with ${MODEL}${dryRun ? " (dry run)" : ""}`);

const queue = [...people];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    for (let p; (p = queue.shift()); ) {
      try {
        await structure(p);
        done++;
      } catch (err) {
        failed++;
        console.error(`failed: ${p.name} (${p.id}):`, (err as Error).message);
      }
      if ((done + failed) % 50 === 0) console.log(`${done + failed}/${people.length}`);
    }
  }),
);

console.log({ done, failed, inputTokens, outputTokens });
