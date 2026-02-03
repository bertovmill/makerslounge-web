import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

// X OAuth 2.0 configuration
const X_CLIENT_ID = process.env.X_CLIENT_ID;
const X_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL + "/api/auth/x/callback";

// Generate a random string for PKCE and state
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

// Generate code verifier and challenge for PKCE
async function generatePKCE() {
  const codeVerifier = generateRandomString(64);

  // Create code challenge (SHA-256 hash of verifier, base64url encoded)
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  const codeChallenge = base64
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  return { codeVerifier, codeChallenge };
}

export async function GET() {
  try {
    if (!X_CLIENT_ID) {
      return NextResponse.json(
        { error: "X OAuth not configured. Please set X_CLIENT_ID in environment variables." },
        { status: 500 }
      );
    }

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const cookieStore = await cookies();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to connect X" },
        { status: 401 }
      );
    }

    // Generate PKCE values
    const { codeVerifier, codeChallenge } = await generatePKCE();

    // Generate state for CSRF protection
    const state = generateRandomString(32);

    // Store code_verifier and state in a secure cookie
    const oauthData = JSON.stringify({
      codeVerifier,
      state,
      userId: user.id,
    });

    // Build X authorization URL
    const scopes = ["tweet.read", "tweet.write", "users.read", "offline.access"];

    const authUrl = new URL("https://twitter.com/i/oauth2/authorize");
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", X_CLIENT_ID);
    authUrl.searchParams.set("redirect_uri", X_REDIRECT_URI);
    authUrl.searchParams.set("scope", scopes.join(" "));
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");

    // Create response with redirect
    const response = NextResponse.redirect(authUrl.toString());

    // Set OAuth data cookie (expires in 10 minutes)
    response.cookies.set("x_oauth_data", oauthData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("X OAuth authorize error:", error);
    return NextResponse.json(
      { error: "Failed to initiate X authentication" },
      { status: 500 }
    );
  }
}
