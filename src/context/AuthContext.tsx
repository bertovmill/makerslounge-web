"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { resolveProfileId } from "@/lib/clerk-profile";

/**
 * Auth for the whole site, during and after the move to Clerk.
 *
 * Deliberately dual-mode, the same way `current_profile_id()` is in the
 * database: a Clerk session is preferred, and an existing Supabase session
 * still works. That is what makes this shippable before the cutover instead of
 * as a big-bang switch — deploying it does not sign anybody out, and users move
 * across as they next sign in. The Supabase branch comes out once no live
 * sessions remain.
 *
 * `user.id` is deliberately still the profile uuid, not the Clerk id — every
 * foreign key and all ~72 `user.id` call sites depend on it. Clerk's id is
 * exposed separately for the rare caller that needs it.
 */
export interface AuthUser {
  /** Profile uuid. The id every table's foreign keys point at. */
  id: string;
  email: string | null;
  clerkUserId: string;
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

// Pages that don't require onboarding
const PUBLIC_PATHS = ["/", "/auth", "/onboarding"];

const ADMIN_EMAIL = "bertmill19@gmail.com";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true); // default true to avoid flash redirect
  const hasCheckedOnboarding = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // Resolve whichever session exists — Clerk first, then a legacy Supabase one.
  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    const clearUser = () => {
      setUser(null);
      setOnboardingComplete(true);
      hasCheckedOnboarding.current = false;
      setLoading(false);
    };

    (async () => {
      if (isSignedIn && clerkUser) {
        const profileId = await resolveProfileId(clerkUser.id, {
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        });
        if (cancelled) return;

        if (!profileId) {
          // Authenticated but unusable. Surfacing this beats silently rendering
          // a signed-out UI to someone who is in fact signed in.
          console.error("[auth] could not resolve a profile for", clerkUser.id);
          clearUser();
          return;
        }

        setUser({
          id: profileId,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          clerkUserId: clerkUser.id,
        });
        return;
      }

      // No Clerk session: fall back to a Supabase one so people signed in
      // before the cutover are not logged out by a deploy.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;

      const legacy = session?.user;
      if (!legacy) {
        clearUser();
        return;
      }

      setUser({
        id: legacy.id,
        email: legacy.email ?? null,
        clerkUserId: "",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUser]);

  // Keep tracking legacy Supabase sign-in/sign-out while any such sessions
  // remain. Removed once everyone is on Clerk.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isSignedIn) return; // a Clerk session wins
      const legacy = session?.user;
      if (legacy) {
        setUser({ id: legacy.id, email: legacy.email ?? null, clerkUserId: "" });
      } else {
        setUser(null);
        setOnboardingComplete(true);
        hasCheckedOnboarding.current = false;
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [isSignedIn]);

  // Check onboarding once when user is set
  useEffect(() => {
    if (!user || hasCheckedOnboarding.current) return;
    hasCheckedOnboarding.current = true;

    const checkOnboarding = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      // User needs onboarding if they have no name set
      const complete = !!(profile?.name?.trim());
      setOnboardingComplete(complete);
      setLoading(false);
    };

    checkOnboarding();
  }, [user]);

  const refreshOnboarding = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();
    setOnboardingComplete(!!(profile?.name?.trim()));
  };

  // Sign out of both, since a user may hold either kind of session.
  const signOut = async () => {
    if (isSignedIn) await clerkSignOut();
    await supabase.auth.signOut();
  };

  // Single redirect — only when we've finished checking
  useEffect(() => {
    if (loading || !user) return;

    const isPublicPath = PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!onboardingComplete && !isPublicPath) {
      router.replace("/onboarding");
    }
  }, [loading, user, onboardingComplete, pathname, router]);

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
