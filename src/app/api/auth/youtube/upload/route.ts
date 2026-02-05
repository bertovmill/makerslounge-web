import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getValidYouTubeAccessToken, createResumableUploadSession } from "@/lib/youtube-upload";

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, tags, privacy } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Get valid access token (refreshes if needed)
    const tokenResult = await getValidYouTubeAccessToken(user.id);
    if (tokenResult.error || !tokenResult.accessToken) {
      return NextResponse.json(
        { error: tokenResult.error || "Failed to get YouTube access token" },
        { status: 401 }
      );
    }

    // Create resumable upload session
    const uploadResult = await createResumableUploadSession(tokenResult.accessToken, {
      title,
      description: description || "",
      tags: Array.isArray(tags) ? tags : [],
      privacy: privacy || "private",
    });

    if (uploadResult.error || !uploadResult.uploadUrl) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to create upload session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ uploadUrl: uploadResult.uploadUrl });
  } catch (error) {
    console.error("YouTube upload route error:", error);
    return NextResponse.json(
      { error: "Failed to initialize YouTube upload" },
      { status: 500 }
    );
  }
}
