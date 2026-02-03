import { createClient } from "@supabase/supabase-js";

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

export async function postToX(userId: string, text: string): Promise<PostToXResult> {
  if (!text || text.length === 0) {
    return { success: false, error: "Tweet text is required" };
  }

  if (text.length > 280) {
    return { success: false, error: "Tweet exceeds 280 character limit" };
  }

  // Get X connection using service role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: connection, error: connError } = await supabaseAdmin
    .from("social_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "x")
    .single();

  if (connError || !connection) {
    return { success: false, error: "X account not connected" };
  }

  let accessToken = connection.access_token;

  // Check if token is expired
  const tokenExpiry = new Date(connection.token_expires_at);
  const now = new Date();

  if (tokenExpiry <= now && connection.refresh_token) {
    const newTokens = await refreshAccessToken(connection.refresh_token);

    if (!newTokens) {
      return { success: false, error: "X session expired. Please reconnect." };
    }

    // Update stored tokens
    const newExpiry = new Date(Date.now() + newTokens.expires_in * 1000);
    await supabaseAdmin
      .from("social_connections")
      .update({
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || connection.refresh_token,
        token_expires_at: newExpiry.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    accessToken = newTokens.access_token;
  }

  // Post tweet
  const tweetResponse = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
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
    url: `https://twitter.com/${connection.platform_username}/status/${tweetData.data.id}`,
  };
}
