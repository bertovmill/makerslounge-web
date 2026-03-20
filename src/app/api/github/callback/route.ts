import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken } from "@/lib/github-oauth";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/onboarding?error=no_code", request.url));
  }

  try {
    const token = await exchangeCodeForToken(code);

    // Redirect back to onboarding GitHub page with token in httpOnly cookie
    const response = NextResponse.redirect(new URL("/onboarding/github", request.url));
    response.cookies.set("github_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes — just enough for the import flow
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return NextResponse.redirect(new URL("/onboarding?error=github_auth_failed", request.url));
  }
}
