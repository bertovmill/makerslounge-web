import { and, eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { socialConnections } from "@/db/site/schema";

/**
 * Stored OAuth credentials for a user's connected social account.
 *
 * `post-to-x`, `post-to-linkedin`, `x-media-upload` and `youtube-upload` each had
 * their own copy of the same twenty lines: build a service-role Supabase client,
 * select the row for (user, platform), compare `token_expires_at` to now, refresh
 * if stale, write the new tokens back. Four copies meant four places for the
 * refresh-and-persist logic to drift, so it lives here once.
 *
 * These run in cron jobs and background posts where there is no session to
 * authorise with, which is what the service-role key was for. There is no RLS to
 * bypass now; the caller is trusted server code and passes the profile id it
 * already resolved.
 */

export interface SocialConnection {
  id: string;
  userId: string;
  platform: string;
  platformUserId: string;
  platformUsername: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: string | null;
}

export async function getSocialConnection(
  userId: string,
  platform: string,
): Promise<SocialConnection | null> {
  const [row] = await getSiteDb()
    .select({
      id: socialConnections.id,
      userId: socialConnections.userId,
      platform: socialConnections.platform,
      platformUserId: socialConnections.platformUserId,
      platformUsername: socialConnections.platformUsername,
      accessToken: socialConnections.accessToken,
      refreshToken: socialConnections.refreshToken,
      tokenExpiresAt: socialConnections.tokenExpiresAt,
    })
    .from(socialConnections)
    .where(and(eq(socialConnections.userId, userId), eq(socialConnections.platform, platform)))
    .limit(1);

  return row ?? null;
}

/** Persist refreshed tokens. */
export async function updateSocialTokens(
  connectionId: string,
  tokens: { accessToken: string; refreshToken?: string | null; expiresInSeconds?: number },
): Promise<void> {
  const now = new Date();
  await getSiteDb()
    .update(socialConnections)
    .set({
      accessToken: tokens.accessToken,
      ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
      ...(tokens.expiresInSeconds
        ? {
            tokenExpiresAt: new Date(
              now.getTime() + tokens.expiresInSeconds * 1000,
            ).toISOString(),
          }
        : {}),
      updatedAt: now.toISOString(),
    })
    .where(eq(socialConnections.id, connectionId));
}

/**
 * Whether the stored access token has expired.
 *
 * A connection with no `token_expires_at` is treated as NOT expired: the column is
 * nullable and some providers issue tokens that don't expire, so defaulting to
 * "expired" would force a pointless refresh (and fail outright for a connection
 * with no refresh token). The original code did `new Date(null)` here, which is
 * an Invalid Date, and `invalidDate <= now` is false — so this preserves that
 * behaviour, deliberately rather than by accident.
 */
export function isTokenExpired(connection: SocialConnection): boolean {
  if (!connection.tokenExpiresAt) return false;
  return new Date(connection.tokenExpiresAt) <= new Date();
}
