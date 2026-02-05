import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/youtube/callback";

interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

interface YouTubeChannel {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      customUrl?: string;
      thumbnails?: {
        default?: { url: string };
      };
    };
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_denied", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_invalid", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Get OAuth data from cookie
    const oauthDataCookie = request.cookies.get("youtube_oauth_data");
    if (!oauthDataCookie) {
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_expired", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const oauthData = JSON.parse(oauthDataCookie.value);
    const { state: storedState, userId } = oauthData;

    if (state !== storedState) {
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_invalid_state", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("YouTube token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_token_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json();

    // Get YouTube channel info
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!channelResponse.ok) {
      console.error("YouTube channel fetch failed");
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_channel_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const channelData: YouTubeChannel = await channelResponse.json();
    const channel = channelData.items?.[0];

    if (!channel) {
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_no_channel", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Store connection in Supabase using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const { error: dbError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: userId,
          platform: "youtube",
          platform_user_id: channel.id,
          platform_username: channel.snippet.customUrl || channel.snippet.title,
          platform_name: channel.snippet.title,
          platform_avatar_url: channel.snippet.thumbnails?.default?.url || null,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: tokenExpiresAt.toISOString(),
          scopes: tokens.scope.split(" "),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,platform,platform_user_id",
        }
      );

    if (dbError) {
      console.error("Failed to store YouTube connection:", dbError);
      return NextResponse.redirect(
        new URL("/broadcast?error=youtube_auth_db_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const response = NextResponse.redirect(
      new URL("/broadcast?youtube_connected=true", process.env.NEXT_PUBLIC_APP_URL!)
    );
    response.cookies.delete("youtube_oauth_data");

    return response;
  } catch (error) {
    console.error("YouTube OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/broadcast?error=youtube_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
