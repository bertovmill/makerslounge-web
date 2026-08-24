import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, arrayOverlaps, isNotNull } from "drizzle-orm";
import { communityContacts, getDb, profiles } from "../lib/db";
import { caller } from "../lib/caller";
import { contactCols, formatProfile, profileCols, toContact } from "../lib/format";

/** Loose containment either way, so "AI" matches "AI/ML" and vice versa. */
function hasEverySkill(owned: string[] | null | undefined, wanted: string[]) {
  return wanted.every((skill) =>
    owned?.some(
      (s) =>
        s.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(s.toLowerCase()),
    ),
  );
}

export default defineTool({
  description:
    "Filter community members who have specific skills. Use when the user needs people with particular expertise like 'design', 'AI', 'React', 'marketing', etc.",
  inputSchema: z.object({
    skills: z
      .array(z.string())
      .describe("Skills to filter by (e.g. ['AI', 'Web Dev', 'Design'])"),
    match_all: z
      .boolean()
      .optional()
      .describe("If true, person must have ALL listed skills. Default false (any match)."),
  }),
  async execute({ skills, match_all }, ctx) {
    const db = getDb();
    const { isAdmin } = caller(ctx);

    const data = await db
      .select(profileCols)
      .from(profiles)
      .where(and(isNotNull(profiles.name), arrayOverlaps(profiles.skills, skills)));

    if (data.length === 0) {
      return { results: [], message: `No makers found with skills: ${skills.join(", ")}` };
    }

    const filtered = match_all ? data.filter((p) => hasEverySkill(p.skills, skills)) : data;
    const results: Record<string, unknown>[] = filtered.map(formatProfile);

    if (isAdmin) {
      const contacts = await db
        .select(contactCols)
        .from(communityContacts)
        .where(arrayOverlaps(communityContacts.skills, skills));

      const filteredContacts = match_all
        ? contacts.filter((c) => hasEverySkill(c.skills, skills))
        : contacts;

      results.push(...filteredContacts.map(toContact));
    }

    return { results, count: results.length };
  },
});
