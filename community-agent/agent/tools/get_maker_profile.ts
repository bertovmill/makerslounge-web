import { defineTool } from "eve/tools";
import { z } from "zod";
import { ilike, or } from "drizzle-orm";
import { getDb, profiles } from "../lib/db";
import { formatProfile, profileCols } from "../lib/format";

export default defineTool({
  description:
    "Get detailed profile for a specific person by name or username. Use to learn more about someone before recommending or introducing them.",
  inputSchema: z.object({
    name_or_username: z.string().describe("The person's name or username"),
  }),
  async execute({ name_or_username }) {
    const db = getDb();
    const term = `%${name_or_username}%`;
    const data = await db
      .select({
        ...profileCols,
        linkedin: profiles.linkedin,
        twitter: profiles.twitter,
        website: profiles.website,
      })
      .from(profiles)
      .where(or(ilike(profiles.name, term), ilike(profiles.username, term)))
      .limit(3);

    if (data.length === 0) {
      return { error: `No profile found for "${name_or_username}"` };
    }

    return {
      profiles: data.map((p) => ({
        ...formatProfile(p),
        looking_for: p.looking_for_skills || [],
        linkedin: p.linkedin || null,
        twitter: p.twitter || null,
        website: p.website || null,
      })),
    };
  },
});
