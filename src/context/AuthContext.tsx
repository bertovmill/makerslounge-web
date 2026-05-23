"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  onboardingComplete: boolean;
  refreshOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Pages that don't require onboarding
const PUBLIC_PATHS = ["/", "/auth", "/onboarding"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(true); // default true to avoid flash redirect
  const hasCheckedOnboarding = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) {
        setOnboardingComplete(true);
        hasCheckedOnboarding.current = false;
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (!u) setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  const isAdmin = user?.email === "bertmill19@gmail.com";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, onboardingComplete, refreshOnboarding }}>
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
