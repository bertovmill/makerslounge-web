"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "motion/react";

const AVATAR_COLORS = [
  "bg-rose-400/80",
  "bg-amber-400/80",
  "bg-emerald-400/80",
  "bg-violet-400/80",
];

const AVATAR_INITIALS = ["JD", "AK", "MR"];

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", userId)
        .single();

      if (!profile || !profile.onboarding_completed) {
        router.push("/onboarding");
      } else {
        router.push("/people");
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        checkOnboardingStatus(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignInWithGoogle = async () => {
    setLoading(true);
    const redirectUrl = `${window.location.origin}/people`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      } else if (data.user && !data.session) {
        setMessage("Account created! You can now sign in.");
        setIsSignUp(false);
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setMessage(error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Grain overlay */}
      <div className="grain-overlay" />

      {/* Left side - Photo Hero (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        {/* Background photo */}
        <img
          src="/makerslounge-photos/team-photo.jpeg"
          alt="MakersLounge community"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
        {/* Warm accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-20 text-white h-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3">
              <img src="/icon-512.png" alt="MakersLounge" className="w-12 h-12 rounded-xl shadow-lg" />
              <span className="text-2xl font-semibold">MakersLounge</span>
            </Link>
          </motion.div>

          <div>
            <motion.h1
              className="font-serif text-4xl xl:text-5xl 2xl:text-6xl leading-tight mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Where makers<br />
              <span className="text-white/80 italic">connect & build</span>
            </motion.h1>

            <motion.p
              className="text-lg xl:text-xl text-white/70 max-w-md mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
            >
              Join Toronto&apos;s community of builders, creators, and entrepreneurs.
              Share your projects, find collaborators, and grow together.
            </motion.p>

            {/* Social proof */}
            <motion.div
              className="flex items-center gap-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="flex -space-x-3">
                {AVATAR_INITIALS.map((initials, i) => (
                  <motion.div
                    key={initials}
                    className={`w-11 h-11 rounded-full ${AVATAR_COLORS[i]} border-2 border-white/40 flex items-center justify-center text-sm font-semibold text-white shadow-lg`}
                    whileHover={{ scale: 1.15, zIndex: 10 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {initials}
                  </motion.div>
                ))}
                <motion.div
                  className={`w-11 h-11 rounded-full ${AVATAR_COLORS[3]} border-2 border-white/40 flex items-center justify-center text-sm font-semibold text-white shadow-lg`}
                  whileHover={{ scale: 1.15, zIndex: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  +
                </motion.div>
              </div>
              <div>
                <p className="text-white/90 text-sm font-medium">100+ makers already building</p>
                <p className="text-white/50 text-xs">Toronto&apos;s fastest-growing maker community</p>
              </div>
            </motion.div>
          </div>

          {/* Bottom spacer for layout balance */}
          <div />
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 flex flex-col bg-[oklch(0.98_0.01_60)] dark:bg-background relative overflow-hidden">
        {/* Mobile: photo background with blur */}
        <div className="lg:hidden absolute inset-0">
          <img
            src="/makerslounge-photos/team-photo.jpeg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
          />
          <div className="absolute inset-0 bg-white/80 dark:bg-black/80 backdrop-blur-sm" />
        </div>

        {/* Mobile header */}
        <motion.div
          className="lg:hidden relative z-10 p-6 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="flex items-center gap-2">
            <img src="/icon-512.png" alt="MakersLounge" className="w-8 h-8" />
            <span className="text-lg font-semibold">MakersLounge</span>
          </Link>
        </motion.div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
          <motion.div
            className="w-full max-w-sm auth-glass-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl font-semibold mb-2">
                {isSignUp ? "Create account" : "Welcome back"}
              </h2>
              <p className="text-muted-foreground">
                {isSignUp
                  ? "Start your maker journey today"
                  : "Sign in to continue to MakersLounge"}
              </p>
            </motion.div>

            {/* Google Sign In */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button
                variant="outline"
                onClick={handleSignInWithGoogle}
                disabled={loading}
                className="w-full h-12 rounded-xl border-border/60 hover:bg-muted/50 hover:border-border justify-center gap-3 font-medium transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </motion.div>

            {/* Divider */}
            <motion.div
              className="relative my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-transparent px-4 text-muted-foreground backdrop-blur-sm">or</span>
              </div>
            </motion.div>

            {/* Email Form */}
            <motion.form
              onSubmit={handleSignInWithEmail}
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-foreground/80">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-glass-input w-full h-12 px-4 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground/60"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-foreground/80">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-glass-input w-full h-12 px-4 pr-12 rounded-xl text-sm outline-none text-foreground placeholder:text-muted-foreground/60"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {isSignUp && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              {!isSignUp && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="auth-cta-btn w-full h-12 rounded-xl font-medium text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
              </button>
            </motion.form>

            {/* Toggle sign in/up */}
            <motion.p
              className="text-sm text-center mt-6 text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.55 }}
            >
              {isSignUp ? "Already have an account?" : "New to MakersLounge?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage("");
                }}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </motion.p>

            {/* Message */}
            {message && (
              <motion.div
                className="mt-4 p-3 bg-muted/50 rounded-xl border border-border/60"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm text-center text-muted-foreground">{message}</p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Footer */}
        <div className="relative z-10 p-6 text-center">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
