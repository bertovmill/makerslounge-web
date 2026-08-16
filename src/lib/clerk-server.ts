import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side equivalent of `useAuth()`.
 *
 * Route handlers and server components used to call `supabase.auth.getUser()`.
 * Clerk owns the session now, but the rest of the app still keys everything on
 * the profile uuid, so this resolves one to the other.
 *
 * The mapping lookup uses the service-role key deliberately: it runs before we
 * know who the caller is, so there is no user token to authorise it with, and
 * it reads exactly one column of one row. Nothing else here bypasses RLS.
 */

let admin: SupabaseClient | null = null;

function adminClient(): SupabaseClient {
  if (!admin) {
    admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return admin;
}

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

  const { data } = await adminClient()
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  if (!data) return null;

  const user = await currentUser();
  return {
    id: data.id as string,
    clerkUserId: userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
  };
}

/** Profile uuid only, for callers that don't need the email. */
export async function getServerProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const { data } = await adminClient()
    .from("profiles")
    .select("id")
    .eq("clerk_user_id", userId)
    .maybeSingle();

  return (data?.id as string) ?? null;
}

const ADMIN_EMAIL = "bertmill19@gmail.com";

export async function isServerAdmin(): Promise<boolean> {
  const user = await currentUser();
  return user?.primaryEmailAddress?.emailAddress === ADMIN_EMAIL;
}
