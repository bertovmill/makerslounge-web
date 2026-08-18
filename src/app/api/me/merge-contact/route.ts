import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { communityContacts, profiles } from "@/db/site/schema";

/**
 * Fold a pre-existing community contact into the signed-in user's profile.
 *
 * People often appear in `community_contacts` (imported from events, forms and
 * the like) before they ever create an account. When they do sign up, this
 * matches on verified email and copies across anything their profile is still
 * missing, then marks the contact as claimed.
 *
 * Called once after sign-in rather than from `/api/me`, which runs on every page
 * load — this is a one-time enrichment and does not belong in that hot path.
 *
 * Idempotent: the contact is only considered while `matched_profile_id IS NULL`,
 * so a second call does nothing.
 *
 * The email comes from the Clerk session server-side, never from the request
 * body. Accepting a caller-supplied address here would let anyone claim another
 * person's contact record — including its skills, bio and social links — just by
 * naming their email. Under Supabase this ran in the browser, where the RLS
 * policy was the only thing standing in the way.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ merged: false, reason: "no_email" });
  }

  const db = getSiteDb();

  const [profile] = await db
    .select({
      id: profiles.id,
      skills: profiles.skills,
      bio: profiles.bio,
      linkedin: profiles.linkedin,
      twitter: profiles.twitter,
      instagram: profiles.instagram,
      website: profiles.website,
    })
    .from(profiles)
    .where(eq(profiles.clerkUserId, userId))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ error: "no_profile" }, { status: 404 });
  }

  // Compare case-insensitively: addresses were entered by hand in a lot of these
  // rows, so casing is not consistent.
  const [contact] = await db
    .select({
      id: communityContacts.id,
      skills: communityContacts.skills,
      summary: communityContacts.summary,
      linkedin: communityContacts.linkedin,
      twitter: communityContacts.twitter,
      instagram: communityContacts.instagram,
      website: communityContacts.website,
    })
    .from(communityContacts)
    .where(
      and(
        eq(sql`lower(${communityContacts.email})`, email),
        isNull(communityContacts.matchedProfileId),
      ),
    )
    .limit(1);

  if (!contact) {
    return NextResponse.json({ merged: false, reason: "no_contact" });
  }

  // Only fill gaps — anything the user has already written about themselves wins
  // over imported data.
  const updates: Partial<typeof profiles.$inferInsert> = {};
  if (!profile.skills?.length && contact.skills?.length) updates.skills = contact.skills;
  if (!profile.bio && contact.summary) updates.bio = contact.summary;
  if (!profile.linkedin && contact.linkedin) updates.linkedin = contact.linkedin;
  if (!profile.twitter && contact.twitter) updates.twitter = contact.twitter;
  if (!profile.instagram && contact.instagram) updates.instagram = contact.instagram;
  if (!profile.website && contact.website) updates.website = contact.website;

  if (Object.keys(updates).length > 0) {
    await db.update(profiles).set(updates).where(eq(profiles.id, profile.id));
  }

  await db
    .update(communityContacts)
    .set({ matchedProfileId: profile.id, matchedAt: new Date().toISOString() })
    .where(
      // Re-check the null guard so two concurrent calls cannot both claim it.
      and(eq(communityContacts.id, contact.id), isNull(communityContacts.matchedProfileId)),
    );

  return NextResponse.json({ merged: true, fields: Object.keys(updates) });
}
