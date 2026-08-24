import { defineTool } from "eve/tools";
import { z } from "zod";
import { isNotNull } from "drizzle-orm";
import { communityContacts, getDb, profiles } from "../lib/db";
import { caller } from "../lib/caller";
import { formatProfile, profileCols } from "../lib/format";

export default defineTool({
  description:
    "Get a community overview — total members, common skills, and sample members. Use when the user wants to explore who's in the community.",
  inputSchema: z.object({}),
  async execute(_input, ctx) {
    const db = getDb();
    const { isAdmin } = caller(ctx);

    const data = await db.select(profileCols).from(profiles).where(isNotNull(profiles.name));

    // PostgREST returned the total alongside the rows; here the rows *are* the
    // whole filtered set, so the count is just its length.
    const count = data.length;

    const allSkills: Record<string, number> = {};
    for (const p of data) {
      for (const s of p.skills ?? []) allSkills[s] = (allSkills[s] || 0) + 1;
    }

    let communityCount = 0;
    if (isAdmin) {
      // One query instead of two: the skills are needed anyway, and the count
      // comes off the same rows.
      const contacts = await db
        .select({ skills: communityContacts.skills })
        .from(communityContacts);
      communityCount = contacts.length;

      for (const c of contacts) {
        for (const s of c.skills ?? []) allSkills[s] = (allSkills[s] || 0) + 1;
      }
    }

    const topSkills = Object.entries(allSkills)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([skill, cnt]) => ({ skill, count: cnt }));

    return {
      total_members: count + communityCount,
      registered_members: count,
      community_contacts: communityCount,
      top_skills: topSkills,
      sample_members: data.slice(0, 10).map(formatProfile),
    };
  },
});
