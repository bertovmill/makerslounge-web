import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase-server";
import { postToLinkedIn } from "@/lib/post-to-linkedin";

export async function POST(request: NextRequest) {
  try {
    const { text, imageUrl } = await request.json();

    if (!text || text.length === 0) {
      return NextResponse.json(
        { error: "Post text is required" },
        { status: 400 }
      );
    }

    if (text.length > 3000) {
      return NextResponse.json(
        { error: "Post exceeds 3,000 character limit" },
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

    const result = await postToLinkedIn(user.id, text, imageUrl);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to post to LinkedIn" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      postId: result.postId,
      url: result.url,
    });
  } catch (error) {
    console.error("LinkedIn post error:", error);
    return NextResponse.json(
      { error: "Failed to post to LinkedIn" },
      { status: 500 }
    );
  }
}
