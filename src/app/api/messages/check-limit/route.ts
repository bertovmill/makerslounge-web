import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MESSAGE_MONTHLY_LIMIT = 100;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from("profiles")
      .select("is_premium, messages_used, message_limit_reset_at")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Allow all users to message (premium gate removed for App Store compliance —
    // iOS apps cannot gate features behind external subscriptions without IAP)

    // Check if we need to auto-reset (safety net if webhook missed)
    let messagesUsed = profile.messages_used || 0;
    if (profile.message_limit_reset_at && new Date(profile.message_limit_reset_at) < new Date()) {
      messagesUsed = 0;
      await supabaseAdmin
        .from("profiles")
        .update({
          messages_used: 0,
          message_limit_reset_at: null,
        })
        .eq("id", userId);
    }

    if (messagesUsed >= MESSAGE_MONTHLY_LIMIT) {
      return NextResponse.json({
        allowed: false,
        reason: "limit_reached",
      });
    }

    // Increment message count
    await supabaseAdmin
      .from("profiles")
      .update({ messages_used: messagesUsed + 1 })
      .eq("id", userId);

    return NextResponse.json({ allowed: true });
  } catch (err) {
    console.error("Check limit error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
