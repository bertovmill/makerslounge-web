import { defineDynamic } from "eve";
import { defineInstructions } from "eve/instructions";
import { eq } from "drizzle-orm";
import { getDb, profiles } from "../lib/db";

/**
 * The old route rebuilt its system prompt on every request to splice in the
 * caller's profile and an ADMIN MODE paragraph. Both are properties of *who is
 * connected*, not of the turn, so they resolve once per session here.
 *
 * `isAdmin` comes from the auth attributes resolved in `channels/eve.ts`, which
 * read the Clerk cookie server-side. It is never taken from the client.
 */
export default defineDynamic({
  events: {
    "session.started": async (_event, ctx) => {
      const attributes = ctx.session.auth.current?.attributes as
        | { profileId?: string; isAdmin?: string }
        | undefined;

      const profileId = attributes?.profileId || null;
      const isAdmin = attributes?.isAdmin === "true";

      const sections: string[] = [];

      if (isAdmin) {
        sections.push(
          `## Admin mode

You have access to the full community database including community contacts (event
attendees who haven't signed up yet). These show as type "community_contact" in
results and link to /community/[id]. When presenting community contacts, note they
are "community members" (not yet registered). You can still recommend them for
introductions.`,
        );
      }

      if (profileId) {
        const [row] = await getDb()
          .select({
            name: profiles.name,
            bio: profiles.bio,
            skills: profiles.skills,
            lookingForSkills: profiles.lookingForSkills,
            currentlyBuilding: profiles.currentlyBuilding,
          })
          .from(profiles)
          .where(eq(profiles.id, profileId))
          .limit(1);

        if (row) {
          sections.push(
            `## The person you're talking to

- Name: ${row.name || "Unknown"}
- Skills: ${row.skills?.join(", ") || "None listed"}
- Looking for: ${row.lookingForSkills?.join(", ") || "Not specified"}
- Building: ${row.currentlyBuilding || "Not specified"}
- Bio: ${row.bio || "No bio"}

Use this context to make better recommendations. For example, if they have design
skills, you can tell them about people looking for designers.`,
          );
        }
      } else {
        sections.push(
          `## The person you're talking to

They are not signed in. Recommend freely, but \`send_intro_message\` will fail —
tell them to sign in first rather than attempting it.`,
        );
      }

      return defineInstructions({ markdown: sections.join("\n\n") });
    },
  },
});
