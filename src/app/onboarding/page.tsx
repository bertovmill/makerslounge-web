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
  {
    id: "socials",
    question: "Where can people find you?",
    subtitle: "Add your social links so makers can connect with you",
    illustration: "socials",
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
    socials: (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="grid grid-cols-3 gap-4">
          {/* LinkedIn */}
          <div className="w-16 h-16 rounded-2xl bg-[#0A66C2] flex items-center justify-center shadow-lg animate-float">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          {/* X/Twitter */}
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg animate-float-delayed">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          {/* Instagram */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center shadow-lg animate-float-slow">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </div>
          {/* YouTube */}
          <div className="w-16 h-16 rounded-2xl bg-[#FF0000] flex items-center justify-center shadow-lg animate-float-slow">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
          {/* TikTok */}
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shadow-lg animate-float">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
          </div>
          {/* Website */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-float-delayed" style={{ background: `linear-gradient(135deg, ${ML_COLORS.blue}, ${ML_COLORS.teal})` }}>
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          </div>
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
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentlyBuilding, setCurrentlyBuilding] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [lookingForSkills, setLookingForSkills] = useState<string[]>([]);

  // Social links
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [website, setWebsite] = useState("");

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
        .select("onboarding_completed, name, first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push("/home");
        return;
      }

      // Pre-fill name from profile or Google
      if (profile?.first_name) {
        setFirstName(profile.first_name);
        setLastName(profile.last_name || "");
      } else if (profile?.name) {
        const nameParts = profile.name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
      } else if (user.user_metadata?.full_name) {
        const nameParts = user.user_metadata.full_name.split(" ");
        setFirstName(nameParts[0] || "");
        setLastName(nameParts.slice(1).join(" ") || "");
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
        return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 1:
        return currentlyBuilding.trim().length > 0;
      case 2:
        return skills.length > 0;
      case 3:
        return lookingForSkills.length > 0;
      case 4:
        return linkedin.trim().length > 0;
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
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`, // Keep for backwards compatibility
          currently_building: currentlyBuilding.trim(),
          skills,
          looking_for_skills: lookingForSkills,
          linkedin: linkedin.trim() || null,
          twitter: twitter.trim() || null,
          instagram: instagram.trim() || null,
          youtube: youtube.trim() || null,
          tiktok: tiktok.trim() || null,
          website: website.trim() || null,
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full px-4 py-3 text-base border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full px-4 py-3 text-base border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                  />
                </div>
              </div>
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
                mode="looking_for"
              />
            )}

            {currentStep === 4 && (
              <div className="space-y-3">
                {/* LinkedIn - Required */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    LinkedIn <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/username"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Twitter/X - Optional */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    X (Twitter)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="x.com/username"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                    />
                  </div>
                </div>

                {/* Instagram - Optional */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Instagram
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="instagram.com/username"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                    />
                  </div>
                </div>

                {/* YouTube - Optional */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    YouTube
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={youtube}
                      onChange={(e) => setYoutube(e.target.value)}
                      placeholder="youtube.com/@channel"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                    />
                  </div>
                </div>

                {/* TikTok - Optional */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    TikTok
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="tiktok.com/@username"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                    />
                  </div>
                </div>

                {/* Personal Website - Optional */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Personal Website
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="yourwebsite.com"
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-input rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-background"
                    />
                  </div>
                </div>
              </div>
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
