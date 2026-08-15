"use server";

import { cookies } from "next/headers";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { agentMemories, demoSlots, learningGoals, questions } from "@/db/schema";

// This app runs on eve.makerslounge.ca against a Clerk *development* instance,
// so Clerk's own client-side `signOut()` has to talk to a different origin
// (`*.clerk.accounts.dev`) to clear the session — which browsers that block
// third-party cookies quietly refuse. Doing it on the server instead means the
// session is revoked and the cookies are dropped by our own `Set-Cookie`
// headers, on our own domain, no cross-site request involved.
const CLERK_COOKIE_PREFIXES = [
  "__session",
  "__client_uat",
  "__clerk_db_jwt",
  "__clerk_handshake",
  "__refresh",
];

async function clearClerkCookies() {
  const jar = await cookies();
  for (const cookie of jar.getAll()) {
    if (CLERK_COOKIE_PREFIXES.some((prefix) => cookie.name.startsWith(prefix))) {
      jar.delete(cookie.name);
    }
  }
}

/**
 * Revoke the current Clerk session and clear its cookies. The caller is
 * expected to follow up with a full page load (not a client-side route change)
 * so Clerk's in-memory client state is rebuilt from the now-empty cookie jar.
 */
export async function signOutAction() {
  const { sessionId } = await auth();

  if (sessionId) {
    try {
      const clerk = await clerkClient();
      await clerk.sessions.revokeSession(sessionId);
    } catch {
      // Already revoked or expired — the cookie clear below is what matters.
    }
  }

  await clearClerkCookies();
}

/**
 * Permanently delete the signed-in attendee: their workshop data first, then
 * the Clerk user itself, then the session cookies.
 */
export async function deleteAccountAction() {
  const { userId } = await auth();
  if (!userId) return { ok: false as const, error: "You're not signed in." };

  try {
    const db = getDb();
    await db.delete(demoSlots).where(eq(demoSlots.userId, userId));
    await db.delete(questions).where(eq(questions.userId, userId));
    await db.delete(agentMemories).where(eq(agentMemories.userId, userId));
    await db.delete(learningGoals).where(eq(learningGoals.userId, userId));

    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId);
  } catch (error) {
    console.error("Failed to delete account", error);
    return { ok: false as const, error: "Couldn't delete your account. Try again." };
  }

  await clearClerkCookies();
  return { ok: true as const };
}
