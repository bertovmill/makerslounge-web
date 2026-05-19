import type { Metadata } from "next";
import Script from "next/script";
import MarketingShell from "@/components/MarketingShell";
import SignupForm from "./SignupForm";
import SubmissionWatcher from "./SubmissionWatcher";

const AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ??
  "agent_7901kry43e4se10rh4p7jwrgzgzk";

export const metadata: Metadata = {
  title: "Find a team — 2026 Innovation Hackathon",
  description:
    "Solo builder? Drop your name, your background, and what you're hoping for in a teammate — type it in or fill in by voice with Mack.",
};

export default function FindTeamPage() {
  return (
    <MarketingShell>
    <div className="px-5 pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md flex-col gap-7 pt-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Find a team</span>
            <span className="h-px w-8 bg-border" />
            <span>2026 Innovation Hackathon</span>
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

        {/* Live confirmation when a new signup lands */}
        <SubmissionWatcher />

        {/* Form — primary */}
        <SignupForm />

        {/* Voice — optional, secondary */}
        <div className="flex flex-col gap-3 border-t border-border pt-6">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Or</span>
            <span className="h-px w-8 bg-border" />
            <span>Fill in by voice</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Prefer to talk it out? Mack is our voice concierge — about 90
            seconds.
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
    </MarketingShell>
  );
}
