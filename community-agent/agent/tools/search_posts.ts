import { defineTool } from "eve/tools";
import { z } from "zod";
import { desc, eq, ilike, or } from "drizzle-orm";
import { getDb, profiles, projects } from "../lib/db";
import { formatProfile } from "../lib/format";

export default defineTool({
  description:
    "Search through community members' recent posts/projects by keyword. Posts reveal what people are actively thinking about, building, and sharing. Use this to find people based on their recent activity and interests.",
  inputSchema: z.object({
    query: z.string().describe("Search keyword to match against post titles and descriptions"),
  }),
  async execute({ query }) {
    const db = getDb();
    const searchTerm = `%${query}%`;

    // An inner join, matching PostgREST's `profiles!inner`: a post whose author
    // is missing is dropped rather than rendered authorless.
    const data = await db
      .select({
        title: projects.title,
        description: projects.description,
        created_at: projects.createdAt,
        authorId: profiles.id,
        authorName: profiles.name,
        authorUsername: profiles.username,
        authorBio: profiles.bio,
        authorSkills: profiles.skills,
        authorPhoto: profiles.photoUrl,
      })
      .from(projects)
      .innerJoin(profiles, eq(profiles.id, projects.userId))
      .where(or(ilike(projects.title, searchTerm), ilike(projects.description, searchTerm)))
      .orderBy(desc(projects.createdAt))
      .limit(15);

    if (data.length === 0) {
      return { results: [], message: "No posts found matching that query" };
    }

    const results = data.map((post) => ({
      post_title: post.title,
      post_description: post.description?.slice(0, 200) || null,
      posted_at: post.created_at,
      author: formatProfile({
        id: post.authorId,
        name: post.authorName,
        username: post.authorUsername,
        bio: post.authorBio,
        skills: post.authorSkills,
        photo_url: post.authorPhoto,
      }),
    }));

    return { results, count: results.length };
  },
});
