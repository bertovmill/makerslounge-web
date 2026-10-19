"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSignIn, useSignUp, useUser } from "@clerk/nextjs";
import { fetchCurrentProfile } from "@/lib/clerk-profile";
import Link from "next/link";
import { rememberPostAuthRedirect, takePostAuthRedirect } from "@/lib/post-auth-redirect";
import { ArrowLeft } from "lucide-react";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

/**
 * One door, Luma-style: Continue with Google, or type an email and get a
 * six-digit code. There is no password and no sign-in vs sign-up choice — the
 * email decides. An address Clerk knows signs in; one it doesn't becomes a new
 * account, through the same code screen.
 *
 * Existing members who set a password before this flow keep it on their Clerk
 * account; they just don't need it here, since `email_code` is a first factor.
 */

type ClerkErrorLike = {
  code?: string;
  message?: string;
  longMessage?: string;
  errors?: Array<{ code?: string; longMessage?: string; message?: string }>;
};

/**
 * Clerk throws errors carrying an `errors` array; anything else is unexpected.
 * Showing the raw object would put "[object Object]" in front of the user.
 */
function clerkErrorMessage(err: unknown): string {
  const e = err as ClerkErrorLike;
  return (
    e?.errors?.[0]?.longMessage ||
    e?.errors?.[0]?.message ||
    e?.longMessage ||
    e?.message ||
    "Something went wrong. Please try again."
  );
}

function clerkErrorCode(err: unknown): string | undefined {
  const e = err as ClerkErrorLike;
  return e?.errors?.[0]?.code || e?.code;
}

const inputClass =
  "w-full h-11 px-4 rounded-xl border border-input bg-background text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:border-[var(--blue-core)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--blue-core)_18%,transparent)]";

const primaryButtonClass =
  "w-full h-11 rounded-xl bg-gradient-blue text-white text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center";

