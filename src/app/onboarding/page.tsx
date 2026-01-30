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
    illustration: "name",
  },
  {
    id: "building",
    question: "What are you building?",
    subtitle: "Share what you're working on - a side project, startup, or passion project",
    illustration: "building",
  },
  {
    id: "superpowers",
    question: "What are your superpowers?",
    subtitle: "What skills do you bring to the table?",
    illustration: "skills",
  },
  {
    id: "looking_for",
    question: "Who do you want to meet?",
    subtitle: "What kind of makers do you want to connect with?",
    illustration: "connect",
  },
];

// MakersLounge brand colors
const ML_COLORS = {
  blue: "oklch(0.5 0.2 255)",
  teal: "oklch(0.6 0.15 195)",
  orange: "oklch(0.7 0.18 50)",
  yellow: "oklch(0.85 0.18 90)",
};

// Illustration components for each step
function StepIllustration({ step }: { step: string }) {
  const illustrations: Record<string, React.ReactNode> = {
    name: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="text-5xl font-bold text-gray-900 tracking-tight">
          <span className="block">Connect.</span>
          <span className="block">Build.</span>
          <span className="block">
            <span
              className="bg-clip-text"
              style={{
                background: `linear-gradient(90deg, ${ML_COLORS.blue}, ${ML_COLORS.teal}, ${ML_COLORS.orange}, ${ML_COLORS.yellow})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >Grow.</span>
          </span>
        </div>
        {/* Floating maker badges */}
        <div className="absolute top-8 right-8 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 animate-float">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: ML_COLORS.blue }}>JD</div>
          <span className="text-sm font-medium text-gray-700">Designer</span>
        </div>
        <div className="absolute bottom-16 left-4 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 animate-float-delayed">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: ML_COLORS.teal }}>AK</div>
          <span className="text-sm font-medium text-gray-700">Developer</span>
        </div>
        <div className="absolute top-24 left-12 bg-white rounded-full px-3 py-1.5 shadow-lg flex items-center gap-2 animate-float-slow">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ background: ML_COLORS.orange }}>SM</div>
          <span className="text-sm font-medium text-gray-700">Founder</span>
        </div>
      </div>
    ),
    building: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `color-mix(in oklch, ${ML_COLORS.blue} 15%, white)` }}>
              <svg className="w-5 h-5" style={{ color: ML_COLORS.blue }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">SaaS Products</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `color-mix(in oklch, ${ML_COLORS.teal} 15%, white)` }}>
              <svg className="w-5 h-5" style={{ color: ML_COLORS.teal }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Mobile Apps</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `color-mix(in oklch, ${ML_COLORS.orange} 15%, white)` }}>
              <svg className="w-5 h-5" style={{ color: ML_COLORS.orange }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">AI Tools</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: `color-mix(in oklch, ${ML_COLORS.yellow} 15%, white)` }}>
              <svg className="w-5 h-5" style={{ color: ML_COLORS.orange }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900">Communities</p>
          </div>
        </div>
      </div>
    ),
    skills: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {["React", "Node.js", "Design", "AI/ML", "Marketing", "Product", "Python", "Strategy", "UX Research", "Growth"].map((skill, i) => {
            const colors = [
              { bg: ML_COLORS.blue, text: "white" },
              { bg: `color-mix(in oklch, ${ML_COLORS.teal} 20%, white)`, text: ML_COLORS.teal },
              { bg: `color-mix(in oklch, ${ML_COLORS.orange} 20%, white)`, text: ML_COLORS.orange },
              { bg: `color-mix(in oklch, ${ML_COLORS.yellow} 30%, white)`, text: "oklch(0.4 0.1 90)" },
            ];
            const color = colors[i % 4];
            return (
              <span
                key={skill}
                className="px-4 py-2 rounded-full text-sm font-medium"
                style={{ background: color.bg, color: color.text }}
              >
                {skill}
              </span>
            );
          })}
        </div>
      </div>
    ),
    connect: (
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative">
          {/* Center node */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg gradient-wave">
            You
          </div>
          {/* Connection lines and nodes */}
          <div className="absolute -top-12 -left-8 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2" style={{ borderColor: `color-mix(in oklch, ${ML_COLORS.blue} 40%, white)` }}>
            <span className="text-sm font-medium" style={{ color: ML_COLORS.blue }}>Dev</span>
          </div>
          <div className="absolute -top-8 -right-12 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2" style={{ borderColor: `color-mix(in oklch, ${ML_COLORS.teal} 40%, white)` }}>
            <span className="text-sm font-medium" style={{ color: ML_COLORS.teal }}>PM</span>
          </div>
          <div className="absolute top-4 -right-16 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2" style={{ borderColor: `color-mix(in oklch, ${ML_COLORS.orange} 40%, white)` }}>
            <span className="text-sm font-medium" style={{ color: ML_COLORS.orange }}>UX</span>
          </div>
          <div className="absolute -bottom-8 -right-10 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2" style={{ borderColor: `color-mix(in oklch, ${ML_COLORS.yellow} 50%, white)` }}>
            <span className="text-sm font-medium" style={{ color: "oklch(0.5 0.15 90)" }}>Sales</span>
          </div>
          <div className="absolute -bottom-12 left-0 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2" style={{ borderColor: `color-mix(in oklch, ${ML_COLORS.blue} 40%, white)` }}>
            <span className="text-sm font-medium" style={{ color: ML_COLORS.blue }}>Ops</span>
          </div>
          <div className="absolute top-4 -left-16 w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center border-2" style={{ borderColor: `color-mix(in oklch, ${ML_COLORS.teal} 40%, white)` }}>
            <span className="text-sm font-medium" style={{ color: ML_COLORS.teal }}>Data</span>
          </div>
          {/* Connection lines - using SVG */}
          <svg className="absolute inset-0 w-full h-full -z-10" style={{ width: "200px", height: "200px", left: "-70px", top: "-70px" }}>
            <line x1="100" y1="100" x2="60" y2="30" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4" />
            <line x1="100" y1="100" x2="150" y2="40" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4" />
            <line x1="100" y1="100" x2="170" y2="100" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4" />
            <line x1="100" y1="100" x2="145" y2="160" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4" />
            <line x1="100" y1="100" x2="80" y2="170" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4" />
            <line x1="100" y1="100" x2="30" y2="100" stroke="#E5E7EB" strokeWidth="2" strokeDasharray="4" />
          </svg>
        </div>
      </div>
    ),
  };

  return illustrations[step] || null;
}

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
      {/* Modal Card */}
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-border">
        {/* Left side - Form content */}
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          {/* Progress bar - wave gradient */}
          <div className="mb-8">
            <div className="flex gap-1.5 h-1.5 rounded-full overflow-hidden bg-muted">
              <div
                className="gradient-wave rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Step {currentStep + 1} of {STEPS.length}
            </p>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              {step.question}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">{step.subtitle}</p>
          </div>

          {/* Input area */}
          <div className="flex-1">
            {currentStep === 0 && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 text-base border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                autoFocus
              />
            )}

            {currentStep === 1 && (
              <textarea
                value={currentlyBuilding}
                onChange={(e) => setCurrentlyBuilding(e.target.value)}
                placeholder="e.g., A marketplace for local artisans, an AI writing assistant..."
                className="w-full px-4 py-3 text-base border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none bg-background"
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
          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="px-6 py-2.5 text-sm rounded-lg"
              >
                Back
              </Button>
            )}

            {isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={!canProceed() || saving}
                className="flex-1 py-2.5 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {saving ? "Saving..." : "Get Started"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 py-2.5 text-sm rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue
              </Button>
            )}
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden md:flex flex-1 bg-muted items-center justify-center p-8 border-l border-border">
          <StepIllustration step={step.illustration} />
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
