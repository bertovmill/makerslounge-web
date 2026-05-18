import type { Metadata } from "next";
import Script from "next/script";
import SignupForm from "./SignupForm";

const AGENT_ID = "agent_7901kry43e4se10rh4p7jwrgzgzk";

export const metadata: Metadata = {
  title: "Find a team — Innovation Hackathon",
  description:
    "Solo builder? Talk to Mack — our voice concierge — and we'll match you onto a team for the MakersLounge Innovation Hackathon.",
};

export default function FindTeamPage() {
  return (
    <div className="min-h-svh bg-background px-5 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-md flex-col gap-8 pt-8">
        {/* Header */}
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Find a team</span>
            <span className="h-px w-8 bg-border" />
            <span>Innovation Hackathon</span>
          </div>
          <h1 className="font-serif text-4xl leading-[0.95] tracking-tight sm:text-5xl">
            Talk to Mack.
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Mack is our team-matching concierge. Tap the button, say your first
            name, your background, and what you&apos;re hoping for in a teammate.
            About 90 seconds.
          </p>
        </header>

        {/* Voice widget */}
        <section
          aria-label="Voice agent"
          className="flex min-h-[280px] items-center justify-center rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm"
        >
          {/* @ts-expect-error - ElevenLabs custom element is loaded by the convai widget script */}
          <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
        </section>

        {/* Typing fallback */}
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground">
            <span>Prefer to type it in?</span>
            <span className="text-foreground/40 transition-transform group-open:rotate-90">
              →
            </span>
          </summary>
          <div className="mt-5 rounded-xl border border-border bg-card/30 p-5">
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
