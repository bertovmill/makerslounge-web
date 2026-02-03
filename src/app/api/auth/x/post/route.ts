import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { postToX } from "@/lib/post-to-x";

export async function POST(request: NextRequest) {
  try {
    const { text, mediaUrls } = await request.json();

    if (!text || text.length === 0) {
      return NextResponse.json(
        { error: "Tweet text is required" },
        { status: 400 }
      );
    }

    if (text.length > 280) {
      return NextResponse.json(
        { error: "Tweet exceeds 280 character limit" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Post tweet with optional media
    const result = await postToX(user.id, text, mediaUrls);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post tweet" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      tweet: { id: result.tweetId },
      url: result.url,
    });
  } catch (error) {
    console.error("X post error:", error);
    return NextResponse.json(
      { error: "Failed to post to X" },
      { status: 500 }
    );
  }
}
