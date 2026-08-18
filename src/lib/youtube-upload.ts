import { getSocialConnection, isTokenExpired, updateSocialTokens } from "@/lib/social-connection";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Refresh Google access token using refresh token
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
} | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google token refresh failed:", errorText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Google token refresh error:", error);
    return null;
  }
}

// Get a valid YouTube access token, refreshing if expired
export async function getValidYouTubeAccessToken(userId: string): Promise<{
  accessToken: string;
  error?: string;
} | {
  accessToken?: string;
  error: string;
}> {
  const connection = await getSocialConnection(userId, "youtube");
  if (!connection) {
    return { error: "YouTube account not connected" };
  }

  let accessToken = connection.accessToken;

  if (isTokenExpired(connection) && connection.refreshToken) {
    const newTokens = await refreshGoogleAccessToken(connection.refreshToken);

    if (!newTokens) {
      return { error: "YouTube session expired. Please reconnect." };
    }

    // Google doesn't rotate refresh tokens by default, so only the access token
    // and its expiry are written back.
    await updateSocialTokens(connection.id, {
      accessToken: newTokens.access_token,
      expiresInSeconds: newTokens.expires_in,
    });

    accessToken = newTokens.access_token;
  }

  return { accessToken };
}

// Create a resumable upload session on YouTube and return the upload URI
export async function createResumableUploadSession(
  accessToken: string,
  metadata: {
    title: string;
    description: string;
    tags: string[];
    privacy: "private" | "unlisted" | "public";
  }
): Promise<{ uploadUrl: string; error?: string } | { uploadUrl?: string; error: string }> {
  try {
    const body = {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags.length > 0 ? metadata.tags : undefined,
      },
      status: {
        privacyStatus: metadata.privacy,
        selfDeclaredMadeForKids: false,
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("YouTube resumable upload init failed:", errorText);
      return { error: `Failed to initialize YouTube upload: ${response.status}` };
    }

    const uploadUrl = response.headers.get("Location");
    if (!uploadUrl) {
      return { error: "YouTube did not return an upload URL" };
    }

    return { uploadUrl };
  } catch (error) {
    console.error("YouTube resumable upload error:", error);
    return { error: "Failed to create YouTube upload session" };
  }
}
