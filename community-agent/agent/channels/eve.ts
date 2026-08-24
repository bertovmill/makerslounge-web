import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc, type AuthFn } from "eve/channels/auth";
import { createClerkClient } from "@clerk/backend";
import { eq } from "drizzle-orm";
import { getDb, profiles } from "../lib/db";

/**
 * Route auth for the community agent.
 *
 * This is the single place the caller's identity is established, and it is the
 * reason the tools can trust `ctx.session.auth`. The `/api/matcher-chat` route
 * this agent replaced read `userId` and `isAdmin` straight out of the request
 * body, which the browser filled in from its own state:
 *
 *   isAdmin: true  unlocked search over `community_contacts` — private records
 *                  with emails, phone numbers and LinkedIn URLs.
 *   userId: <uuid> made `send_message` send as that person. Profile uuids are
 *                  public, so anyone could forge a message from anyone.
 *
 * Both are now derived here from the Clerk session cookie and travel on the
 * session's auth attributes, which no client and no model can set.
 */

/** The admin account. Mirrors ADMIN_EMAIL in `src/lib/api/auth.ts`. */
const ADMIN_EMAIL = "bertmill19@gmail.com";

function clerkSession(): AuthFn<Request> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return () => null;

  const clerk = createClerkClient({
    secretKey,
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  });

  return async (request) => {
    const state = await clerk.authenticateRequest(request);
    const auth = state.toAuth();
    if (!auth?.userId) return null; // skip; fall through to the next entry

    // Every foreign key in the database points at `profiles.id`, not at the
    // Clerk id, so resolve it once here and let the tools use it directly.
    const [profile] = await getDb()
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.clerkUserId, auth.userId))
      .limit(1);

    // Read the email from Clerk's user record, never from `profiles` — there is
    // no email column there, and it must never come from the request.
    const user = await clerk.users.getUser(auth.userId);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

    return {
      // `attributes` is typed `Record<string, string | readonly string[]>`, so
      // the admin flag travels as a string. `lib/caller.ts` is the only place
      // that reads it back, and it compares against "true" exactly.
      attributes: {
        profileId: profile?.id ?? "",
        isAdmin: email === ADMIN_EMAIL ? "true" : "false",
      },
      authenticator: "clerk",
      principalId: auth.userId,
      principalType: "user",
    };
  };
}

export default eveChannel({
  auth: [
    // App users signed in with Clerk, the way the browser reaches the agent.
    clerkSession(),
    // Lets the eve TUI and your Vercel deployments reach the deployed agent.
    vercelOidc(),
    // Open on localhost for `eve dev` and the REPL; ignored in production.
    localDev(),
  ],
});
