import { getSocialConnection, isTokenExpired, updateSocialTokens } from "@/lib/social-connection";
import { uploadMultipleMediaToX } from "./x-media-upload";

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

// Refresh access token if expired
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
} | null> {
  try {
    const response = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: X_CLIENT_ID!,
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

export interface PostToXResult {
  success: boolean;
  tweetId?: string;
  url?: string;
  error?: string;
}

export async function postToX(
  userId: string,
  text: string,
  mediaUrls?: string[]
): Promise<PostToXResult> {
  if (!text || text.length === 0) {
    return { success: false, error: "Tweet text is required" };
  }

  if (text.length > 280) {
    return { success: false, error: "Tweet exceeds 280 character limit" };
  }

  // Upload media if provided
  let mediaIds: string[] | undefined;
  if (mediaUrls && mediaUrls.length > 0) {
    const mediaResult = await uploadMultipleMediaToX(userId, mediaUrls);
    if (!mediaResult.success) {
      return { success: false, error: mediaResult.error || "Failed to upload media" };
    }
    mediaIds = mediaResult.mediaIds;
  }

  const connection = await getSocialConnection(userId, "x");
  if (!connection) {
    return { success: false, error: "X account not connected" };
  }

  let accessToken = connection.accessToken;

  if (isTokenExpired(connection) && connection.refreshToken) {
    const newTokens = await refreshAccessToken(connection.refreshToken);

    if (!newTokens) {
      return { success: false, error: "X session expired. Please reconnect." };
    }

    await updateSocialTokens(connection.id, {
      accessToken: newTokens.access_token,
      refreshToken: newTokens.refresh_token || connection.refreshToken,
      expiresInSeconds: newTokens.expires_in,
    });

    accessToken = newTokens.access_token;
  }

  // Build tweet payload
  const tweetPayload: { text: string; media?: { media_ids: string[] } } = { text };
  if (mediaIds && mediaIds.length > 0) {
    tweetPayload.media = { media_ids: mediaIds };
  }

  // Post tweet
  const tweetResponse = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tweetPayload),
  });

  if (!tweetResponse.ok) {
    const errorData = await tweetResponse.json();
    console.error("Tweet post failed:", errorData);
    return { success: false, error: errorData.detail || "Failed to post tweet" };
  }

  const tweetData = await tweetResponse.json();

  return {
    success: true,
    tweetId: tweetData.data.id,
    url: `https://twitter.com/${connection.platformUsername}/status/${tweetData.data.id}`,
  };
}
