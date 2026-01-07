"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import SkillsInput from "@/components/SkillsInput";

const STEPS = [
  {
    id: "name",
    question: "What's your name?",
    subtitle: "How should we introduce you to the community?",
  },
  {
    id: "building",
    question: "What are you currently building?",
    subtitle: "Share what you're working on - a side project, startup, or passion project",
  },
  {
    id: "superpowers",
    question: "What are your superpowers?",
    subtitle: "What skills do you bring to the table?",
  },
  {
    id: "looking_for",
    question: "What skills are you looking for?",
    subtitle: "What kind of makers do you want to connect with?",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Form data
  const [name, setName] = useState("");
  const [currentlyBuilding, setCurrentlyBuilding] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [lookingForSkills, setLookingForSkills] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      setUser(user);

      // Check if already onboarded
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, name")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/home");
        return;
      }

      // Pre-fill name from Google if available
      if (profile?.name) {
        setName(profile.name);
      } else if (user.user_metadata?.full_name) {
        setName(user.user_metadata.full_name);
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return name.trim().length > 0;
      case 1:
        return currentlyBuilding.trim().length > 0;
      case 2:
        return skills.length > 0;
      case 3:
        return lookingForSkills.length > 0;
      default:
        return false;
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          name: name.trim(),
          currently_building: currentlyBuilding.trim(),
          skills,
          looking_for_skills: lookingForSkills,
          onboarding_completed: true,
        });

      if (error) throw error;

      router.push("/home");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fdf8f4] to-[#fff5eb]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#fdf8f4] to-[#fff5eb]">
      {/* Progress bar */}
      <div className="w-full px-6 pt-6">
        <div className="max-w-md mx-auto">
          <div className="flex gap-2">
            {STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  index <= currentStep
                    ? "bg-[#E07A5F]"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-400 mt-2 text-center">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Question */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step.question}
            </h1>
            <p className="text-gray-500">{step.subtitle}</p>
          </div>

          {/* Input area */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {currentStep === 0 && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl outline-none focus:border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/20 transition-all"
                autoFocus
              />
            )}

            {currentStep === 1 && (
              <textarea
                value={currentlyBuilding}
                onChange={(e) => setCurrentlyBuilding(e.target.value)}
                placeholder="e.g., A marketplace for local artisans, an AI writing assistant..."
                className="w-full px-4 py-3 text-lg border border-gray-200 rounded-xl outline-none focus:border-[#E07A5F] focus:ring-2 focus:ring-[#E07A5F]/20 transition-all resize-none"
                rows={4}
                autoFocus
              />
            )}

            {currentStep === 2 && (
              <SkillsInput
                skills={skills}
                onChange={setSkills}
                maxSkills={10}
              />
            )}

            {currentStep === 3 && (
              <SkillsInput
                skills={lookingForSkills}
                onChange={setLookingForSkills}
                maxSkills={10}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 py-6 text-base rounded-xl"
              >
                Back
              </Button>
            )}

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || saving}
                className="flex-1 py-6 text-base rounded-xl bg-[#E07A5F] hover:bg-[#c96a52] text-white"
              >
                {saving ? "Saving..." : "Complete Setup"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 py-6 text-base rounded-xl bg-[#E07A5F] hover:bg-[#c96a52] text-white"
              >
                Continue
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
