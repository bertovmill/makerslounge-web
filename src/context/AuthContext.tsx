"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser, useAuth as useClerkAuth } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { resolveProfileId } from "@/lib/clerk-profile";

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

  // Map the Clerk session onto a profile uuid.
  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    (async () => {
      if (!isSignedIn || !clerkUser) {
        if (cancelled) return;
        setUser(null);
        setOnboardingComplete(true);
        hasCheckedOnboarding.current = false;
        setLoading(false);
        return;
      }

      const profileId = await resolveProfileId(clerkUser.id, {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
      });
      if (cancelled) return;

      if (!profileId) {
        // Authenticated but unusable. Surfacing this beats silently rendering a
        // signed-out UI to someone who is in fact signed in.
        console.error("[auth] could not resolve a profile for", clerkUser.id);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser({
        id: profileId,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        clerkUserId: clerkUser.id,
        fullName: clerkUser.fullName ?? null,
        imageUrl: clerkUser.imageUrl ?? null,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, clerkUser]);

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

  const signOut = async () => {
    await clerkSignOut();
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
