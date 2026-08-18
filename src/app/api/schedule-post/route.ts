import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { getServerAppUser } from "@/lib/clerk-server";
import { getSiteDb } from "@/db/site";
import { scheduledPosts } from "@/db/site/schema";

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
    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const db = getSiteDb();

    // `user_id` comes from the session. The old code reached for the service-role
    // key here "to bypass RLS issues", which meant the insert trusted whatever it
    // was given; there is no RLS to bypass now and no reason to.
    const [scheduledPost] = await db
      .insert(scheduledPosts)
      .values({
        userId: user.id,
        content,
        platform: platform || "x",
        scheduledFor: scheduledDate.toISOString(),
        ideaId: ideaId || null,
        mediaUrls: mediaUrls || [],
        status: "pending",
      })
      .returning();

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
          await db
            .update(scheduledPosts)
            .set({ qstashMessageId: qstashData.messageId })
            .where(eq(scheduledPosts.id, scheduledPost.id));
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
        scheduledFor: scheduledPost.scheduledFor,
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
    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const posts = await getSiteDb()
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.userId, user.id))
      .orderBy(asc(scheduledPosts.scheduledFor));

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

    const user = await getServerAppUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const db = getSiteDb();

    // Scoped to the owner, so another member's post simply isn't found.
    const [post] = await db
      .select()
      .from(scheduledPosts)
      .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, user.id)))
      .limit(1);

    if (!post) {
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }

    // Cancel QStash message if exists
    if (post.qstashMessageId && QSTASH_TOKEN) {
      try {
        await fetch(
          `https://qstash.upstash.io/v2/messages/${post.qstashMessageId}`,
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

    // Ownership re-checked in the WHERE rather than relying on the select above.
    await db
      .update(scheduledPosts)
      .set({ status: "cancelled" })
      .where(and(eq(scheduledPosts.id, postId), eq(scheduledPosts.userId, user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel scheduled post error:", error);
    return NextResponse.json(
      { error: "Failed to cancel scheduled post" },
      { status: 500 }
    );
  }
}
