"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * Landing point for Clerk's OAuth redirect.
 *
 * Replaces the old /auth/callback route, which exchanged a Supabase code for a
 * session. Clerk completes its own handshake inside this component and then
 * sends the user on to `redirectUrlComplete`, so there is nothing to do here
 * but mount it and show a spinner.
 */
export default function SSOCallbackPage() {
  return (
    <div className="h-svh flex items-center justify-center">
      <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/home" />
      <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
    </div>
  );
}
