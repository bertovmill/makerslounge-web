import type { Metadata } from "next";
import Script from "next/script";
import { Mic } from "lucide-react";
import SignupForm from "./SignupForm";
import SubmissionWatcher from "./SubmissionWatcher";

const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ??
  "agent_7901kry43e4se10rh4p7jwrgzgzk";

export const metadata: Metadata = {
  title: "Find a team — Innovation Hackathon",
  description:
    "Solo builder? Talk to Mack — our voice concierge — and we'll match you onto a team for the MakersLounge Innovation Hackathon.",
};

export default function FindTeamPage() {
  return (
    <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md flex-col gap-8 pt-10">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Find a team</span>
            <span className="h-px w-8 bg-border" />
            <span>Innovation Hackathon</span>
          </div>
          <h1 className="font-serif text-[clamp(2.75rem,9vw,4.5rem)] leading-[0.92] tracking-tight">
            Talk to Mack.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Solo builder? Mack is our voice concierge for the Innovation
            Hackathon. Tap the call button, share three quick things — your
            first name, your background, and what you&apos;re hoping for in a
            teammate. About 90 seconds.
          </p>
        </header>

        {/* Live confirmation when a new signup lands */}
        <SubmissionWatcher />

        {/* Voice — primary CTA */}
        <section
          aria-label="Voice agent"
          className="relative flex min-h-[260px] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-border bg-card/40 p-8 text-center backdrop-blur-sm"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-foreground/[0.06]">
            <Mic className="size-5 text-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Sign up by voice
            </p>
            <p className="max-w-[28ch] text-sm text-muted-foreground">
              Tap <span className="text-foreground">Start a call</span> below
              and Mack will take it from here.
            </p>
          </div>
          <div className="mt-2 flex w-full items-center justify-center">
            {/* @ts-expect-error - ElevenLabs custom element is loaded by the convai widget script */}
            <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
          </div>
        </section>

        {/* Typing fallback */}
        <details className="group border-t border-border pt-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
            <span>Prefer to type it in?</span>
            <span className="text-foreground/40 transition-transform group-open:rotate-90">
              →
            </span>
          </summary>
          <div className="mt-6 rounded-xl border border-border bg-card/30 p-5">
            <SignupForm />
          </div>
        </details>
      </div>

      <Script
        src="https://unpkg.com/@elevenlabs/convai-widget-embed"
        strategy="afterInteractive"
        async
        type="text/javascript"
      />
    </div>
  );
}
