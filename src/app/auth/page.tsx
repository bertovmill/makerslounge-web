"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { resolveProfileId } from "@/lib/clerk-profile";
import Link from "next/link";
import { rememberPostAuthRedirect, takePostAuthRedirect } from "@/lib/post-auth-redirect";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

/**
 * Clerk throws errors carrying an `errors` array; anything else is unexpected.
 * Showing the raw object would put "[object Object]" in front of the user.
 */
function clerkErrorMessage(err: unknown): string {
  const e = err as {
    message?: string;
    longMessage?: string;
    errors?: Array<{ longMessage?: string; message?: string }>;
  };
  return (
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    e?.longMessage ||
    e?.message ||
    "Something went wrong. Please try again."
  );
}

// --------------- Sign Up Form ---------------

function SignUpForm({ onSignIn }: { onSignIn: () => void }) {
  const { signUp } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  // Clerk verifies the address with an emailed code before the account exists,
  // which Supabase did not require. That second step is this state.
  const [pendingCode, setPendingCode] = useState(false);
  const [code, setCode] = useState("");

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setMessage("");

    const { error } = await signUp.password({
      emailAddress: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
      return;
    }

    if (signUp.status === "complete") {
      await signUp.finalize();
    } else {
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) setMessage(clerkErrorMessage(sendError));
      else setPendingCode(true);
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setMessage("");

    const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
      return;
    }

    // finalize turns a complete sign-up into a live session; AuthContext then
    // creates the profile row and routes to onboarding.
    const { error: finalizeError } = await signUp.finalize();
    if (finalizeError) setMessage(clerkErrorMessage(finalizeError));
    setLoading(false);
  };

  if (pendingCode) {
    return (
      <>
        <div className="text-center mb-5">
          <h1 className="text-xl font-semibold mb-0.5">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a code to {email.trim().toLowerCase()}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-2.5">
          <div>
            <label htmlFor="code" className="block text-sm font-medium mb-1.5">
              Verification code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.trim().length < 4}
            className="w-full h-11 md:h-10 rounded-xl bg-gradient-blue text-white text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Verify"
            )}
          </button>
        </form>

        {message && (
          <div className="mt-3 p-2.5 rounded-xl bg-secondary text-sm text-center text-muted-foreground">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={() => setPendingCode(false)}
          className="w-full text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors"
        >
          Use a different email
        </button>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-5">
        <Link href="/" className="inline-block mb-4">
          <img src="/logos/logo-blue.svg" alt="MakersLounge" className="w-10 h-10 mx-auto dark:hidden" />
          <img src="/logos/logo-light.svg" alt="MakersLounge" className="w-10 h-10 mx-auto hidden dark:block" />
        </Link>
        <h1 className="text-xl font-semibold mb-0.5">Create an account</h1>
        <p className="text-sm text-muted-foreground">Join a community of makers and builders</p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-2.5">
        <div>
          <label htmlFor="signup-email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            required
          />
        </div>

        <div>
          <label htmlFor="signup-password" className="block text-sm font-medium mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-4 pr-10 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || password.length < 6}
          className="w-full h-11 md:h-10 rounded-xl bg-gradient-blue text-white text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={onSignIn}
        className="w-full text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors"
      >
        Already have an account? <span className="font-medium text-foreground">Sign in</span>
      </button>

      {message && (
        <div className="mt-3 p-2.5 rounded-xl bg-secondary text-sm text-center text-muted-foreground">
          {message}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-5">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </>
  );
}

// --------------- Sign In Form ---------------

function SignInForm({ onSignUp }: { onSignUp: () => void }) {
  const router = useRouter();
  const { signIn } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Clerk handles OAuth by redirecting to /auth/sso-callback, which mounts
  // <AuthenticateWithRedirectCallback /> and completes the handshake. The
  // native app follows the same path through an in-app browser — its custom
  // scheme is no longer involved, since Clerk owns the callback now.
  const startOAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    if (!signIn) return;
    setLoading(true);
    setMessage("");

    const { error } = await signIn.sso({
      strategy,
      redirectUrl: "/home",
      redirectCallbackUrl: "/auth/sso-callback",
    });

    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
    }
  };

  const handleSignInWithApple = () => startOAuth("oauth_apple");
  const handleSignInWithGoogle = () => startOAuth("oauth_google");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signIn) return;
    setLoading(true);
    setMessage("");

    const { error } = await signIn.password({
      identifier: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
      return;
    }

    if (signIn.status === "complete") {
      // finalize turns it into a live session; AuthContext takes it from there.
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) setMessage(clerkErrorMessage(finalizeError));
    } else {
      // MFA or another step this custom form doesn't implement. The hosted
      // portal knows how to finish any flow.
      setMessage("Additional verification needed — continue at accounts.makerslounge.ca");
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-5">
        <Link href="/" className="inline-block mb-4">
          <img src="/logos/logo-blue.svg" alt="MakersLounge" className="w-10 h-10 mx-auto dark:hidden" />
          <img src="/logos/logo-light.svg" alt="MakersLounge" className="w-10 h-10 mx-auto hidden dark:block" />
        </Link>
        <h1 className="text-xl font-semibold mb-0.5">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-2.5">
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
            className="w-full h-10 px-4 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-4 pr-10 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
        </div>

        <button
          type="submit"
          disabled={loading || !email.trim() || password.length < 6}
          className="w-full h-11 md:h-10 rounded-xl bg-gradient-blue text-white text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <button
        type="button"
        onClick={onSignUp}
        className="w-full text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors"
      >
        Don&apos;t have an account? <span className="font-medium text-foreground">Sign up</span>
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white/60 dark:bg-black/40 px-3 text-muted-foreground">or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
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

        <button
          onClick={handleSignInWithApple}
          disabled={loading}
          className="w-full h-11 md:h-10 rounded-xl md:rounded-md border border-border text-sm font-medium flex items-center justify-center gap-2 hover:bg-secondary active:bg-secondary transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          Continue with Apple
        </button>
      </div>

      {message && (
        <div className="mt-3 p-2.5 rounded-xl bg-secondary text-sm text-center text-muted-foreground">
          {message}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center mt-5">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </>
  );
}

// --------------- Main Auth Page ---------------

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn, user: clerkUser } = useUser();
  const clerkUserId = clerkUser?.id ?? null;
  const clerkEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? null;
  const clerkFirstName = clerkUser?.firstName ?? null;
  const clerkLastName = clerkUser?.lastName ?? null;
  const mode = searchParams.get("mode");
  const [isSigningUp, setIsSigningUp] = useState(mode === "signup");
  const [checkingAuth, setCheckingAuth] = useState(true);

  const mergeContactIfExists = async (userId: string, email: string) => {
    const { data: contact } = await supabase
      .from("community_contacts")
      .select("id, skills, summary, linkedin, twitter, instagram, website")
      .eq("email", email.toLowerCase())
      .is("matched_profile_id", null)
      .maybeSingle();

    if (!contact) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("skills, bio, linkedin, twitter, instagram, website")
      .eq("id", userId)
      .single();

    const updates: Record<string, unknown> = {};
    if (!profile?.skills?.length && contact.skills?.length) updates.skills = contact.skills;
    if (!profile?.bio && contact.summary) updates.bio = contact.summary;
    if (!profile?.linkedin && contact.linkedin) updates.linkedin = contact.linkedin;
    if (!profile?.twitter && contact.twitter) updates.twitter = contact.twitter;
    if (!profile?.instagram && contact.instagram) updates.instagram = contact.instagram;
    if (!profile?.website && contact.website) updates.website = contact.website;

    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", userId);
    }

    await supabase
      .from("community_contacts")
      .update({ matched_profile_id: userId, matched_at: new Date().toISOString() })
      .eq("id", contact.id);
  };

  const redirectAfterAuth = async (userId: string, email?: string) => {
    if (email) await mergeContactIfExists(userId, email);

    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", userId)
      .single();

    if (!profile?.name) {
      router.push("/onboarding");
      return;
    }

    takePostAuthRedirect();
    localStorage.removeItem("pendingMatcherQuery");
    router.push("/home");
  };

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      localStorage.setItem("pendingMatcherQuery", q);
    }
    rememberPostAuthRedirect(searchParams.get("next"));
  }, [searchParams]);

  // Clerk owns the session, so this page only has to notice that one exists
  // and route onwards. The OAuth handshake itself lands on /auth/sso-callback,
  // and Clerk's own listener updates `isSignedIn` when it completes — no
  // code exchange or custom-scheme handling left to do here.
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUserId) {
      setCheckingAuth(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const profileId = await resolveProfileId(clerkUserId, {
        firstName: clerkFirstName,
        lastName: clerkLastName,
      });
      if (cancelled || !profileId) {
        if (!cancelled) setCheckingAuth(false);
        return;
      }
      await redirectAfterAuth(profileId, clerkEmail ?? undefined);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, clerkUserId]);

  if (checkingAuth) {
    return (
      <div className="h-svh flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-svh flex items-center justify-center px-4 overflow-x-hidden py-8 pt-[max(2rem,env(safe-area-inset-top,48px))]">
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
      <div className="relative z-10 w-full max-w-sm max-h-[calc(100svh-4rem)] my-auto bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-5 md:p-6 flex flex-col">
        {isSigningUp ? (
          <SignUpForm onSignIn={() => setIsSigningUp(false)} />
        ) : (
          <SignInForm onSignUp={() => setIsSigningUp(true)} />
        )}
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
