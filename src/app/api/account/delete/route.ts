import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import {
  applications,
  communityContacts,
  events,
  matcherEvents,
  podcasts,
  profileEventNotes,
  profiles,
} from "@/db/site/schema";
import { handleApiError } from "@/lib/api/respond";

/**
 * Delete the signed-in user's account and their data.
 *
 * SECURITY: this route used to read the target `userId` from the request body
 * and delete it with the Supabase service-role key, with no authentication of
 * any kind. Profile uuids are public — they appear in `/profile/[id]` links and
 * in the `/people` listing — so anyone could delete any account by posting one.
 * The identity now comes from the Clerk session and the body is ignored.
 *
 * Deleting a profile row is most of the work: 25 of the 32 foreign keys pointing
 * at `profiles` are ON DELETE CASCADE, so projects, likes, messages,
 * conversations, connections, comments and the rest go with it. Six are NO
 * ACTION and would abort the delete, so they are cleared first:
 *
 *   community_contacts.matched_profile_id  -> null   (the contact predates the
 *                                                     account and outlives it)
 *   applications.reviewed_by               -> null   (an admin's review record)
 *   events.created_by                      -> null   (content outlives the author)
 *   podcasts.created_by                    -> null
 *   matcher_events.user_id                 -> deleted (the user's own activity)
 *   profile_event_notes.created_by         -> deleted (NOT NULL, so it cannot be
 *                                                      nulled like the others)
 *
 * `feedback.user_id` is ON DELETE SET NULL and needs nothing.
 *
 * Ordered inside `db.batch()`, which Neon runs as a single transaction, so a
 * failure part-way cannot leave an account half-deleted.
 */
export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const db = getSiteDb();

    const [profile] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.clerkUserId, clerkUserId))
      .limit(1);

    // No profile row: nothing to clean up in the database, but the Clerk user
    // still needs to go, so fall through rather than erroring.
    if (profile) {
      const id = profile.id;
      await db.batch([
        db
          .update(communityContacts)
          .set({ matchedProfileId: null, matchedAt: null })
          .where(eq(communityContacts.matchedProfileId, id)),
        db.update(applications).set({ reviewedBy: null }).where(eq(applications.reviewedBy, id)),
        db.update(events).set({ createdBy: null }).where(eq(events.createdBy, id)),
        db.update(podcasts).set({ createdBy: null }).where(eq(podcasts.createdBy, id)),
        db.delete(matcherEvents).where(eq(matcherEvents.userId, id)),
        db.delete(profileEventNotes).where(eq(profileEventNotes.createdBy, id)),
        db.delete(profiles).where(eq(profiles.id, id)),
      ]);
    }

    // Last, and outside the transaction: once the Clerk user is gone the session
    // is unusable, so doing this first would strand the rows above with no way
    // for the user to retry.
    const clerk = await clerkClient();
    await clerk.users.deleteUser(clerkUserId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleApiError(err, "api/account/delete");
  }
}
