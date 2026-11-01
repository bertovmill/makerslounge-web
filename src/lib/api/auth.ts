import { createHash, timingSafeEqual } from "node:crypto";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";

/**
 * Authorization for the site's API routes.
 *
 * This file is the replacement for Supabase's Row Level Security. Supabase
 * enforced 112 policies inside the database; Neon has no JWT-aware policy layer,
 * so those checks now have to happen here, in front of every query.
 *
 * That shift is the dangerous part of the migration, and the reason these helpers
 * exist rather than each route rolling its own check: a policy that stops being
 * enforced does not raise an error, it quietly returns rows it shouldn't.
 * `docs/rls-policy-inventory.md` catalogues every original policy and which of
 * the shapes below replaces it:
 *
 *   66 policies  `auth.uid() = user_id`        -> requireUser(), then scope the
 *                                                 query by the returned id
 *   14 policies  `auth.jwt()->>'email' = ...`  -> requireAdmin()
 *    1 policy    `auth.role() = 'authenticated'` -> requireUser()
 *   19 policies  `true`                        -> no check, but confirm the table
 *                                                 is genuinely public
 *   12 policies  compound                      -> read individually
 *
 * `requireUser` returns the **profile uuid**, not the Clerk id, because every
 * foreign key in the database points at `profiles.id`. Routes should scope their
 * queries with that value and never with anything taken from the request body.
 */

/** The admin account. Previously hardcoded into 14 separate SQL policies. */
export const ADMIN_EMAIL = "bertmill19@gmail.com";

export class ApiAuthError extends Error {
  constructor(
    readonly status: 401 | 403 | 404,
    readonly code: string,
  ) {
    super(code);
    this.name = "ApiAuthError";
  }
}

/**
 * The signed-in user's profile uuid, or throw.
 *
 * Throws rather than returning null so a route cannot accidentally continue with
 * an unauthenticated request by ignoring a return value. Pair with
 * `handleApiError` in the catch.
 */
export async function requireUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new ApiAuthError(401, "not_authenticated");

  const db = getSiteDb();
  const [row] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  // Authenticated with no profile row. GET /api/me creates it on first sight, so
  // reaching here means something is genuinely wrong rather than that the user is
  // new — do not treat it as "signed out".
  if (!row) throw new ApiAuthError(404, "no_profile");

  return row.id;
}

/** Profile uuid if signed in, otherwise null. For routes that serve both. */
export async function optionalUser(): Promise<string | null> {
  try {
    return await requireUser();
  } catch {
    return null;
  }
}

/**
 * Cael, Berto's agent, is an admin too. It has no Clerk session, so it calls with
 * `Authorization: Bearer <CAEL_ADMIN_TOKEN>` and acts as the admin account: the
 * same rights, and anything it creates is attributed to Berto's profile.
 *
 * Hashing both sides makes the comparison constant-time whatever the lengths.
 */
async function isAgentAdmin(): Promise<boolean> {
  const expected = process.env.CAEL_ADMIN_TOKEN;
  if (!expected) return false;
  let header = "";
  try {
    header = (await headers()).get("authorization") ?? "";
  } catch {
    return false; // outside a request (scripts, build): never the agent
  }
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return false;
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(token), digest(expected));
}

let adminProfileId: string | null = null;

/** The admin account's profile uuid, looked up through Clerk by email once per instance. */
async function getAdminProfileId(): Promise<string> {
  if (adminProfileId) return adminProfileId;
  const { data: users } = await (await clerkClient()).users.getUserList({
    emailAddress: [ADMIN_EMAIL],
  });
  if (!users[0]) throw new ApiAuthError(404, "no_profile");
  const [row] = await getSiteDb()
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, users[0].id))
    .limit(1);
  if (!row) throw new ApiAuthError(404, "no_profile");
  adminProfileId = row.id;
  return row.id;
}

/**
 * Assert the caller is the admin, and return their profile uuid.
 *
 * The email is read from Clerk's user record server-side. It must never come
 * from the request, and never from `profiles` — there is no email column there.
 */
export async function requireAdmin(): Promise<string> {
  if (await isAgentAdmin()) return getAdminProfileId();
  const profileId = await requireUser();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  if (email !== ADMIN_EMAIL) throw new ApiAuthError(403, "forbidden");
  return profileId;
}

/** Whether the caller is the admin, without throwing. */
export async function isAdmin(): Promise<boolean> {
  if (await isAgentAdmin()) return true;
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress?.toLowerCase() === ADMIN_EMAIL;
}
