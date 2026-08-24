import { defineTool } from "eve/tools";
import { z } from "zod";
import { and, ilike, isNotNull, or } from "drizzle-orm";
import { communityContacts, getDb, profiles } from "../lib/db";
import { caller } from "../lib/caller";
import { contactCols, formatProfile, profileCols, toContact } from "../lib/format";

export default defineTool({
  description:
    "Search community members by keyword. Matches against name, bio, and what they're currently building. Use for general queries like finding someone by name, topic, or interest area.",
  inputSchema: z.object({
    query: z.string().describe("Search keyword — name, topic, technology, or interest"),
  }),
  async execute({ query }, ctx) {
    const db = getDb();
    const { isAdmin } = caller(ctx);
    // Parameterised: the search term is bound, not interpolated into a filter
    // string the way PostgREST's `.or()` required.
    const searchTerm = `%${query}%`;

    const rows = await db
      .select(profileCols)
      .from(profiles)
      .where(
        and(
          isNotNull(profiles.name),
          or(
            ilike(profiles.name, searchTerm),
            ilike(profiles.bio, searchTerm),
            ilike(profiles.currentlyBuilding, searchTerm),
          ),
        ),
      )
      .limit(15);

    const results: Record<string, unknown>[] = rows.map(formatProfile);

    // Admins also see event attendees who never signed up.
    if (isAdmin) {
      const contacts = await db
        .select(contactCols)
        .from(communityContacts)
        .where(
          or(
            ilike(communityContacts.name, searchTerm),
            ilike(communityContacts.firstName, searchTerm),
            ilike(communityContacts.lastName, searchTerm),
            ilike(communityContacts.summary, searchTerm),
            ilike(communityContacts.company, searchTerm),
          ),
        )
        .limit(15);

      results.push(...contacts.map(toContact));
    }

    if (results.length === 0) {
      return { results: [], message: "No makers found matching that query" };
    }

    return { results, count: results.length };
  },
});
