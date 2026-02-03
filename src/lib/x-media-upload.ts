import { createClient } from "@supabase/supabase-js";

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

interface MediaUploadResult {
  success: boolean;
  mediaId?: string;
  error?: string;
}

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
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

// Get valid access token for a user
async function getValidAccessToken(userId: string): Promise<{ accessToken: string; error?: string } | { accessToken?: string; error: string }> {
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
    return { error: "X account not connected" };
  }

  let accessToken = connection.access_token;

  // Check if token is expired
  const tokenExpiry = new Date(connection.token_expires_at);
  const now = new Date();

  if (tokenExpiry <= now && connection.refresh_token) {
    const newTokens = await refreshAccessToken(connection.refresh_token);

    if (!newTokens) {
      return { error: "X session expired. Please reconnect." };
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

  return { accessToken };
}

// Detect media type from URL or content type
function getMediaType(url: string, contentType?: string): "image" | "video" | "unknown" {
  const lowerUrl = url.toLowerCase();
  const lowerContentType = contentType?.toLowerCase() || "";

  if (
    lowerContentType.startsWith("image/") ||
    lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)
  ) {
    return "image";
  }

  if (
    lowerContentType.startsWith("video/") ||
    lowerUrl.match(/\.(mp4|mov|avi|webm)(\?|$)/i)
  ) {
    return "video";
  }

  return "unknown";
}

// Upload image to X (simple upload for images < 5MB)
async function uploadImage(
  accessToken: string,
  imageData: Buffer,
  mimeType: string
): Promise<MediaUploadResult> {
  try {
    const base64Data = imageData.toString("base64");

    const response = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        media_data: base64Data,
        media_category: "tweet_image",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Image upload failed:", errorData);
      return { success: false, error: errorData.errors?.[0]?.message || "Failed to upload image" };
    }

    const data = await response.json();
    return { success: true, mediaId: data.media_id_string };
  } catch (error) {
    console.error("Image upload error:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

// Upload video to X (chunked upload)
async function uploadVideo(
  accessToken: string,
  videoData: Buffer,
  mimeType: string
): Promise<MediaUploadResult> {
  try {
    // Step 1: INIT
    const initResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        command: "INIT",
        total_bytes: videoData.length.toString(),
        media_type: mimeType,
        media_category: "tweet_video",
      }),
    });

    if (!initResponse.ok) {
      const errorData = await initResponse.json();
      console.error("Video INIT failed:", errorData);
      return { success: false, error: "Failed to initialize video upload" };
    }

    const initData = await initResponse.json();
    const mediaId = initData.media_id_string;

    // Step 2: APPEND (upload in chunks of 5MB)
    const chunkSize = 5 * 1024 * 1024; // 5MB
    let segmentIndex = 0;

    for (let i = 0; i < videoData.length; i += chunkSize) {
      const chunk = videoData.slice(i, Math.min(i + chunkSize, videoData.length));
      const base64Chunk = chunk.toString("base64");

      const appendResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          command: "APPEND",
          media_id: mediaId,
          media_data: base64Chunk,
          segment_index: segmentIndex.toString(),
        }),
      });

      if (!appendResponse.ok) {
        console.error("Video APPEND failed at segment", segmentIndex);
        return { success: false, error: "Failed to upload video chunk" };
      }

      segmentIndex++;
    }

    // Step 3: FINALIZE
    const finalizeResponse = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        command: "FINALIZE",
        media_id: mediaId,
      }),
    });

    if (!finalizeResponse.ok) {
      const errorData = await finalizeResponse.json();
      console.error("Video FINALIZE failed:", errorData);
      return { success: false, error: "Failed to finalize video upload" };
    }

    const finalizeData = await finalizeResponse.json();

    // Step 4: Check processing status if needed
    if (finalizeData.processing_info) {
      const result = await waitForProcessing(accessToken, mediaId);
      if (!result.success) {
        return result;
      }
    }

    return { success: true, mediaId };
  } catch (error) {
    console.error("Video upload error:", error);
    return { success: false, error: "Failed to upload video" };
  }
}

// Wait for video processing to complete
async function waitForProcessing(
  accessToken: string,
  mediaId: string,
  maxAttempts = 30
): Promise<MediaUploadResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusResponse = await fetch(
      `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!statusResponse.ok) {
      return { success: false, error: "Failed to check processing status" };
    }

    const statusData = await statusResponse.json();
    const processingInfo = statusData.processing_info;

    if (!processingInfo) {
      // Processing complete
      return { success: true, mediaId };
    }

    if (processingInfo.state === "succeeded") {
      return { success: true, mediaId };
    }

    if (processingInfo.state === "failed") {
      return { success: false, error: processingInfo.error?.message || "Video processing failed" };
    }

    // Wait before checking again
    const waitSeconds = processingInfo.check_after_secs || 5;
    await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
  }

  return { success: false, error: "Video processing timed out" };
}

// Main function to upload media from URL
export async function uploadMediaToX(
  userId: string,
  mediaUrl: string
): Promise<MediaUploadResult> {
  // Get valid access token
  const tokenResult = await getValidAccessToken(userId);
  if (tokenResult.error || !tokenResult.accessToken) {
    return { success: false, error: tokenResult.error || "Failed to get access token" };
  }

  const accessToken = tokenResult.accessToken;

  try {
    // Fetch the media
    const mediaResponse = await fetch(mediaUrl);
    if (!mediaResponse.ok) {
      return { success: false, error: "Failed to fetch media from URL" };
    }

    const contentType = mediaResponse.headers.get("content-type") || "";
    const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());

    // Check file size (X limits: 5MB for images, 512MB for videos)
    const mediaType = getMediaType(mediaUrl, contentType);

    if (mediaType === "image") {
      if (mediaBuffer.length > 5 * 1024 * 1024) {
        return { success: false, error: "Image must be less than 5MB" };
      }
      return await uploadImage(accessToken, mediaBuffer, contentType);
    } else if (mediaType === "video") {
      if (mediaBuffer.length > 512 * 1024 * 1024) {
        return { success: false, error: "Video must be less than 512MB" };
      }
      return await uploadVideo(accessToken, mediaBuffer, contentType);
    } else {
      return { success: false, error: "Unsupported media type" };
    }
  } catch (error) {
    console.error("Media upload error:", error);
    return { success: false, error: "Failed to upload media" };
  }
}

// Upload multiple media files and return their IDs
export async function uploadMultipleMediaToX(
  userId: string,
  mediaUrls: string[]
): Promise<{ success: boolean; mediaIds?: string[]; error?: string }> {
  if (mediaUrls.length === 0) {
    return { success: true, mediaIds: [] };
  }

  // X allows max 4 images or 1 video per tweet
  if (mediaUrls.length > 4) {
    return { success: false, error: "Maximum 4 media items allowed per tweet" };
  }

  const mediaIds: string[] = [];

  for (const url of mediaUrls) {
    const result = await uploadMediaToX(userId, url);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    if (result.mediaId) {
      mediaIds.push(result.mediaId);
    }
  }

  return { success: true, mediaIds };
}
