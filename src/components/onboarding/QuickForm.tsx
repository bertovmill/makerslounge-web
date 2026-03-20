"use client";

import { useState } from "react";
import SkillsInput from "@/components/SkillsInput";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { ProfileData } from "./ProfilePreview";

interface QuickFormProps {
  initialData: Partial<ProfileData>;
  onComplete: (data: ProfileData) => void;
  onBack: () => void;
}

export default function QuickForm({ initialData, onComplete, onBack }: QuickFormProps) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState(initialData.firstName || "");
  const [lastName, setLastName] = useState(initialData.lastName || "");
  const [projects, setProjects] = useState<string[]>(initialData.projects?.length ? initialData.projects : [""]);
  const [skills, setSkills] = useState<string[]>(initialData.skills || []);
  const [lookingForSkills, setLookingForSkills] = useState<string[]>(initialData.lookingForSkills || []);
  const [linkedin, setLinkedin] = useState(initialData.linkedin || "");
  const [twitter, setTwitter] = useState(initialData.twitter || "");
  const [instagram, setInstagram] = useState(initialData.instagram || "");
  const [website, setWebsite] = useState(initialData.website || "");

  const canProceed = step === 0
    ? firstName.trim().length > 0 && projects.some(p => p.trim().length > 0)
    : skills.length > 0;

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else {
      onComplete({
        firstName,
        lastName,
        projects: projects.filter(p => p.trim()),
        skills,
        lookingForSkills,
        linkedin,
        twitter,
        instagram,
        website,
      });
    }
  };

  const handleBack = () => {
    if (step === 0) {
      onBack();
    } else {
      setStep(0);
    }
  };

  return (
    <div className="min-h-svh flex items-start md:items-center justify-center px-4 py-12">
      <div className="w-full max-w-md md:max-w-lg">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex gap-1">
            {[0, 1].map(i => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-border"}`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Step {step + 1} of 2</p>
        </div>

        {step === 0 ? (
          <>
            <h1 className="text-[24px] md:text-2xl font-bold md:font-semibold tracking-tight mb-1">
              Tell us about yourself
            </h1>
            <p className="text-[13px] md:text-sm text-muted-foreground mb-6">
              Your name and what you&apos;re working on
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">First name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
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
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">What are you building?</label>
                {projects.map((project, i) => (
                  <input
                    key={i}
                    type="text"
                    value={project}
                    onChange={e => {
                      const updated = [...projects];
                      updated[i] = e.target.value;
                      setProjects(updated);
                    }}
                    placeholder="e.g., A marketplace for local artisans"
                    className="w-full h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 mb-2"
                  />
                ))}
                {projects.length < 3 && (
                  <button
                    type="button"
                    onClick={() => setProjects([...projects, ""])}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    + Add another
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[24px] md:text-2xl font-bold md:font-semibold tracking-tight mb-1">
              Skills & connections
            </h1>
            <p className="text-[13px] md:text-sm text-muted-foreground mb-6">
              What you bring and who you want to meet
            </p>
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2">Your skills</label>
                <SkillsInput skills={skills} onChange={setSkills} maxSkills={10} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Who do you want to meet?</label>
                <SkillsInput skills={lookingForSkills} onChange={setLookingForSkills} maxSkills={10} mode="looking_for" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Social links <span className="text-muted-foreground font-normal">(optional)</span></label>
                <div className="space-y-2">
                  {[
                    { label: "LinkedIn", prefix: "linkedin.com/in/", value: linkedin, set: setLinkedin },
                    { label: "X", prefix: "x.com/", value: twitter, set: setTwitter },
                    { label: "Instagram", prefix: "instagram.com/", value: instagram, set: setInstagram },
                    { label: "Website", prefix: "https://", value: website, set: setWebsite },
                  ].map(field => (
                    <div key={field.label} className="flex items-center h-10 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                      <span className="text-xs text-muted-foreground pl-3 pr-1 shrink-0">{field.prefix}</span>
                      <input
                        type="text"
                        value={field.value}
                        onChange={e => field.set(e.target.value)}
                        placeholder="username"
                        className="flex-1 h-full pr-3 text-sm outline-none bg-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handleBack}
            className="h-11 md:h-10 px-4 rounded-xl md:rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex-1 h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {step === 0 ? "Continue" : "Preview profile"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
