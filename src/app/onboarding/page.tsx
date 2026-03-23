"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { ArrowRight, ArrowLeft, Loader2, Linkedin, Instagram, Globe } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import SkillsInput from "@/components/SkillsInput";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

const TOTAL_STEPS = 4;

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 1: About you
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentlyBuilding, setCurrentlyBuilding] = useState("");

  // Step 2: Skills
  const [skills, setSkills] = useState<string[]>([]);

  // Step 3: Looking for
  const [lookingForNote, setLookingForNote] = useState("");
  const [lookingForPeople, setLookingForPeople] = useState<string[]>([]);

  // Step 4: Socials
  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push("/auth"); return; }
        setUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("name, first_name, last_name, currently_building")
          .eq("id", user.id)
          .single();

        // Already onboarded — has a name
        if (profile?.name?.trim()) {
          router.push("/home");
          return;
        }

        if (profile?.first_name) {
          setFirstName(profile.first_name);
          setLastName(profile.last_name || "");
        } else if (user.user_metadata?.full_name) {
          const parts = user.user_metadata.full_name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
        }

        if (profile?.currently_building) {
          setCurrentlyBuilding(profile.currently_building);
        }
      } catch (error) {
        console.error("Onboarding auth check error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  const goTo = (nextStep: number) => {
    setDirection(nextStep > step ? 1 : -1);
    setStep(nextStep);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`.trim();

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name,
        currently_building: currentlyBuilding.trim() || null,
        skills: skills.length > 0 ? skills : null,
        bio: lookingForNote.trim() || null,
        looking_for_skills: lookingForPeople.length > 0 ? lookingForPeople : null,
        linkedin: linkedin.trim() ? `https://linkedin.com/in/${linkedin.trim()}` : null,
        twitter: twitter.trim() ? `https://x.com/${twitter.trim()}` : null,
        instagram: instagram.trim() ? `https://instagram.com/${instagram.trim()}` : null,
        website: website.trim() ? `https://${website.trim()}` : null,
      });

      if (error) throw error;
      router.push("/home");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaving(false);
    }
  };

  const canProceedStep1 =
    firstName.trim().length > 0 &&
    currentlyBuilding.trim().length > 0;

  const canProceedStep3 = lookingForNote.trim().length > 0;

  const canSave = linkedin.trim().length > 0;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-svh relative overflow-hidden">
      <DottedGlowBackground
        className="pointer-events-none"
        opacity={0.4}
        gap={14}
        radius={1.4}
        colorLightVar="--color-neutral-400"
        glowColorLightVar="--color-neutral-500"
        colorDarkVar="--color-neutral-500"
        glowColorDarkVar="--color-sky-700"
        backgroundOpacity={0}
        speedMin={0.2}
        speedMax={1}
        speedScale={0.8}
      />

      <div className="relative z-10 flex items-center justify-center h-svh px-4">
        <div className="w-full max-w-md bg-background/70 backdrop-blur-xl rounded-2xl p-5 md:p-8 shadow-sm border border-border/40 max-h-[calc(100svh-2rem)] flex flex-col">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4 shrink-0">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <motion.div
                key={s}
                className="h-1.5 flex-1 rounded-full"
                initial={false}
                animate={{
                  backgroundColor: step >= s
                    ? "hsl(var(--primary))"
                    : "hsl(var(--muted))",
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Name + What you're working on */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col flex-1 min-h-0"
              >
                <h1 className="text-xl font-semibold tracking-tight mb-0.5">
                  Welcome to MakersLounge
                </h1>
                <p className="text-sm text-muted-foreground mb-5">
                  Tell us about yourself and what you&apos;re building.
                </p>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">
                        First name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full h-10 px-4 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1">Last name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full h-10 px-4 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      What are you working on? <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={currentlyBuilding}
                      onChange={e => setCurrentlyBuilding(e.target.value)}
                      placeholder="e.g., Building a marketplace for local artisans using AI"
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
                    />
                  </div>
                </div>

                <div className="mt-auto pt-5">
                  <button
                    onClick={() => goTo(2)}
                    disabled={!canProceedStep1}
                    className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Skills */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col flex-1 min-h-0"
              >
                <h1 className="text-xl font-semibold tracking-tight mb-0.5">
                  Your top skills
                </h1>
                <p className="text-sm text-muted-foreground mb-5">
                  Select what you&apos;re great at.
                </p>

                <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
                  <SkillsInput
                    skills={skills}
                    onChange={setSkills}
                    maxSkills={8}
                    mode="skills"
                  />
                </div>

                <div className="flex gap-3 mt-auto pt-5 shrink-0">
                  <button
                    onClick={() => goTo(1)}
                    className="h-11 px-4 rounded-xl border border-input text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => goTo(3)}
                    className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Looking for */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col flex-1 min-h-0"
              >
                <h1 className="text-xl font-semibold tracking-tight mb-0.5">
                  What are you looking for?
                </h1>
                <p className="text-sm text-muted-foreground mb-5">
                  Help us connect you with the right people.
                </p>

                <div className="space-y-4 flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Describe what you need <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={lookingForNote}
                      onChange={e => setLookingForNote(e.target.value)}
                      placeholder="e.g., Looking for a technical co-founder and a designer to nail the brand"
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Types of people
                    </label>
                    <SkillsInput
                      skills={lookingForPeople}
                      onChange={setLookingForPeople}
                      maxSkills={8}
                      mode="looking_for"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-5 shrink-0">
                  <button
                    onClick={() => goTo(2)}
                    className="h-11 px-4 rounded-xl border border-input text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => goTo(4)}
                    disabled={!canProceedStep3}
                    className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Socials */}
            {step === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="flex flex-col flex-1 min-h-0"
              >
                <h1 className="text-xl font-semibold tracking-tight mb-0.5">
                  Connect your socials
                </h1>
                <p className="text-sm text-muted-foreground mb-5">
                  Help others find and connect with you.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn <span className="text-destructive">*</span>
                    </label>
                    <div className="flex h-10 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                      <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm border-r border-input shrink-0">
                        linkedin.com/in/
                      </span>
                      <input
                        type="text"
                        value={linkedin}
                        onChange={e => setLinkedin(e.target.value)}
                        placeholder="yourname"
                        className="flex-1 h-full px-3 bg-transparent text-base md:text-sm outline-none"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </label>
                    <div className="flex h-10 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                      <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm border-r border-input shrink-0">
                        instagram.com/
                      </span>
                      <input
                        type="text"
                        value={instagram}
                        onChange={e => setInstagram(e.target.value)}
                        placeholder="yourhandle"
                        className="flex-1 h-full px-3 bg-transparent text-base md:text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X (Twitter)
                    </label>
                    <div className="flex h-10 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                      <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm border-r border-input shrink-0">
                        x.com/
                      </span>
                      <input
                        type="text"
                        value={twitter}
                        onChange={e => setTwitter(e.target.value)}
                        placeholder="yourhandle"
                        className="flex-1 h-full px-3 bg-transparent text-base md:text-sm outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1">
                      <Globe className="w-4 h-4" />
                      Website / Portfolio
                    </label>
                    <div className="flex h-10 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                      <span className="flex items-center px-3 bg-muted text-muted-foreground text-sm border-r border-input shrink-0">
                        https://
                      </span>
                      <input
                        type="text"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        placeholder="yoursite.com"
                        className="flex-1 h-full px-3 bg-transparent text-base md:text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-auto pt-5 shrink-0">
                  <button
                    onClick={() => goTo(3)}
                    className="h-11 px-4 rounded-xl border border-input text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Get started
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
