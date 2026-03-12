"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import SkillsInput from "@/components/SkillsInput";
import { ArrowLeft, ArrowRight, Mic, MicOff, X, Plus } from "lucide-react";

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

const STEPS = [
  { id: "name", question: "What's your name?", subtitle: "How should we introduce you?" },
  { id: "building", question: "What are you building?", subtitle: "A side project, startup, or passion project" },
  { id: "superpowers", question: "What are your skills?", subtitle: "What do you bring to the table?" },
  { id: "looking_for", question: "Who do you want to meet?", subtitle: "What skills are you looking for?" },
  { id: "socials", question: "Where can people find you?", subtitle: "Add your social links" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [projects, setProjects] = useState<string[]>([""]);
  const [skills, setSkills] = useState<string[]>([]);
  const [lookingForSkills, setLookingForSkills] = useState<string[]>([]);

  const [listeningIndex, setListeningIndex] = useState<number | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  const toggleListening = useCallback((index: number) => {
    if (listeningIndex === index && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }
    if (recognitionRef.current) recognitionRef.current.stop();

    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new (SR as new () => SpeechRecognitionInstance)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setProjects(prev => {
        const updated = [...prev];
        updated[index] = prev[index] ? `${prev[index]} ${transcript}` : transcript;
        return updated;
      });
    };
    recognition.onerror = () => { setListeningIndex(null); recognitionRef.current = null; };
    recognition.onend = () => { setListeningIndex(null); recognitionRef.current = null; };

    recognitionRef.current = recognition;
    setListeningIndex(index);
    recognition.start();
  }, [listeningIndex]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed, name, first_name, last_name")
        .eq("id", user.id)
        .single();

      if (profile?.onboarding_completed) { router.push("/people"); return; }

      if (profile?.first_name) {
        setFirstName(profile.first_name);
        setLastName(profile.last_name || "");
      } else if (profile?.name) {
        const parts = profile.name.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      } else if (user.user_metadata?.full_name) {
        const parts = user.user_metadata.full_name.split(" ");
        setFirstName(parts[0] || "");
        setLastName(parts.slice(1).join(" ") || "");
      }

      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const canProceed = () => {
    switch (currentStep) {
      case 0: return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 1: return projects.some(p => p.trim().length > 0);
      case 2: return skills.length > 0;
      case 3: return lookingForSkills.length > 0;
      case 4: return linkedin.trim().length > 0;
      default: return false;
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        currently_building: JSON.stringify(projects.filter(p => p.trim())),
        skills,
        looking_for_skills: lookingForSkills,
        linkedin: linkedin.trim() ? `https://linkedin.com/in/${linkedin.trim()}` : null,
        twitter: twitter.trim() ? `https://x.com/${twitter.trim()}` : null,
        instagram: instagram.trim() ? `https://instagram.com/${instagram.trim()}` : null,
        website: website.trim() ? `https://${website.trim()}` : null,
        onboarding_completed: true,
      });
      if (error) throw error;
      router.push("/people");
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div className="min-h-svh flex items-start md:items-center justify-center px-4 py-12 overflow-y-auto">
      <div className="w-full max-w-md md:max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= currentStep ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </div>

        {/* Question */}
        <h1 className="text-[24px] md:text-2xl font-bold md:font-semibold tracking-tight mb-1">{step.question}</h1>
        <p className="text-[13px] md:text-sm text-muted-foreground mb-6">{step.subtitle}</p>

        {/* Inputs */}
        <div className="mb-8">
          {currentStep === 0 && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">First name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Last name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-2">
              {projects.map((project, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={project}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[index] = e.target.value;
                      setProjects(updated);
                    }}
                    placeholder={index === 0 ? "e.g., A marketplace for local artisans" : "Another project..."}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    autoFocus={index === 0}
                  />
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => toggleListening(index)}
                      className="shrink-0 w-10 h-10 rounded-md border border-input flex items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {listeningIndex === index ? <MicOff className="w-4 h-4 text-destructive" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setProjects(projects.filter((_, i) => i !== index))}
                      className="shrink-0 w-10 h-10 rounded-md border border-input flex items-center justify-center text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {projects.length < 5 && (
                <button
                  type="button"
                  onClick={() => setProjects([...projects, ""])}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add another
                </button>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <SkillsInput skills={skills} onChange={setSkills} maxSkills={10} />
          )}

          {currentStep === 3 && (
            <SkillsInput skills={lookingForSkills} onChange={setLookingForSkills} maxSkills={10} mode="looking_for" />
          )}

          {currentStep === 4 && (
            <div className="space-y-3">
              {[
                { label: "LinkedIn", prefix: "linkedin.com/in/", value: linkedin, set: setLinkedin, required: true },
                { label: "X (Twitter)", prefix: "x.com/", value: twitter, set: setTwitter },
                { label: "Instagram", prefix: "instagram.com/", value: instagram, set: setInstagram },
                { label: "Website", prefix: "https://", value: website, set: setWebsite },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-sm font-medium mb-1.5">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </label>
                  <div className="flex items-center h-10 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                    <span className="text-xs text-muted-foreground pl-3 pr-1 shrink-0">{field.prefix}</span>
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => field.set(e.target.value)}
                      placeholder="username"
                      className="flex-1 h-full pr-3 text-sm outline-none bg-transparent"
                      autoFocus={field.label === "LinkedIn"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="h-11 md:h-10 px-4 rounded-xl md:rounded-md border border-border text-sm font-medium hover:bg-secondary active:bg-secondary transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={isLastStep ? handleComplete : () => setCurrentStep(currentStep + 1)}
            disabled={!canProceed() || saving}
            className="flex-1 h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? "Saving..." : isLastStep ? "Get started" : "Continue"}
            {!isLastStep && !saving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
