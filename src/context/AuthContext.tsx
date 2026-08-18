"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { fetchCurrentProfile } from "@/lib/clerk-profile";

/**
 * Auth for the whole site. Clerk owns the session; Supabase owns the data.
 *
 * `user.id` is the profile uuid, not the Clerk id — every foreign key and all
 * ~72 `user.id` call sites depend on it. `clerkUserId` is exposed separately
 * for the few callers that need the identity provider's own id.
 */
export interface AuthUser {
  /** Profile uuid. The id every table's foreign keys point at. */
  id: string;
  email: string | null;
  clerkUserId: string;
  /**
   * What Supabase used to expose as `user_metadata.full_name` /
   * `avatar_url` — the display name and picture the OAuth provider supplied.
   * Onboarding and the profile editor prefill from these.
   */
  fullName: string | null;
  imageUrl: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  onboardingComplete: boolean;
  refreshOnboarding: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = "bertmill19@gmail.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true); // default true to avoid flash redirect

  // Depend on the Clerk user *id*, not the user object. `useUser()` hands back a
  // fresh resource object on every token refresh, so depending on the object
  // re-ran this effect every minute or so — each run cancelling the previous
  // in-flight lookup. The id is a stable string.
  const clerkUserId = clerkUser?.id ?? null;

  // Map the Clerk session onto a profile uuid. One round trip to /api/me, which
  // resolves (and on first sight creates) the row server-side against Neon.
  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      if (!isSignedIn || !clerkUserId) {
        if (cancelled) return;
        setUser(null);
        setOnboardingComplete(true);
        setLoading(false);
        return;
      }

      const me = await fetchCurrentProfile();
      if (cancelled) return;

      if (!me) {
        // Authenticated but unusable. Surfacing this beats silently rendering a
        // signed-out UI to someone who is in fact signed in.
        console.error("[auth] could not resolve a profile for", clerkUserId);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: me.id,
        email: me.email,
        clerkUserId: me.clerkUserId,
        fullName: me.fullName,
        imageUrl: me.imageUrl,
      });
      setOnboardingComplete(me.onboardingComplete);
      // Clear `loading` here rather than leaving it to a follow-up effect. It
      // used to hang off a second query, so any failure there left the whole app
      // stuck on its loading branch with no way out.
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUserId]);

  const refreshOnboarding = async () => {
    const me = await fetchCurrentProfile();
    if (me) setOnboardingComplete(me.onboardingComplete);
  };

  const signOut = async () => {
    await clerkSignOut();
  };

  // Onboarding is deliberately NOT enforced here. This used to redirect anyone
  // without a `profiles.name` to /onboarding from every non-public path, which
  // meant a signup who didn't finish the form could never reach /home — it read
  // as login being broken. Authenticated means authenticated: land on /home and
  // fill in the profile whenever. `onboardingComplete` is still published for
  // anything that wants to *prompt*, just never to gate.

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, onboardingComplete, refreshOnboarding, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
