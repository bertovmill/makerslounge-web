import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { profiles } from "@/db/site/schema";

/**
 * Resolve the signed-in Clerk user to their profile row, creating it on first
 * sight. This is the bridge between Clerk identities and the app's own ids.
 *
 * Why this is a server route and not a client-side query:
 *
 * Neon is reachable only from the server, so the browser can no longer query
 * the database directly the way it did through Supabase. That is the whole
 * shape of this migration — every read and write moves behind a route that
 * does its own authorization, because the 112 RLS policies Supabase enforced in
 * SQL have no equivalent in Neon.
 *
 * It also fixes the bug that motivated the cutover. Previously the browser
 * asked Supabase for the profile with a Clerk JWT attached, and Supabase had no
 * Clerk key registered, so every such request 401'd with PGRST301. Profile
 * resolution returned null, `/auth` rendered its sign-in form to someone who
 * was already signed in, and nothing ever redirected to /home.
 *
 * The client sends nothing: identity comes from the Clerk session on the server
 * and the display name from Clerk's own user record, so a caller cannot claim
 * to be another user or seed a profile with a name that isn't theirs.
 */

export interface MeResponse {
  /** Profile uuid — the id every foreign key points at. */
  id: string;
  clerkUserId: string;
  email: string | null;
  fullName: string | null;
  imageUrl: string | null;
  /**
   * Whether `profiles.name` is set. That column is what marks onboarding as
   * done — there is no `onboarding_completed` column in production. Returned
   * here so the client needs one round trip rather than a follow-up query.
   */
  onboardingComplete: boolean;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const db = getSiteDb();

  const [existing] = await db
    .select({ id: profiles.id, name: profiles.name })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const imageUrl = user?.imageUrl ?? null;
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || null;

  if (existing) {
    return NextResponse.json({
      id: existing.id,
      clerkUserId: userId,
      email,
      fullName,
      imageUrl,
      onboardingComplete: !!existing.name?.trim(),
    } satisfies MeResponse);
  }

  // First sight of this Clerk user. `profiles.id` carries no database default —
  // it used to be handed over by Supabase Auth — so generate it here.
  await db
    .insert(profiles)
    .values({
      id: crypto.randomUUID(),
      clerkUserId: userId,
      firstName: user?.firstName ?? null,
      lastName: user?.lastName ?? null,
      // `name` is deliberately left null: it is what marks onboarding as done,
      // and a brand-new user should still be offered the onboarding form.
      name: null,
    })
    // Two tabs signing in at once would both miss the select above. The partial
    // unique index on clerk_user_id makes the loser a no-op instead of a 500,
    // and the re-read below returns whichever row won.
    .onConflictDoNothing();

  const [created] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!created) {
    // Authenticated but unusable. Report it rather than returning a shape that
    // reads as "signed out" — that conflation is what made the original bug so
    // hard to see.
    console.error("[api/me] could not create or find a profile for", userId);
    return NextResponse.json({ error: "profile_unavailable" }, { status: 500 });
  }

  return NextResponse.json({
    id: created.id,
    clerkUserId: userId,
    email,
    fullName,
    imageUrl,
    // Freshly created rows always have a null `name`, so onboarding is pending.
    onboardingComplete: false,
  } satisfies MeResponse);
}
