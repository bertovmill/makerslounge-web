import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;

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
      console.error("Token refresh failed");
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Token refresh error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          cookie: cookieStore.toString(),
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    // Get X connection using service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: connection, error: connError } = await supabaseAdmin
      .from("social_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "x")
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: "X account not connected. Please connect your X account first." },
        { status: 400 }
      );
    }

    let accessToken = connection.access_token;

    // Check if token is expired
    const tokenExpiry = new Date(connection.token_expires_at);
    const now = new Date();

    if (tokenExpiry <= now && connection.refresh_token) {
      // Token expired, try to refresh
      const newTokens = await refreshAccessToken(connection.refresh_token);

      if (!newTokens) {
        // Refresh failed, need to re-authenticate
        return NextResponse.json(
          { error: "X session expired. Please reconnect your X account." },
          { status: 401 }
        );
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

    // Post tweet
    const tweetResponse = await fetch("https://api.twitter.com/2/tweets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!tweetResponse.ok) {
      const errorData = await tweetResponse.json();
      console.error("Tweet post failed:", errorData);

      if (tweetResponse.status === 401) {
        return NextResponse.json(
          { error: "X session expired. Please reconnect your X account." },
          { status: 401 }
        );
      }

      return NextResponse.json(
        { error: errorData.detail || "Failed to post tweet" },
        { status: tweetResponse.status }
      );
    }

    const tweetData = await tweetResponse.json();

    return NextResponse.json({
      success: true,
      tweet: tweetData.data,
      url: `https://twitter.com/${connection.platform_username}/status/${tweetData.data.id}`,
    });
  } catch (error) {
    console.error("X post error:", error);
    return NextResponse.json(
      { error: "Failed to post to X" },
      { status: 500 }
    );
  }
}
