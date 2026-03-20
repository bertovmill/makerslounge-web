"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { Mic, MicOff, Github, ArrowRight, Loader2 } from "lucide-react";
import SkillsInput from "@/components/SkillsInput";
import ProfilePreview, { type ProfileData } from "@/components/onboarding/ProfilePreview";
import { getGitHubAuthUrl } from "@/lib/github-oauth";

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0 = form step 1, 1 = form step 2, 2 = preview

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [projects, setProjects] = useState<string[]>([""]);
  const [skills, setSkills] = useState<string[]>([]);
  const [lookingForSkills, setLookingForSkills] = useState<string[]>([]);
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Profile preview state
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
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
      } catch (error) {
        console.error("Onboarding auth check error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  // Voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async (field: string) => {
    if (isRecording) { stopRecording(); return; }
    setActiveField(field);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Silence detection
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silenceStart: number | null = null;

      const checkSilence = () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") return;
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg < 10) {
          if (!silenceStart) silenceStart = Date.now();
          else if (Date.now() - silenceStart > 2000) { stopRecording(); return; }
        } else { silenceStart = null; }
        silenceTimerRef.current = setTimeout(checkSilence, 100);
      };

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        audioContext.close();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (audioChunksRef.current.length === 0) return;

        setIsTranscribing(true);
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");
          const res = await fetch("/api/voice/transcribe", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Transcription failed");
          const { text } = await res.json();

          if (text?.trim()) {
            // Route transcribed text to the active field
            switch (field) {
              case "firstName": setFirstName(prev => prev ? `${prev} ${text.trim()}` : text.trim()); break;
              case "lastName": setLastName(prev => prev ? `${prev} ${text.trim()}` : text.trim()); break;
              case "project0": setProjects(prev => { const u = [...prev]; u[0] = prev[0] ? `${prev[0]} ${text.trim()}` : text.trim(); return u; }); break;
              case "project1": setProjects(prev => { const u = [...prev]; u[1] = (prev[1] || "") ? `${prev[1]} ${text.trim()}` : text.trim(); return u; }); break;
            }
          }
        } catch (err) {
          console.error("Transcription error:", err);
        } finally {
          setIsTranscribing(false);
          setActiveField(null);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      checkSilence();
    } catch (err) {
      console.error("Mic access error:", err);
      setActiveField(null);
    }
  }, [isRecording, stopRecording]);

  const MicButton = ({ field }: { field: string }) => {
    const isActive = isRecording && activeField === field;
    const isThisTranscribing = isTranscribing && activeField === field;
    return (
      <button
        type="button"
        onClick={() => startRecording(field)}
        disabled={isTranscribing}
        className={`shrink-0 w-10 h-10 rounded-md border flex items-center justify-center transition-all ${
          isActive
            ? "border-destructive bg-destructive/10 text-destructive animate-pulse"
            : "border-input text-muted-foreground hover:text-foreground hover:border-foreground/30"
        } disabled:opacity-50`}
        title={isActive ? "Stop recording" : "Speak to fill"}
      >
        {isThisTranscribing ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isActive ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </button>
    );
  };

  // Navigation
  const canProceedStep0 = firstName.trim().length > 0 && projects.some(p => p.trim().length > 0);
  const canProceedStep1 = skills.length > 0;

  const handleContinueToPreview = () => {
    setProfileData({
      firstName, lastName,
      projects: projects.filter(p => p.trim()),
      skills, lookingForSkills,
      linkedin, twitter, instagram, website,
    });
    setStep(2);
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Profile preview
  if (step === 2 && profileData && user) {
    return (
      <ProfilePreview
        data={profileData}
        userId={user.id}
        onBack={() => setStep(1)}
      />
    );
  }

  return (
    <div className="min-h-svh flex items-start md:items-center justify-center px-4 py-12 overflow-y-auto">
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

            <div className="space-y-4 mb-6">
              {/* Name fields */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5">First name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="John"
                      className="flex-1 h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                      autoFocus
                    />
                    <MicButton field="firstName" />
                  </div>
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

              {/* Project fields */}
              <div>
                <label className="block text-sm font-medium mb-1.5">What are you building?</label>
                {projects.map((project, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={project}
                      onChange={e => {
                        const u = [...projects]; u[i] = e.target.value; setProjects(u);
                      }}
                      placeholder={i === 0 ? "e.g., A marketplace for local artisans" : "Another project..."}
                      className="flex-1 h-11 px-3 rounded-md border border-input bg-background text-base md:text-sm outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                    />
                    <MicButton field={`project${i}`} />
                  </div>
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

            {/* GitHub shortcut */}
            <button
              onClick={() => { window.location.href = getGitHubAuthUrl(); }}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-border hover:bg-secondary/50 transition-colors text-left mb-6"
            >
              <Github className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Import from GitHub</span> — auto-fill from your repos
              </span>
            </button>

            {/* Continue */}
            <button
              onClick={() => setStep(1)}
              disabled={!canProceedStep0}
              className="w-full h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
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

            {/* Navigation */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="h-11 md:h-10 px-4 rounded-xl md:rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinueToPreview}
                disabled={!canProceedStep1}
                className="flex-1 h-11 md:h-10 rounded-xl md:rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Preview profile
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
