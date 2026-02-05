import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/youtube/callback";

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export async function GET() {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json(
        { error: "YouTube OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables." },
        { status: 500 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      console.error("YouTube OAuth auth check failed:", authError?.message || "No user session");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      return NextResponse.redirect(`${appUrl}/auth?redirect=/broadcast`);
    }

    const state = generateRandomString(32);

    const oauthData = JSON.stringify({
      state,
      userId: user.id,
    });

    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
      "openid",
      "profile",
    ];

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    const response = NextResponse.redirect(authUrl.toString());

    response.cookies.set("youtube_oauth_data", oauthData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("YouTube OAuth authorize error:", error);
    return NextResponse.json(
      { error: "Failed to initiate YouTube authentication" },
      { status: 500 }
    );
  }
}
