"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { ArrowRight, ArrowLeft, Loader2, Linkedin, Instagram, Globe } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import SkillsInput from "@/components/SkillsInput";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentlyBuilding, setCurrentlyBuilding] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  // Step 2 fields
  const [lookingForNote, setLookingForNote] = useState("");
  const [lookingForPeople, setLookingForPeople] = useState<string[]>([]);

  // Step 3 fields
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

        if (profile?.name) {
          router.push("/home");
          return;
        }

        if (user.user_metadata?.full_name) {
          const parts = user.user_metadata.full_name.split(" ");
          setFirstName(parts[0] || "");
          setLastName(parts.slice(1).join(" ") || "");
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

  const canProceedStep2 = lookingForNote.trim().length > 0;

  const canSaveStep3 = linkedin.trim().length > 0;

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
    <div className="min-h-svh relative overflow-hidden">
      {/* Dotted glow background */}
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

      <div className="relative z-10 flex items-start md:items-center justify-center min-h-svh px-4 py-12">
        <div className="w-full max-w-md bg-background/70 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-sm border border-border/40">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
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
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-1">
                  Welcome to MakersLounge
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Tell us about yourself and what you&apos;re building.
                </p>

                <div className="space-y-5">
                  {/* Name */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5">
                        First name <span className="text-destructive">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                        autoFocus
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-1.5">Last name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Doe"
                        className="w-full h-11 px-4 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      />
                    </div>
                  </div>

                  {/* Currently building */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      What are you working on? <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={currentlyBuilding}
                      onChange={e => setCurrentlyBuilding(e.target.value)}
                      placeholder="e.g., Building a marketplace for local artisans using AI"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Your top skills
                    </label>
                    <SkillsInput
                      skills={skills}
                      onChange={setSkills}
                      maxSkills={8}
                      mode="skills"
                    />
                  </div>
                </div>

                <button
                  onClick={() => goTo(2)}
                  disabled={!canProceedStep1}
                  className="w-full h-11 md:h-10 mt-8 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-1">
                  What are you looking for?
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Help us connect you with the right people.
                </p>

                <div className="space-y-5">
                  {/* Looking for note */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      Describe what you&apos;re looking for <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      value={lookingForNote}
                      onChange={e => setLookingForNote(e.target.value)}
                      placeholder="e.g., Looking for a technical co-founder to help build the MVP, and a designer to nail the brand identity"
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 resize-none"
                      autoFocus
                    />
                  </div>

                  {/* Looking for people types */}
                  <div>
                    <label className="block text-sm font-medium mb-1.5">
                      What kind of people are you looking for?
                    </label>
                    <SkillsInput
                      skills={lookingForPeople}
                      onChange={setLookingForPeople}
                      maxSkills={8}
                      mode="looking_for"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => goTo(1)}
                    className="h-11 md:h-10 px-4 rounded-xl border border-input text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={() => goTo(3)}
                    disabled={!canProceedStep2}
                    className="flex-1 h-11 md:h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <h1 className="text-2xl font-semibold tracking-tight mb-1">
                  Connect your socials
                </h1>
                <p className="text-sm text-muted-foreground mb-8">
                  Help others find and connect with you.
                </p>

                <div className="space-y-4">
                  {/* LinkedIn - mandatory */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn <span className="text-destructive">*</span>
                    </label>
                    <div className="flex h-11 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
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

                  {/* Instagram */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <Instagram className="w-4 h-4" />
                      Instagram
                    </label>
                    <div className="flex h-11 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
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

                  {/* X / Twitter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      X (Twitter)
                    </label>
                    <div className="flex h-11 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
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

                  {/* Website / Portfolio */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <Globe className="w-4 h-4" />
                      Personal website / Portfolio
                    </label>
                    <div className="flex h-11 rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
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

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => goTo(2)}
                    className="h-11 md:h-10 px-4 rounded-xl border border-input text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!canSaveStep3 || saving}
                    className="flex-1 h-11 md:h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
