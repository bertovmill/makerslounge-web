import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/linkedin/callback";

interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope: string;
}

interface LinkedInUserInfo {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_denied", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_invalid", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Get OAuth data from cookie
    const oauthDataCookie = request.cookies.get("linkedin_oauth_data");
    if (!oauthDataCookie) {
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_expired", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const oauthData = JSON.parse(oauthDataCookie.value);
    const { state: storedState, userId } = oauthData;

    if (state !== storedState) {
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_invalid_state", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: LINKEDIN_CLIENT_ID!,
        client_secret: LINKEDIN_CLIENT_SECRET!,
        redirect_uri: LINKEDIN_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("LinkedIn token exchange failed:", errorText);
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_token_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const tokens: LinkedInTokenResponse = await tokenResponse.json();

    // Get user info from LinkedIn (OpenID Connect userinfo endpoint)
    const userResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userResponse.ok) {
      console.error("LinkedIn user fetch failed");
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_user_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const userData: LinkedInUserInfo = await userResponse.json();

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
          platform: "linkedin",
          platform_user_id: userData.sub,
          platform_username: userData.name,
          platform_name: userData.name,
          platform_avatar_url: userData.picture || null,
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
      console.error("Failed to store LinkedIn connection:", dbError);
      return NextResponse.redirect(
        new URL("/broadcast?error=linkedin_auth_db_failed", process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const response = NextResponse.redirect(
      new URL("/broadcast?linkedin_connected=true", process.env.NEXT_PUBLIC_APP_URL!)
    );
    response.cookies.delete("linkedin_oauth_data");

    return response;
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/broadcast?error=linkedin_auth_failed", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
