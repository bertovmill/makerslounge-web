import type { Metadata } from "next";
import Script from "next/script";
import SignupForm from "./SignupForm";

const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ??
  "agent_7901kry43e4se10rh4p7jwrgzgzk";

export const metadata: Metadata = {
  title: "Find a team — Innovation Hackathon",
  description:
    "Solo builder? Tell us about yourself and we'll match you onto a team for the MakersLounge Innovation Hackathon — type it in or talk to Mack.",
};

export default function FindTeamPage() {
  return (
    <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md flex-col gap-7 pt-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Find a team</span>
            <span className="h-px w-8 bg-border" />
            <span>Innovation Hackathon</span>
          </div>
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">
            Find your team.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Solo builder? Drop your name, your background, and what you&apos;re
            hoping for in a teammate. We&apos;ll match you with other builders
            before the kickoff.
          </p>
        </header>

        {/* Form — primary */}
        <SignupForm />

        {/* Voice alternative — small, secondary */}
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Or</span>
            <span className="h-px w-8 bg-border" />
            <span>Talk to Mack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Prefer to talk? Mack is our voice concierge — about 90 seconds.
          </p>
          {/* @ts-expect-error - ElevenLabs custom element is loaded by the convai widget script */}
          <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
        </div>
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
