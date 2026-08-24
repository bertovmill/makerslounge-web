import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, arrayOverlaps, isNotNull } from "drizzle-orm";
import { getDb, profiles } from "../lib/db";
import { formatProfile, profileCols } from "../lib/format";

export default defineTool({
  description:
    "Find people who are actively looking for specific skills or roles. Use to find people who NEED what the user offers — creating mutual value.",
  inputSchema: z.object({
    skills: z.array(z.string()).describe("Skills/roles to search for in looking_for fields"),
  }),
  async execute({ skills }) {
    const db = getDb();
    const data = await db
      .select(profileCols)
      .from(profiles)
      .where(and(isNotNull(profiles.name), arrayOverlaps(profiles.lookingForSkills, skills)));

    if (data.length === 0) {
      return { results: [], message: `No one currently looking for: ${skills.join(", ")}` };
    }

    return { results: data.map(formatProfile), count: data.length };
  },
});
