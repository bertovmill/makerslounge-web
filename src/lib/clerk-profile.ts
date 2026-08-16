import { supabase } from "./supabase";

/**
 * Bridge between Clerk identities and this app's user ids.
 *
 * Clerk owns authentication; Supabase still owns the data, and every foreign
 * key points at `profiles.id` — the uuid that used to come from Supabase Auth.
 * Rewriting those keys would stack a data migration on top of an auth
 * migration, so the two id spaces coexist instead: `profiles.clerk_user_id`
 * maps one to the other and the app keeps using the uuid it always has.
 *
 * The upshot is that `user.id` means exactly what it meant before the cutover,
 * so none of the ~72 call sites that read it need to change.
 *
 * Note there is no `profiles.email` column — email lives only on the identity
 * provider. Anything that needs an address reads it from Clerk, never from a
 * profile row.
 */

export interface AppUser {
  /** The uuid every foreign key points at. Formerly the Supabase auth uuid. */
  id: string;
  email: string | null;
  clerkUserId: string;
}

export async function findProfileIdByClerkId(
  clerkUserId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle();

  return data?.id ?? null;
}

/**
 * Create the profile row for a Clerk user that doesn't have one yet.
 *
 * Only reachable for accounts created after the 2026-08-16 import, since all
 * 138 existing users already carry a `clerk_user_id`.
 *
 * `profiles.id` has no database default — it used to be supplied by Supabase
 * Auth — so the uuid is generated here. That is safe now that
 * `profiles_id_fkey` has been dropped and the id no longer has to exist in
 * `auth.users`.
 */
export async function createProfileForClerkUser(
  clerkUserId: string,
  opts: { firstName?: string | null; lastName?: string | null } = {}
): Promise<string | null> {
  const id = crypto.randomUUID();
  const name = [opts.firstName, opts.lastName].filter(Boolean).join(" ").trim();

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id,
      clerk_user_id: clerkUserId,
      first_name: opts.firstName ?? null,
      last_name: opts.lastName ?? null,
      // Left null deliberately: `name` is what marks onboarding complete, and a
      // new user should still be sent through onboarding.
      name: name || null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[clerk-profile] failed to create profile:", error.message);
    return null;
  }

  return data?.id ?? null;
}

/**
 * Resolve a Clerk user to a profile id, creating the profile on first sight.
 *
 * Returns null only if creation failed, which callers should treat as an error
 * rather than as "signed out" — the user *is* authenticated at that point.
 */
export async function resolveProfileId(
  clerkUserId: string,
  opts: { firstName?: string | null; lastName?: string | null } = {}
): Promise<string | null> {
  const existing = await findProfileIdByClerkId(clerkUserId);
  if (existing) return existing;
  return createProfileForClerkUser(clerkUserId, opts);
}
