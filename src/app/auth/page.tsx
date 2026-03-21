"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // Start with checking=true so the login form doesn't flash during OAuth redirects
  const [checkingAuth, setCheckingAuth] = useState(true);

  const redirectAfterAuth = async (userId: string) => {
    // Check if profile has a name — if not, send to onboarding
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    if (!profile?.name) {
      router.push("/onboarding");
      return;
    }

    const pendingQuery = searchParams.get("q") || localStorage.getItem("pendingMatcherQuery");

    if (pendingQuery) {
      localStorage.removeItem("pendingMatcherQuery");
      router.push(`/matcher?q=${encodeURIComponent(pendingQuery)}`);
    } else {
      router.push("/home");
    }
  };

  // Persist pending query so it survives OAuth redirects
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      localStorage.setItem("pendingMatcherQuery", q);
    }
  }, [searchParams]);

  useEffect(() => {
    let hasRedirected = false;

    const handleAuthRedirect = async (userId: string) => {
      if (hasRedirected) return;
      hasRedirected = true;
      await redirectAfterAuth(userId);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        handleAuthRedirect(user.id);
      } else {
        // No existing session — safe to show the login form
        setCheckingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) handleAuthRedirect(session.user.id);
    });

    // Listen for deep link callback from native OAuth
    if (Capacitor.isNativePlatform()) {
      import("@capacitor/app").then(({ App }) => {
        App.addListener("appUrlOpen", async ({ url }) => {
          if (url.includes("auth-callback")) {
            // Close the in-app browser first
            import("@capacitor/browser").then(({ Browser }) => Browser.close());

            // Try PKCE flow first (Supabase v2+ default): exchange code for session
            const urlObj = new URL(url);
            const code = urlObj.searchParams.get("code");
            if (code) {
              await supabase.auth.exchangeCodeForSession(code);
              return;
            }

            // Fallback: extract tokens from the URL hash fragment (implicit flow)
            const hashPart = url.split("#")[1];
            if (hashPart) {
              const params = new URLSearchParams(hashPart);
              const accessToken = params.get("access_token");
              const refreshToken = params.get("refresh_token");
              if (accessToken && refreshToken) {
                await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
              }
            }
          }
        });
      });
    }

    return () => subscription.unsubscribe();
  }, [router, searchParams]);

  const handleAppleOAuthViaBrowser = async () => {
    // Use OAuth flow via in-app browser (same approach as Google sign-in)
    if (Capacitor.isNativePlatform()) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: "com.makerslounge.app://auth-callback",
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      if (data?.url) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url, presentationStyle: "popover" });
      }
      setLoading(false);
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
    }
  };

  const handleSignInWithApple = async () => {
    setLoading(true);
    setMessage("");

    if (Capacitor.isNativePlatform()) {
      try {
        const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
        const result = await SignInWithApple.authorize({
          clientId: "com.makerslounge.app",
          redirectURI: "https://makerslounge.ca",
          scopes: "email name",
        });

        // Validate identity token before proceeding — on iPad, the native plugin
        // can complete authentication but return a null/empty token
        const idToken = result?.response?.identityToken;
        if (!idToken) {
          console.warn("Apple Sign-In: no identity token returned, falling back to OAuth");
          await handleAppleOAuthViaBrowser();
          return;
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: "apple",
          token: idToken,
        });
        if (error) {
          // If token exchange fails, fall back to OAuth flow
          console.warn("Apple Sign-In: signInWithIdToken failed, falling back to OAuth:", error.message);
          await handleAppleOAuthViaBrowser();
          return;
        }
        // Explicitly navigate after successful native sign-in
        // (onAuthStateChange may not fire reliably in Capacitor WebView)
        if (data.session?.user) {
          await redirectAfterAuth(data.session.user.id);
        }
        setLoading(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Apple Sign In failed";
        // If native plugin is not available, fall back to OAuth via browser
        if (errorMessage.includes("not implemented") || errorMessage.includes("not available")) {
          await handleAppleOAuthViaBrowser();
          return;
        }
        if (!errorMessage.includes("canceled") && !errorMessage.includes("cancelled")) {
          // On any unexpected error, try OAuth as fallback instead of showing error
          console.warn("Apple Sign-In: native plugin error, falling back to OAuth:", errorMessage);
          await handleAppleOAuthViaBrowser();
          return;
        }
        setLoading(false);
      }
    } else {
      await handleAppleOAuthViaBrowser();
    }
  };

  const handleSignInWithGoogle = async () => {
    setLoading(true);

    if (Capacitor.isNativePlatform()) {
      // Native: open in-app browser (SFSafariViewController — bottom sheet)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "com.makerslounge.app://auth-callback",
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      if (data?.url) {
        const { Browser } = await import("@capacitor/browser");
        await Browser.open({ url: data.url, presentationStyle: "popover" });
      }
      setLoading(false);
    } else {
      // Web: normal redirect
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
    }
  };

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else if (data.user && !data.session) {
        setMessage("Account created! You can now sign in.");
        setIsSignUp(false);
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage(error.message);
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="h-svh flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-svh flex items-center justify-center px-4 overflow-hidden pt-[env(safe-area-inset-top,48px)]">
      <DottedGlowBackground
        className="pointer-events-none"
        opacity={0.8}
        gap={14}
        radius={1.4}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-neutral-400"
        backgroundOpacity={0}
        speedMin={0.2}
        speedMax={1.2}
        speedScale={0.8}
      />
      <div className="relative z-10 w-full max-w-sm bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-6 md:p-8">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <img src="/logo-blue.svg" alt="MakersLounge" className="w-12 h-12 mx-auto dark:hidden" />
            <img src="/logo-light.svg" alt="MakersLounge" className="w-12 h-12 mx-auto hidden dark:block" />
          </Link>
          <h1 className="text-2xl mb-1">
            Sign in or sign up
          </h1>
          <p className="text-sm text-muted-foreground">
            Start connecting with makers
          </p>
        </div>

        {/* Google */}
        <button
          onClick={handleSignInWithGoogle}
          disabled={loading}
          className="w-full h-11 md:h-10 rounded-xl md:rounded-md border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary active:bg-secondary transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Apple */}
        <button
          onClick={handleSignInWithApple}
          disabled={loading}
          className="w-full h-11 md:h-10 rounded-xl md:rounded-md border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary active:bg-secondary transition-colors disabled:opacity-50 mt-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleSignInWithEmail} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 px-3 pr-10 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {isSignUp && (
              <p className="text-xs text-muted-foreground mt-1">At least 6 characters</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50"
          >
            {loading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-sm text-center mt-6 text-muted-foreground">
          {isSignUp ? "Already have an account?" : "New to MakersLounge?"}{" "}
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
            className="text-primary font-medium hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>

        {/* Message */}
        {message && (
          <div className="mt-4 p-3 rounded-md bg-secondary text-sm text-center text-muted-foreground">
            {message}
          </div>
        )}

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-svh flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
