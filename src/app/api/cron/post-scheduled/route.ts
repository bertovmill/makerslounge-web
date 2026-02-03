import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
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

    // Use service role to access scheduled post
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the scheduled post
    const { data: post, error: fetchError } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("id", scheduledPostId)
      .single();

    if (fetchError || !post) {
      console.error("Scheduled post not found:", fetchError);
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
      result = await postToX(post.user_id, post.content, post.media_urls || []);
    } else {
      return NextResponse.json(
        { error: `Platform ${post.platform} not supported yet` },
        { status: 400 }
      );
    }

    // Update the scheduled post record
    if (result.success) {
      await supabaseAdmin
        .from("scheduled_posts")
        .update({
          status: "posted",
          posted_at: new Date().toISOString(),
          post_url: result.url,
        })
        .eq("id", scheduledPostId);

      return NextResponse.json({
        success: true,
        url: result.url,
      });
    } else {
      await supabaseAdmin
        .from("scheduled_posts")
        .update({
          status: "failed",
          error_message: result.error,
        })
        .eq("id", scheduledPostId);

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
