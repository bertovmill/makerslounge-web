import type { MeResponse } from "@/app/api/me/route";

/**
 * Bridge between Clerk identities and this app's user ids, from the client side.
 *
 * Clerk owns authentication; the database owns the data, and every foreign key
 * points at `profiles.id` — the uuid that used to come from Supabase Auth.
 * Rewriting those keys would stack a data migration on top of an auth
 * migration, so the two id spaces coexist instead: `profiles.clerk_user_id`
 * maps one to the other and the app keeps using the uuid it always has.
 *
 * The upshot is that `user.id` means exactly what it meant before the cutover,
 * so none of the ~72 call sites that read it need to change.
 *
 * The lookup itself now lives in `GET /api/me`, because the database is Neon and
 * Neon is not reachable from a browser. Identity is taken from the Clerk session
 * on the server, so there is nothing to pass in and nothing a caller could spoof.
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

/**
 * Fetch the signed-in user's profile, creating it server-side on first sight.
 *
 * Returns null when there is no session (401) or when the profile genuinely
 * could not be created (500). Callers must treat the latter as an error rather
 * than as "signed out": conflating the two is what previously rendered a
 * sign-in form to users who were already signed in.
 */
export async function fetchCurrentProfile(): Promise<MeResponse | null> {
  try {
    const res = await fetch("/api/me", {
      // The session cookie must ride along, and a stale cached profile would
      // outlive a sign-out.
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status !== 401) {
        console.error("[clerk-profile] /api/me failed:", res.status);
      }
      return null;
    }
    return (await res.json()) as MeResponse;
  } catch (err) {
    console.error("[clerk-profile] /api/me unreachable:", err);
    return null;
  }
}

/** Convenience wrapper for callers that only need the profile uuid. */
export async function resolveProfileId(): Promise<string | null> {
  const me = await fetchCurrentProfile();
  return me?.id ?? null;
}
