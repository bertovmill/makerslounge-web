import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_CLIENT_SECRET = process.env.X_CLIENT_SECRET;
const X_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/x/callback";

interface XTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface XUserResponse {
  data: {
    id: string;
    username: string;
    name: string;
    profile_image_url?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denied access
    if (error) {
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_denied", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_invalid", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Get OAuth data from cookie
    const oauthDataCookie = request.cookies.get("x_oauth_data");
    if (!oauthDataCookie) {
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_expired", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const oauthData = JSON.parse(oauthDataCookie.value);
    const { codeVerifier, state: storedState, userId } = oauthData;

    // Verify state matches
    if (state !== storedState) {
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_invalid_state", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: "authorization_code",
        client_id: X_CLIENT_ID!,
        redirect_uri: X_REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("X token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_token_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const tokens: XTokenResponse = await tokenResponse.json();

    // Get user info from X
    const userResponse = await fetch("https://api.twitter.com/2/users/me?user.fields=profile_image_url", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("X user fetch failed");
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_user_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const userData: XUserResponse = await userResponse.json();

    // Store connection in Supabase using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert connection (update if exists, insert if not)
    const { error: dbError } = await supabase
      .from("social_connections")
      .upsert(
        {
          user_id: userId,
          platform: "x",
          platform_user_id: userData.data.id,
          platform_username: userData.data.username,
          platform_name: userData.data.name,
          platform_avatar_url: userData.data.profile_image_url,
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
      console.error("Failed to store X connection:", dbError);
      return NextResponse.redirect(
        new URL("/broadcast?error=x_auth_db_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Clear OAuth cookie and redirect to success
    const response = NextResponse.redirect(
      new URL("/broadcast?x_connected=true", process.env.NEXT_PUBLIC_APP_URL!)
    );
    response.cookies.delete("x_oauth_data");

    return response;
  } catch (error) {
    console.error("X OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/broadcast?error=x_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
