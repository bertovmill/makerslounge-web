import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";
import { ADMIN_EMAIL } from "@/lib/api/auth";

/**
 * Server-side equivalent of `useAuth()`.
 *
 * Route handlers and server components used to call `supabase.auth.getUser()`.
 * Clerk owns the session now, but the rest of the app still keys everything on
 * the profile uuid, so this resolves one to the other.
 *
 * Reads from Neon. This previously went through Supabase with the service-role
 * key to get around RLS; there is no RLS to get around any more, and the
 * authorization that RLS used to provide now lives in `@/lib/api/auth`.
 *
 * These return null rather than throwing, which suits the server components that
 * use them to decide what to render. API routes should prefer `requireUser()` /
 * `requireAdmin()` from `@/lib/api/auth`, which fail closed.
 */

export interface ServerAppUser {
  /** Profile uuid — what every foreign key points at. */
  id: string;
  clerkUserId: string;
  email: string | null;
}

/** Returns null when signed out. */
export async function getServerAppUser(): Promise<ServerAppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const profileId = await profileIdForClerkId(userId);
  if (!profileId) return null;

  const user = await currentUser();
  return {
    id: profileId,
    clerkUserId: userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };
}

/** Profile uuid only, for callers that don't need the email. */
export async function getServerProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return profileIdForClerkId(userId);
}

async function profileIdForClerkId(clerkUserId: string): Promise<string | null> {
  const db = getSiteDb();
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, clerkUserId))
    .limit(1);
  return row?.id ?? null;
}

export async function isServerAdmin(): Promise<boolean> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() === ADMIN_EMAIL;
}

export { ADMIN_EMAIL };
