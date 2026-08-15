import { eveChannel } from "eve/channels/eve";
import { localDev, vercelOidc, type AuthFn } from "eve/channels/auth";
import { createClerkClient } from "@clerk/backend";

/**
 * Authenticates browser traffic with the same Clerk session the rest of the app
 * uses. The workshop page is Clerk-protected, so the browser already sends the
 * session cookie on same-origin `/eve/v1/*` requests mounted by `withEve`.
 */
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

    return {
      attributes: { sessionId: auth.sessionId ?? "" },
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
