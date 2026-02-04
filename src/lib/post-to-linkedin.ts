import { createClient } from "@supabase/supabase-js";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in: number;
} | null> {
  try {
    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!,
      }),
    });

    if (!response.ok) {
      console.error("LinkedIn token refresh failed");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("LinkedIn token refresh error:", error);
    return null;
  }
}

export interface PostToLinkedInResult {
  success: boolean;
  postId?: string;
  url?: string;
  error?: string;
}

async function uploadImageToLinkedIn(
  accessToken: string,
  personUrn: string,
  imageUrl: string
): Promise<string | null> {
  try {
    // Step 1: Initialize upload
    const initResponse = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202401",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: personUrn,
        },
      }),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("LinkedIn image upload init failed:", errorText);
      return null;
    }

    const initData = await initResponse.json();
    const uploadUrl = initData.value.uploadUrl;
    const imageUrn = initData.value.image;

    // Step 2: Download the image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      console.error("Failed to download image for LinkedIn upload");
      return null;
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Step 3: Upload the image binary
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream",
      },
      body: imageBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("LinkedIn image binary upload failed:", errorText);
      return null;
    }

    return imageUrn;
  } catch (error) {
    console.error("LinkedIn image upload error:", error);
    return null;
  }
}

export async function postToLinkedIn(
  userId: string,
  text: string,
  imageUrl?: string
): Promise<PostToLinkedInResult> {
  if (!text || text.length === 0) {
    return { success: false, error: "Post text is required" };
  }

  if (text.length > 3000) {
    return { success: false, error: "Post exceeds 3,000 character limit" };
  }

  // Get LinkedIn connection using service role
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: connection, error: connError } = await supabaseAdmin
    .from("social_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("platform", "linkedin")
    .single();

  if (connError || !connection) {
    return { success: false, error: "LinkedIn account not connected" };
  }

  let accessToken = connection.access_token;

  // Check if token is expired
  const tokenExpiry = new Date(connection.token_expires_at);
  const now = new Date();

  if (tokenExpiry <= now && connection.refresh_token) {
    const newTokens = await refreshAccessToken(connection.refresh_token);

    if (!newTokens) {
      return { success: false, error: "LinkedIn session expired. Please reconnect." };
    }

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

  const personUrn = `urn:li:person:${connection.platform_user_id}`;

  // Upload image if provided
  let imageUrn: string | null = null;
  if (imageUrl) {
    imageUrn = await uploadImageToLinkedIn(accessToken, personUrn, imageUrl);
  }

  // Build post payload
  const postPayload: Record<string, unknown> = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    visibility: "PUBLIC",
    commentary: text,
    distribution: {
      feedDistribution: "MAIN_FEED",
    },
  };

  if (imageUrn) {
    postPayload.content = {
      media: {
        id: imageUrn,
      },
    };
  }

  // Create post
  const postResponse = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202401",
    },
    body: JSON.stringify(postPayload),
  });

  if (!postResponse.ok) {
    const errorData = await postResponse.text();
    console.error("LinkedIn post failed:", errorData);
    return { success: false, error: "Failed to post to LinkedIn" };
  }

  // LinkedIn returns the post ID in the x-restli-id header
  const postId = postResponse.headers.get("x-restli-id");

  return {
    success: true,
    postId: postId || undefined,
    url: `https://www.linkedin.com/feed/update/${postId}`,
  };
}