function Spinner() {
  return <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// --------------- The one form ---------------

type Step = "email" | "code" | "password";

function AuthForm() {
  const router = useRouter();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const [step, setStep] = useState<Step>("email");
  // Which Clerk resource the code belongs to: a known address signs in, an
  // unknown one is a new sign-up. The member never sees the difference.
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const codeInputRef = useRef<HTMLInputElement>(null);

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  // OAuth lands on /auth/sso-callback, which completes the handshake (and turns
  // a first-time Google user into a sign-up on its own), then returns here so
  // the routing below decides between onboarding and /home.
  const continueWithGoogle = async () => {
    if (!signIn) return;
    setLoading(true);
    setMessage("");

    const { error } = await signIn.sso({
      strategy: "oauth_google",
      redirectUrl: "/auth",
      redirectCallbackUrl: "/auth/sso-callback",
    });

    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
    }
  };

  // Returns the step to show next, or null when something went wrong.
  const startSignUp = async (): Promise<Step | null> => {
    if (!signUp) return null;
    const { error: createError } = await signUp.create({ emailAddress: normalizedEmail });
    if (createError) {
      setMessage(clerkErrorMessage(createError));
      return null;
    }
    setFlow("signUp");
    // The Clerk instance still has "password required" switched on for
    // sign-ups. Turning it off in the Clerk dashboard makes this step vanish;
    // until then it is one field before the code rather than a dead end.
    if (signUp.missingFields.includes("password")) return "password";

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setMessage(clerkErrorMessage(sendError));
      return null;
    }
    return "code";
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!signIn || !normalizedEmail) return;
    setLoading(true);
    setMessage("");

    const { error } = await signIn.emailCode.sendCode({ emailAddress: normalizedEmail });

    let next: Step | null = null;
    if (!error) {
      setFlow("signIn");
      next = "code";
    } else if (clerkErrorCode(error) === "form_identifier_not_found") {
      next = await startSignUp();
    } else {
      setMessage(clerkErrorMessage(error));
    }

    if (next) {
      setCode("");
      setStep(next);
    }
    setLoading(false);
  };

  const resendCode = async () => {
    setLoading(true);
    setMessage("");
    const { error } =
      flow === "signIn"
        ? await signIn!.emailCode.sendCode({ emailAddress: normalizedEmail })
        : await signUp!.verifications.sendEmailCode();
    setMessage(error ? clerkErrorMessage(error) : "New code sent.");
    setLoading(false);
  };

  // finalize turns a complete sign-in or sign-up into a live session; the
  // effect in AuthContent notices and routes onwards.
  const verifyCode = async (value: string) => {
    if (!signIn || !signUp) return;
    setLoading(true);
    setMessage("");

    if (flow === "signIn") {
      const { error: verifyError } = await signIn.emailCode.verifyCode({ code: value });
      if (verifyError) {
        setMessage(clerkErrorMessage(verifyError));
        setLoading(false);
        return;
      }
      const { error: finalizeError } = await signIn.finalize();
      if (finalizeError) setMessage(clerkErrorMessage(finalizeError));
      setLoading(false);
      return;
    }

    const { error } = await signUp.verifications.verifyEmailCode({ code: value });
    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
      return;
    }

    if (signUp.status === "complete") {
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) setMessage(clerkErrorMessage(finalizeError));
    } else {
      setMessage("We couldn't finish creating your account. Please try again.");
    }
    setLoading(false);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setMessage("");
    const { error } = await signUp.password({ emailAddress: normalizedEmail, password });
    if (error) {
      setMessage(clerkErrorMessage(error));
      setLoading(false);
      return;
    }
    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setMessage(clerkErrorMessage(sendError));
    } else {
      setCode("");
      setStep("code");
    }
    setLoading(false);
  };

  const backToEmail = () => {
    setStep("email");
    setCode("");
    setMessage("");
  };

  const notice = message && (
    <div className="mt-3 p-2.5 rounded-xl bg-secondary text-sm text-center text-muted-foreground" role="status">
      {message}
    </div>
  );

  if (step === "code") {
    return (
      <>
        <button
          type="button"
          onClick={backToEmail}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-1">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <span className="text-foreground">{normalizedEmail}</span>
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyCode(code.trim());
          }}
          className="space-y-2.5"
        >
          <label htmlFor="code" className="sr-only">
            Code
          </label>
          <input
            ref={codeInputRef}
            id="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            maxLength={6}
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 6);
              setCode(next);
              // Six digits is a whole code; don't make them hunt for a button.
              if (next.length === 6 && !loading) verifyCode(next);
            }}
            className={`${inputClass} text-center text-lg tracking-[0.5em] font-medium`}
            required
          />

          <button type="submit" disabled={loading || code.trim().length < 6} className={primaryButtonClass}>
            {loading ? <Spinner /> : "Continue"}
          </button>
        </form>

        {notice}

        <button
          type="button"
          onClick={resendCode}
          disabled={loading}
          className="w-full text-sm text-muted-foreground mt-4 hover:text-foreground transition-colors disabled:opacity-50"
        >
          Didn&apos;t get it? <span className="font-medium text-foreground">Resend code</span>
        </button>
      </>
    );
  }

  if (step === "password") {
    return (
      <>
        <button
          type="button"
          onClick={backToEmail}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-center mb-5">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-1">New here? Welcome</h1>
          <p className="text-sm text-muted-foreground">
            Choose a password for {normalizedEmail}, then we&apos;ll email you a code
          </p>
        </div>

        <form onSubmit={submitPassword} className="space-y-2.5">
          <label htmlFor="new-password" className="sr-only">
            Password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            required
            minLength={8}
            autoFocus
          />
          <button type="submit" disabled={loading || password.length < 8} className={primaryButtonClass}>
            {loading ? <Spinner /> : "Continue"}
          </button>
        </form>

        {notice}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="text-center mb-6">
        <Link href="/" className="inline-block mb-4">
          <img src="/logos/logo-blue.svg" alt="MakersLounge" className="w-10 h-10 mx-auto dark:hidden" />
          <img src="/logos/logo-light.svg" alt="MakersLounge" className="w-10 h-10 mx-auto hidden dark:block" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-1">Welcome to MakersLounge</h1>
        <p className="text-sm text-muted-foreground">Sign in or join — it&apos;s the same step</p>
      </div>

      <button
        type="button"
        onClick={continueWithGoogle}
        disabled={loading}
        className="w-full h-11 rounded-xl border border-border bg-background text-sm font-medium flex items-center justify-center gap-2.5 transition-colors hover:bg-secondary hover:border-foreground/25 disabled:opacity-50"
      >
        <GoogleIcon />
        Continue with Google
      </button>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
        </div>
      </div>

      <form onSubmit={sendCode} className="space-y-2.5">
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          required
        />
        <button type="submit" disabled={loading || !normalizedEmail} className={primaryButtonClass}>
          {loading ? <Spinner /> : "Continue with email"}
        </button>
      </form>

      {notice}

      <p className="text-xs leading-relaxed text-muted-foreground text-center mt-5">
        We&apos;ll email you a code — no password needed. By continuing, you agree to our Terms of
        Service and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
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
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      localStorage.setItem("pendingMatcherQuery", q);
    }
    rememberPostAuthRedirect(searchParams.get("next"));
  }, [searchParams]);

  // Clerk owns the session, so this page only has to notice that one exists
  // and route onwards: a brand-new member (no `profiles.name` yet) gets the one
  // onboarding question, everyone else goes where they were headed.
  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !clerkUserId) {
      setCheckingAuth(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const me = await fetchCurrentProfile();
      if (cancelled) return;
      if (!me) {
        setCheckingAuth(false);
        return;
      }

      // Claim any community-contact record matching this account's email.
      // Server-side, because the email must come from the session rather than
      // from the browser. Not blocking on failure: enrichment is a nicety.
      try {
        await fetch("/api/me/merge-contact", { method: "POST", credentials: "include" });
      } catch (err) {
        console.error("[auth] contact merge failed:", err);
      }
      if (cancelled) return;

      if (!me.onboardingComplete) {
        // /onboarding takes the parked post-auth redirect itself when it's done.
        router.push("/onboarding");
        return;
      }

      localStorage.removeItem("pendingMatcherQuery");
      router.push(takePostAuthRedirect() || "/home");
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
      {/* Solid card, not a frosted one. DESIGN.md rules out glassmorphism, and
          a solid --card surface lets the "or" label use bg-card and disappear
          into it. */}
      <div className="relative z-10 w-full max-w-sm my-auto bg-card border border-border shadow-[var(--shadow-card)] rounded-2xl p-6 md:p-7 flex flex-col">
        <AuthForm />
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
