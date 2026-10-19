"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMyProfile, updateMyProfile } from "@/lib/profiles-client";
import { takePostAuthRedirect } from "@/lib/post-auth-redirect";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { useAuth } from "@/context/AuthContext";

/**
 * One question, then you're in. Skills, socials and the rest live on /profile,
 * where a member can fill them in once they've seen why they'd want to.
 *
 * The name is only asked for when we don't already have one — Google supplies
 * it, an email-code sign-up doesn't. Writing `profiles.name` is what marks
 * onboarding done (see AuthContext), so both buttons write it.
 */
export default function OnboardingPage() {
  const { user, loading: authLoading, refreshOnboarding } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"save" | "skip" | null>(null);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [askName, setAskName] = useState(false);
  const [currentlyBuilding, setCurrentlyBuilding] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const profile = await fetchMyProfile();
        if (cancelled) return;

        // Already onboarded — has a name.
        if (profile?.name?.trim()) {
          router.push(takePostAuthRedirect() || "/home");
          return;
        }

        const known =
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
          user.fullName?.trim() ||
          "";
        setName(known);
        setAskName(!known);
        if (profile?.currently_building) setCurrentlyBuilding(profile.currently_building);
      } catch (err) {
        console.error("Onboarding profile load error:", err);
        setAskName(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  const finish = async (mode: "save" | "skip") => {
    const fullName = name.trim();
    if (!fullName) return;
    setSaving(mode);
    setError("");

    const [first, ...rest] = fullName.split(/\s+/);
    const updates: Record<string, unknown> = {
      name: fullName,
      first_name: first,
      last_name: rest.join(" "),
    };
    if (mode === "save" && currentlyBuilding.trim()) {
      updates.currently_building = currentlyBuilding.trim();
    }

    // The row already exists, created by GET /api/me the first time this Clerk
    // user was seen; identity comes from the session, so no id is sent.
    const result = await updateMyProfile(updates);
    if (!result.success) {
      setError("Couldn't save that. Please try again.");
      setSaving(null);
      return;
    }

    await refreshOnboarding();
    localStorage.removeItem("pendingMatcherQuery");
    // A gated page may have sent this user to sign up; deliver them to it.
    router.push(takePostAuthRedirect() || "/home");
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = name.trim().split(/\s+/)[0];
  const canSave = !!name.trim() && !!currentlyBuilding.trim();

  return (
    <div className="relative min-h-svh flex items-center justify-center px-4 overflow-x-hidden py-8">
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) finish("save");
        }}
        className="relative z-10 w-full max-w-md bg-card border border-border shadow-[var(--shadow-card)] rounded-2xl p-6 md:p-7"
      >
        <h1 className="text-2xl font-semibold tracking-[-0.02em] mb-1">
          {firstName && !askName ? `Welcome, ${firstName}` : "Welcome to MakersLounge"}
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          One question and you&apos;re in. It&apos;s how May finds you the right people.
        </p>

        {askName && (
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Your name
            </label>
            <input
              id="name"
              autoComplete="name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:border-[var(--blue-core)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--blue-core)_18%,transparent)]"
              autoFocus
              required
            />
          </div>
        )}

        <label htmlFor="currently-building" className="block text-sm font-medium mb-1.5">
          What are you working on?
        </label>
        <textarea
          id="currently-building"
          rows={4}
          placeholder="An app that helps local bakeries sell out their day-old bread…"
          value={currentlyBuilding}
          onChange={(e) => setCurrentlyBuilding(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none transition-shadow resize-none placeholder:text-muted-foreground/60 focus:border-[var(--blue-core)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--blue-core)_18%,transparent)]"
          autoFocus={!askName}
        />

        <button
          type="submit"
          disabled={!canSave || saving !== null}
          className="mt-4 w-full h-11 rounded-xl bg-gradient-blue text-white text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center"
        >
          {saving === "save" ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Continue"
          )}
        </button>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-secondary text-sm text-center text-muted-foreground" role="status">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => finish("skip")}
          disabled={!name.trim() || saving !== null}
          className="w-full text-sm text-muted-foreground mt-3 hover:text-foreground transition-colors disabled:opacity-50"
        >
          {saving === "skip" ? "Skipping…" : "Skip for now"}
        </button>
      </form>
    </div>
  );
}
