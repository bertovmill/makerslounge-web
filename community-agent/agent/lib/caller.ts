import type { ToolContext } from "eve/tools";

/**
 * Who is asking.
 *
 * The Next.js route this agent replaced read `userId` and `isAdmin` out of the
 * request body, which the browser filled in from its own auth state — so
 * `isAdmin: true` from any client unlocked the private `community_contacts`
 * table, and `userId` decided who a message was sent *as*. Both now ride on the
 * eve session's auth context, resolved once in `channels/eve.ts` from the Clerk
 * cookie and never from anything the model or the client can influence.
 */
export type Caller = {
  /** The caller's `profiles.id` uuid, or null when signed out. */
  profileId: string | null;
  isAdmin: boolean;
};

export function caller(ctx: { session: ToolContext["session"] }): Caller {
  const attributes = ctx.session.auth.current?.attributes as
    | { profileId?: string; isAdmin?: string }
    | undefined;

  return {
    // `channels/eve.ts` writes "" when the Clerk user has no `profiles` row yet,
    // which is a signed-in caller with nothing to scope queries by — same as
    // signed out for every use here.
    profileId: attributes?.profileId || null,
    // Exact match, defaulting to false: an unauthenticated or unrecognised
    // caller must never fall through into admin mode.
    isAdmin: attributes?.isAdmin === "true",
  };
}
