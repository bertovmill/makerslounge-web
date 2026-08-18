import { NextRequest, NextResponse } from "next/server";
import { getServerAppUser } from "@/lib/clerk-server";
import { createClient } from "@/lib/supabase-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { content, platform, scheduledFor, ideaId, mediaUrls } = await request.json();

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!scheduledFor) {
      return NextResponse.json(
        { error: "Scheduled time is required" },
        { status: 400 }
      );
    }

    const scheduledDate = new Date(scheduledFor);
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Use service role for insert to bypass RLS issues
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create scheduled post record
    const { data: scheduledPost, error: insertError } = await supabaseAdmin
      .from("scheduled_posts")
      .insert({
        user_id: user.id,
        content,
        platform: platform || "x",
        scheduled_for: scheduledDate.toISOString(),
        idea_id: ideaId || null,
        media_urls: mediaUrls || [],
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create scheduled post:", insertError);
      return NextResponse.json(
        { error: "Failed to create scheduled post" },
        { status: 500 }
      );
    }

    // Schedule with QStash
    if (QSTASH_TOKEN) {
      try {
        const qstashResponse = await fetch(
          `https://qstash.upstash.io/v2/publish/${APP_URL}/api/cron/post-scheduled`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${QSTASH_TOKEN}`,
              "Content-Type": "application/json",
              "Upstash-Not-Before": Math.floor(scheduledDate.getTime() / 1000).toString(),
            },
            body: JSON.stringify({
              scheduledPostId: scheduledPost.id,
            }),
          }
        );

        if (!qstashResponse.ok) {
          const errorText = await qstashResponse.text();
          console.error("QStash scheduling failed:", errorText);
          // Don't fail the request - post is saved, just won't auto-post
        } else {
          const qstashData = await qstashResponse.json();
          // Store QStash message ID for potential cancellation
          await supabaseAdmin
            .from("scheduled_posts")
            .update({ qstash_message_id: qstashData.messageId })
            .eq("id", scheduledPost.id);
        }
      } catch (qstashError) {
        console.error("QStash error:", qstashError);
        // Don't fail - post is saved
      }
    } else {
      console.warn("QSTASH_TOKEN not configured - post saved but won't auto-publish");
    }

    return NextResponse.json({
      success: true,
      scheduledPost: {
        id: scheduledPost.id,
        content: scheduledPost.content,
        platform: scheduledPost.platform,
        scheduledFor: scheduledPost.scheduled_for,
        status: scheduledPost.status,
      },
    });
  } catch (error) {
    console.error("Schedule post error:", error);
    return NextResponse.json(
      { error: "Failed to schedule post" },
      { status: 500 }
    );
  }
}

// Get user's scheduled posts
export async function GET() {
  try {
    const supabase = await createClient();
    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const { data: posts, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_for", { ascending: true });

    if (error) {
      console.error("Failed to fetch scheduled posts:", error);
      return NextResponse.json(
        { error: "Failed to fetch scheduled posts" },
        { status: 500 }
      );
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Get scheduled posts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch scheduled posts" },
      { status: 500 }
    );
  }
}

// Cancel a scheduled post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get the post to check ownership and get QStash message ID
    const { data: post, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("id", postId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }

    // Cancel QStash message if exists
    if (post.qstash_message_id && QSTASH_TOKEN) {
      try {
        await fetch(
          `https://qstash.upstash.io/v2/messages/${post.qstash_message_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${QSTASH_TOKEN}`,
            },
          }
        );
      } catch (qstashError) {
        console.error("Failed to cancel QStash message:", qstashError);
      }
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from("scheduled_posts")
      .update({ status: "cancelled" })
      .eq("id", postId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to cancel scheduled post" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel scheduled post error:", error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled post" },
      { status: 500 }
    );
  }
}
