import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSiteDb } from "@/db/site";
import { scheduledPosts } from "@/db/site/schema";
import { postToX } from "@/lib/post-to-x";

const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

// Verify QStash signature
async function verifyQStashSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  // Skip verification in development if keys not set
  if (!QSTASH_CURRENT_SIGNING_KEY && !QSTASH_NEXT_SIGNING_KEY) {
    console.warn("QStash signing keys not configured - skipping verification");
    return true;
  }

  const signature = request.headers.get("upstash-signature");
  if (!signature) {
    console.error("No QStash signature header");
    return false;
  }

  const url = request.url;

  // Try to verify with current key, then next key
  for (const key of [QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY]) {
    if (!key) continue;

    try {
      const encoder = new TextEncoder();
      const keyData = encoder.encode(key);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signatureData = encoder.encode(`${url}${body}`);
      const expectedSignature = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        signatureData
      );

      const expectedBase64 = btoa(
        String.fromCharCode(...new Uint8Array(expectedSignature))
      );

      if (signature === expectedBase64) {
        return true;
      }
    } catch (error) {
      console.error("Signature verification error:", error);
    }
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Verify QStash signature in production
    if (process.env.NODE_ENV === "production") {
      const isValid = await verifyQStashSignature(request, body);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const { scheduledPostId } = JSON.parse(body);

    if (!scheduledPostId) {
      return NextResponse.json(
        { error: "scheduledPostId is required" },
        { status: 400 }
      );
    }

    // No session here by design: the caller is QStash, authenticated by the
    // signature check above, acting on behalf of whoever scheduled the post. That
    // is what the service-role key was for; there is no RLS to bypass now.
    const db = getSiteDb();

    const [post] = await db
      .select()
      .from(scheduledPosts)
      .where(eq(scheduledPosts.id, scheduledPostId))
      .limit(1);

    if (!post) {
      console.error("Scheduled post not found:", scheduledPostId);
      return NextResponse.json(
        { error: "Scheduled post not found" },
        { status: 404 }
      );
    }

    // Check if already posted or cancelled
    if (post.status !== "pending") {
      return NextResponse.json({
        success: true,
        message: `Post already ${post.status}`,
      });
    }

    // Post based on platform
    let result;
    if (post.platform === "x") {
      result = await postToX(post.userId, post.content, post.mediaUrls || []);
    } else {
      return NextResponse.json(
        { error: `Platform ${post.platform} not supported yet` },
        { status: 400 }
      );
    }

    // Update the scheduled post record
    if (result.success) {
      await db
        .update(scheduledPosts)
        .set({
          status: "posted",
          postedAt: new Date().toISOString(),
          postUrl: result.url,
        })
        .where(eq(scheduledPosts.id, scheduledPostId));

      return NextResponse.json({
        success: true,
        url: result.url,
      });
    } else {
      await db
        .update(scheduledPosts)
        .set({
          status: "failed",
          errorMessage: result.error,
        })
        .where(eq(scheduledPosts.id, scheduledPostId));

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Cron post-scheduled error:", error);
    return NextResponse.json(
      { error: "Failed to process scheduled post" },
      { status: 500 }
    );
  }
}
