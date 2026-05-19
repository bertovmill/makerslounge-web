"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import Countdown from "./Countdown";
import SubmissionForm from "./SubmissionForm";

// Edit these as information firms up. Live updates push to everyone on next load.
const LUMA_URL = "https://luma.com/makerslounge-hackathon";
const DISCORD_URL = "https://discord.com/invite/PBgbuw5v";
const TRACKS: Array<{ name: string; description: string; criteria: string[]; image: string }> = [
  {
    name: "Validating a Business Idea",
    description: "Innovation teams collect thousands of ideas every year, far more than they can evaluate. Build an AI agent or tool that streamlines the innovation pipeline from raw idea to commercialized product.",
    criteria: ["End-to-end pipeline coverage", "Quality of scoring / triage logic", "Speed & scalability over manual review", "Demo clarity"],
    image: "/hackathons/innovation-hackathon/track-idea-validation.png",
  },
  {
    name: "Continuous Market Monitoring",
    description: "The business landscape is changing fast, and separating signal from noise has become critical. Build an agentic AI tool or platform that continuously monitors the market for signals relevant to a company's innovation function.",
    criteria: ["Signal relevance & accuracy", "Real-time or near-real-time capability", "Actionability of insights surfaced", "Demo clarity"],
    image: "/hackathons/innovation-hackathon/track-market-monitoring.png",
  },
  {
    name: "Synthetic Customers",
    description: "Real customer studies are slow, expensive, and often fail to surface what customers actually want. Build an AI tool or platform that simulates synthetic customer feedback on new product ideas.",
    criteria: ["Fidelity of synthetic feedback", "Non-obvious insight generation", "Time & cost savings vs. real research", "Demo clarity"],
    image: "/hackathons/innovation-hackathon/track-synthetic-customers.png",
  },
];
const JUDGES: Array<{ name: string; role?: string }> = [];
const PRIZES: Array<{ place: string; detail: string }> = [];
const WINNERS: Array<{ track: string; project: string; team: string }> = [];
const SPONSORS: Array<{ name: string; tier?: string; logo?: string; wide?: boolean; dark?: boolean }> = [
  { name: "Aucctus", logo: "/logos/partner-logos/Aucctus-Full-Colour-Logo1.webp", wide: true },
  { name: "Disruptive Edge", logo: "/logos/partner-logos/Disruptive-Edge-SQ.png" },
  { name: "Pingram", logo: "/logos/partner-logos/pingram-logo.png", wide: true, dark: true },
  { name: "Google Cloud", logo: "/logos/partner-logos/google-cloud-wordmark.svg", wide: true },
  { name: "Scelta", logo: "/logos/partner-logos/WHITE_SCELTA LOGO_TM.avif", wide: true, dark: true },
];
const CLOUD_CREDITS_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScY7Tew70vDQbhljAm4Vj4KSI83Rm1sxmVaZ1NJZrQGxPTEWg/viewform?usp=header";
const CLOUD_CREDITS_CLAIM_URL = "https://trygcp.dev/claim/makerslounge";
const VENUE_MAPS_URL = "https://maps.google.com/?q=510+Front+St+W+Toronto+ON";

// Used by the live schedule highlight on demo night.
const SCHEDULE: Array<{ start: string; end: string; label: string; startUtc: string; endUtc: string }> = [
  { start: "5:30", end: "6:00", label: "Arrival", startUtc: "2026-05-26T21:30:00Z", endUtc: "2026-05-26T22:00:00Z" },
  { start: "6:00", end: "6:30", label: "Food, meet your team", startUtc: "2026-05-26T22:00:00Z", endUtc: "2026-05-26T22:30:00Z" },
  { start: "6:30", end: "7:30", label: "Live demos", startUtc: "2026-05-26T22:30:00Z", endUtc: "2026-05-26T23:30:00Z" },
  { start: "7:30", end: "8:00", label: "Judges deliberate", startUtc: "2026-05-26T23:30:00Z", endUtc: "2026-05-27T00:00:00Z" },
  { start: "8:00", end: "8:30", label: "Winners + connect", startUtc: "2026-05-27T00:00:00Z", endUtc: "2026-05-27T00:30:00Z" },
];

const SLIDE_COUNT = 24;

export default function HackathonDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(1);

  const scrollToSlide = useCallback((n: number) => {
    const target = Math.max(1, Math.min(SLIDE_COUNT, n));
    const el = document.getElementById(`slide-${target}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        scrollToSlide(currentSlide + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToSlide(currentSlide - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToSlide(1);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToSlide(SLIDE_COUNT);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlide, scrollToSlide]);

  // Track which slide is in view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slides = el.querySelectorAll<HTMLElement>("[data-slide]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = Number(entry.target.getAttribute("data-slide"));
            if (n) setCurrentSlide(n);
          }
        });
      },
      { threshold: 0.55, root: el }
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      {/* fixed scroll indicator — top left */}
      <div className="pointer-events-none fixed left-[max(1.25rem,env(safe-area-inset-left))] top-[max(1.25rem,env(safe-area-inset-top))] z-40 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">{pad2(currentSlide)}</span>
        <span className="text-foreground/30"> / </span>
        <span>{pad2(SLIDE_COUNT)}</span>
      </div>

      {/* persistent submit CTA — top right, hides on the form slide */}
      <button
        onClick={() => scrollToSlide(23)}
        className={
          "fixed right-[max(1.25rem,env(safe-area-inset-right))] top-[max(1.1rem,env(safe-area-inset-top))] z-40 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] transition-opacity " +
          (currentSlide === 23
            ? "pointer-events-none opacity-0"
            : "opacity-90 hover:opacity-100")
        }
        aria-label="Jump to submit project"
      >
        <span>Submit project</span>
        <ArrowDown className="size-3.5" />
      </button>

      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth"
      >
        <Slide n={1} title="Title">
          <SlideTitle />
        </Slide>

        {/* ── Kickoff section (May 19 · 8 PM) ── */}
        <Slide n={2} title="Kickoff: Agenda">
          <SlideKickoffAgenda />
        </Slide>
        <Slide n={3} title="Kickoff: The week">
          <SlideKickoffDebrief />
        </Slide>
        <Slide n={4} title="Kickoff: Form a team">
          <SlideKickoffTeams />
        </Slide>
        <Slide n={5} title="Kickoff: Google Cloud credits">
          <SlideKickoffCredits />
        </Slide>
        <Slide n={6} title="Kickoff: Credits tutorial">
          <SlideKickoffCreditsVideo />
        </Slide>
        <Slide n={7} title="Kickoff: Enable APIs">
          <SlideKickoffEnableApis />
        </Slide>
        <Slide n={8} title="Kickoff: Venue">
          <SlideKickoffVenue />
        </Slide>
        <Slide n={9} title="Kickoff: Itinerary">
          <SlideKickoffItinerary />
        </Slide>
        <Slide n={10} title="Tracks">
          <SlideTracks />
        </Slide>
        <Slide n={11} title="Kickoff: Judges">
          <SlideKickoffJudges />
        </Slide>
        <Slide n={12} title="Kickoff: Sponsors">
          <SlideKickoffSponsors />
        </Slide>

        {/* ── Main deck ── */}
        <Slide n={13} title="What">
          <SlideWhat />
        </Slide>
        <Slide n={14} title="How">
          <SlideHow />
        </Slide>
        <Slide n={15} title="Countdown">
          <SlideCountdown />
        </Slide>
        <Slide n={16} title="Demo night">
          <SlideSchedule />
        </Slide>
        <Slide n={17} title="Judges">
          <SlideJudges />
        </Slide>
        <Slide n={18} title="Prizes">
          <SlidePrizes />
        </Slide>
        <Slide n={19} title="Who should apply">
          <SlideWho />
        </Slide>
        <Slide n={20} title="Community">
          <SlideCommunity />
        </Slide>
        <Slide n={21} title="Code of conduct">
          <SlideConduct />
        </Slide>
        <Slide n={22} title="Find a team">
          <SlideFindTeam />
        </Slide>
        <Slide n={23} title="Submit">
          <SlideSubmit />
        </Slide>
        <Slide n={24} title="Lock in your spot">
          <SlideRsvp />
        </Slide>
      </div>
    </div>
  );
}

function Slide({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`slide-${n}`}
      data-slide={n}
      aria-label={`Slide ${n}: ${title}`}
      className="relative flex h-svh w-full snap-start flex-col justify-center overflow-y-auto px-[clamp(1.25rem,5vw,5rem)] py-[clamp(4.5rem,8vh,7rem)]"
    >
      {children}
    </section>
  );
}

function Eyebrow({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-[clamp(1.5rem,4vh,3rem)] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-foreground">{pad2(n)}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </div>
  );
}

function KickoffEyebrow({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-[clamp(1.5rem,4vh,3rem)] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-gradient-blue">Kickoff</span>
      <span className="h-px w-8 bg-border" />
      <span className="text-foreground">{pad2(n)}</span>
      <span className="h-px w-4 bg-border" />
      <span>{label}</span>
    </div>
  );
}

/* ---------- Slides ---------- */

function SlideTitle() {
  return (
    <div className="flex h-full flex-col">
      {/* Background layers — same as landing page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2a4a]/30 via-transparent to-[#1a1a2e]/20 dark:from-[#1a2a4a]/60 dark:via-transparent dark:to-[#1a1a2e]/40" />
        <div className="absolute left-1/2 top-[-20%] h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-[#3A9FF3]/10 blur-[120px] dark:bg-[#3A9FF3]/15" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-[#6AC4F7]/[0.08] blur-[100px] dark:bg-[#6AC4F7]/10" />
        <div className="grain-overlay absolute inset-0 h-full w-full" />
      </div>

      {/* Eyebrow */}
      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">No. 11</span>
        <span className="h-px w-8 bg-border" />
        <span>Toronto Tech Week</span>
      </div>

      {/* Center content */}
      <div className="relative my-auto flex flex-row items-center gap-8">
        <div className="pointer-events-none absolute -left-8 top-1/2 h-[400px] w-[500px] -translate-y-1/2 rounded-full bg-white/60 blur-[100px] dark:bg-white/[0.04]" />
        <div className="relative flex flex-col items-start gap-[clamp(1rem,3vh,2rem)] flex-1">
          <AnimatedLogo className="relative w-14 h-14 sm:w-16 sm:h-16" />
          <h1 className="relative font-sans text-[clamp(2.5rem,8vw,6rem)] font-semibold tracking-tight leading-[1.1]">
            2026{" "}
            <span className="text-gradient-blue">Innovation</span>
            <br />
            Hackathon
          </h1>
          <p className="relative max-w-[40ch] text-[clamp(1rem,1.5vw,1.25rem)] text-foreground/80 dark:text-foreground/60">
            One hundred builders. One week. Live demos at the end of it.
          </p>
        </div>
        <div className="relative hidden sm:block flex-1">
          <Image
            src="/hackathons/innovation-hackathon/Innovation (1).png"
            alt="2026 Innovation Hackathon"
            width={600}
            height={600}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative mt-auto flex flex-col gap-3 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-foreground">May 19 to May 26, 2026</span>
          <span>510 Front St W, Suite 400, Toronto</span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Kickoff slides ---------- */

function SlideKickoffAgenda() {
  const items = [
    { time: "8:00", label: "Debrief on the week" },
    { time: "8:15", label: "How to form teams" },
    { time: "8:35", label: "Google Cloud credits" },
    { time: "8:50", label: "Sponsors" },
    { time: "8:55", label: "Q&A" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <KickoffEyebrow n={1} label="Tonight's agenda" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
          The next hour.
        </h2>
        <ol className="flex flex-col">
          {items.map((item, i) => (
            <li
              key={item.label}
              className="grid grid-cols-[5rem_3rem_1fr] items-baseline gap-4 border-t border-border py-[clamp(0.65rem,1.6vh,1rem)]"
            >
              <span className="font-mono text-xs tabular-nums text-foreground">{item.time} PM</span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">{pad2(i + 1)}</span>
              <span className="font-serif text-[clamp(1.25rem,2.5vw,2rem)] tracking-tight">{item.label}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        8:00 PM · Monday May 19, 2026 · Online · ~9:00 PM wrap
      </div>
    </div>
  );
}

const KICKOFF_LUMA_URL = "https://luma.com/makerslounge11";

function SlideKickoffDebrief() {
  const timeline = [
    { date: "Mon May 19", label: "Kickoff — tracks revealed, clock starts" },
    { date: "Tue – Sat", label: "Build week — work anywhere, anytime" },
    { date: "Sun May 24", label: "Submissions close — 11:59 PM ET" },
    { date: "Tue May 26", label: "Demo night — 5:30 PM at 510 Front St W" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={2} label="The week" />
      <div className="grid items-center gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
          <h2 className="font-sans font-semibold text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
            Six days to ship.
          </h2>
          <ul className="flex flex-col">
            {timeline.map((row) => (
              <li
                key={row.date}
                className="grid grid-cols-[10rem_1fr] items-baseline gap-4 border-t border-border py-[clamp(0.65rem,1.6vh,1rem)] sm:grid-cols-[14rem_1fr]"
              >
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                  {row.date}
                </span>
                <span className="font-serif text-[clamp(1.1rem,2vw,1.75rem)] tracking-tight">
                  {row.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="max-w-[55ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            Tracks are announced tonight. Solo builders are welcome — teams of up to 5. Submit a working demo link by Sunday 11:59 PM.
          </p>
        </div>

        {/* QR code — Luma event page */}
        <div className="flex flex-col items-center gap-3 lg:items-end">
          <a
            href={KICKOFF_LUMA_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-3"
          >
            <div className="rounded-lg border border-border bg-white p-3 transition-opacity group-hover:opacity-80">
              <QRCodeSVG
                value={KICKOFF_LUMA_URL}
                size={140}
                bgColor="#ffffff"
                fgColor="#1a1a1a"
                level="M"
              />
            </div>
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              luma.com/makerslounge11
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

const FIND_TEAM_URL = "https://makerslounge.ca/hackathons/2026-innovation-hackathon/find-team";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.1.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function SlideKickoffTeams() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={3} label="Form a team" />
      <div className="grid items-center gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-[1fr_auto]">

        {/* Left: title + steps */}
        <div className="flex flex-col gap-[clamp(1.25rem,3vh,2.5rem)]">
          <div className="flex flex-col gap-3">
            <h2 className="font-sans font-semibold text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
              How to form teams.
            </h2>
            <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Teams of 1–5. Pick your track, find collaborators, and start building tonight.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { step: "01", title: "Join the Discord", body: "Head to #hackathon-teams. Introduce yourself, share your skills, and find people to build with.", href: DISCORD_URL },
              { step: "02", title: "Use Find-a-Team", body: "Answer a few questions about what you do and what kind of team you want. We'll match you by tomorrow.", href: FIND_TEAM_URL },
              { step: "03", title: "Lock your team tonight", body: "Decide on your track and team before the kickoff ends.", href: null },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.step}</span>
                {s.href ? (
                  <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-serif text-[clamp(1.1rem,2vw,1.6rem)] tracking-tight hover:opacity-70 transition-opacity">
                    {s.title} <ArrowUpRight className="size-4 shrink-0" />
                  </a>
                ) : (
                  <h3 className="font-serif text-[clamp(1.1rem,2vw,1.6rem)] tracking-tight">{s.title}</h3>
                )}
                <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: two QR codes */}
        <div className="flex flex-row gap-4 lg:flex-col">
          {/* Discord */}
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative rounded-lg border border-border bg-white p-3 transition-opacity group-hover:opacity-80">
              <QRCodeSVG value={DISCORD_URL} size={120} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-[#5865F2]">
                <DiscordIcon className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              Join Discord
            </span>
          </a>

          {/* Find-a-Team */}
          <a
            href={FIND_TEAM_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="relative rounded-lg border border-border bg-white p-3 transition-opacity group-hover:opacity-80">
              <QRCodeSVG value={FIND_TEAM_URL} size={120} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
            </div>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              Find a Team
            </span>
          </a>
        </div>

      </div>
    </div>
  );
}

function SlideKickoffCredits() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={4} label="Google Cloud credits" />
      <div className="grid items-center gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
          <div className="flex flex-col gap-4">
            <h2 className="font-sans font-semibold text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
              Free cloud credits.
            </h2>
            <Image
              src="/logos/partner-logos/google-cloud-wordmark.svg"
              alt="Google Cloud"
              width={180}
              height={36}
              className="object-contain"
            />
          </div>
          <p className="max-w-[50ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Every registered builder gets Google Cloud credits to use during the hackathon. Submit the Gmail address you want the credits added to.
          </p>
          <div className="flex flex-col gap-4">
            {[
              { step: "01", body: "Scan the left QR — submit the Gmail you want credits on. One response per person." },
              { step: "02", body: "Scan the right QR — go to trygcp.dev/claim/makerslounge to redeem directly." },
              { step: "03", body: "Credits will be applied before build week starts." },
            ].map((s) => (
              <div key={s.step} className="flex items-baseline gap-4 border-t border-border pt-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.step}</span>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two QR codes */}
        <div className="flex flex-row gap-4 lg:flex-col">
          <a
            href={CLOUD_CREDITS_FORM_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="rounded-lg border border-border bg-white p-3 transition-opacity group-hover:opacity-80">
              <QRCodeSVG value={CLOUD_CREDITS_FORM_URL} size={120} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
            </div>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              Submit Gmail
            </span>
          </a>
          <a
            href={CLOUD_CREDITS_CLAIM_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-2"
          >
            <div className="rounded-lg border border-border bg-white p-3 transition-opacity group-hover:opacity-80">
              <QRCodeSVG value={CLOUD_CREDITS_CLAIM_URL} size={120} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
            </div>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
              Claim Credits
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function SlideKickoffEnableApis() {
  const steps = [
    { src: "/hackathons/innovation-hackathon/enable-apis.png", alt: "Enable Google Cloud APIs" },
    { src: "/hackathons/innovation-hackathon/enable-apis-2.png", alt: "API key setup" },
    { src: "/hackathons/innovation-hackathon/enable-apis-3.png", alt: "API key configuration" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={4} label="Enable APIs" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
          Enable your APIs.
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
          {steps.map((s) => (
            <div key={s.src} className="shrink-0 w-[80%] snap-start overflow-hidden rounded-lg border border-border">
              <Image
                src={s.src}
                alt={s.alt}
                width={1600}
                height={900}
                className="w-full h-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideKickoffCreditsVideo() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={4} label="Credits walkthrough" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
          How to claim, step by step.
        </h2>
        <video
          src="/hackathons/innovation-hackathon/Obtain%20Credits.mp4"
          controls
          playsInline
          preload="metadata"
          className="w-full max-h-[55vh] rounded-lg border border-border bg-black object-contain"
        />
      </div>
    </div>
  );
}

function VenueRightCol({ mapsUrl }: { mapsUrl: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col items-center gap-4">
        {/* Map embed */}
        <div className="w-full max-w-lg overflow-hidden rounded-lg border border-border lg:w-[576px]">
          <iframe
            title="Demo night venue"
            src="https://maps.google.com/maps?q=510+Front+St+W+Toronto+ON&output=embed&z=16"
            width="100%"
            height="440"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block"
          />
        </div>

        {/* Thumbnail row */}
        <div className="flex w-full max-w-xs items-center gap-3 lg:w-72">
          <button
            onClick={() => setOpen(true)}
            className="group relative h-14 w-20 shrink-0 overflow-hidden rounded border border-border transition-opacity hover:opacity-80"
            aria-label="Expand venue photo"
          >
            <Image
              src="/hackathons/innovation-hackathon/aucctus-hq.png"
              alt="510 Front St W — front entrance"
              fill
              className="object-cover"
            />
          </button>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-muted-foreground leading-relaxed">
            Front entrance<br />510 Front St W
          </span>
        </div>

        {/* QR */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col items-center gap-2"
        >
          <div className="rounded-lg border border-border bg-white p-3 transition-opacity group-hover:opacity-80">
            <QRCodeSVG value={mapsUrl} size={100} bgColor="#ffffff" fgColor="#1a1a1a" level="M" />
          </div>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
            Get directions
          </span>
        </a>
      </div>

      {/* Lightbox */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm"
          aria-label="Close photo"
        >
          <div className="relative max-h-[85vh] max-w-2xl w-full overflow-hidden rounded-xl border border-white/10 shadow-2xl">
            <Image
              src="/hackathons/innovation-hackathon/aucctus-hq.png"
              alt="510 Front St W — front entrance"
              width={800}
              height={900}
              className="block w-full object-cover"
            />
          </div>
        </button>
      )}
    </>
  );
}

function SlideKickoffVenue() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={5} label="Demo night venue" />
      <div className="grid items-center gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-[1fr_auto]">

        {/* Left: address + tips + QR */}
        <div className="flex flex-col gap-[clamp(1.25rem,3vh,2.5rem)]">
          <div className="flex flex-col gap-3">
            <h2 className="font-sans font-semibold text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
              The Venue.
            </h2>
            <p className="font-mono text-sm uppercase tracking-[0.12em] text-foreground">
              510 Front St W, Suite 400
              <br />
              Toronto, ON · Tue May 26
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { step: "01", body: "Enter through the main lobby on Front St W. Take the elevator to the 4th floor." },
              { step: "02", body: "Doors open at 5:30 PM. Food available. Demos start at 6:30 PM sharp." },
              { step: "03", body: "Closest transit: Union Station (15 min walk west) or King streetcar (504)." },
            ].map((s) => (
              <div key={s.step} className="flex items-baseline gap-4 border-t border-border pt-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{s.step}</span>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{s.body}</p>
              </div>
            ))}
          </div>
          <a
            href={VENUE_MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 border-b border-foreground pb-1 font-mono text-xs uppercase tracking-[0.18em] text-foreground hover:opacity-70 transition-opacity"
          >
            Open in Google Maps <ArrowUpRight className="size-3.5" />
          </a>
        </div>

        {/* Right: map + thumbnail + QR */}
        <VenueRightCol mapsUrl={VENUE_MAPS_URL} />

      </div>
    </div>
  );
}

function SlideKickoffItinerary() {
  const items = [
    { time: "5:30 PM", label: "Doors open" },
    { time: "5:30 PM", label: "Food and drinks available" },
    { time: "6:30 PM", label: "Demos kick off" },
    { time: "7:30 PM", label: "Demos complete" },
    { time: "7:30 PM", label: "Judges deliberate" },
    { time: "8:00 PM", label: "Winners announced" },
    { time: "8:30 PM", label: "Event wraps up" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={5} label="Demo night" />
      <div className="grid items-center gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-[1fr_auto]">
        <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
          <h2 className="font-sans font-semibold text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
            The night.
          </h2>
          <div className="flex flex-col">
            {items.map((item, i) => (
              <div key={i} className="flex items-baseline gap-6 border-t border-border py-3">
                <span className="w-20 shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{item.time}</span>
                <span className="text-base sm:text-lg">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex flex-col gap-3 w-72">
          <div className="overflow-hidden rounded-lg border border-border">
            <Image
              src="/hackathons/innovation-hackathon/hackathon-image-gen.png"
              alt="Hackathon venue"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <Image
              src="/hackathons/innovation-hackathon/hacakthon-image-gen-2.png"
              alt="Live demos"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideKickoffJudges() {
  const judges = [
    { name: "CIBC", logo: "/logos/partner-logos/CIBC-logo.png" },
    { name: "EllisDon", logo: "/logos/partner-logos/ellis-don-logo.png" },
    { name: "TTC", logo: "/logos/partner-logos/ttc-logo.png" },
    { name: "Google", logo: "/logos/partner-logos/google-cloud-wordmark.svg" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={6} label="Judges" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <div className="flex flex-col gap-3">
          <h2 className="font-sans font-semibold text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
            Our judges.
          </h2>
          <p className="max-w-[50ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Judges from some of the largest enterprises in Canada and globally.
          </p>
        </div>
        <ul className="flex flex-wrap justify-center gap-4">
          {judges.map((j) => (
            <li key={j.name}>
              <div className="flex items-center justify-center rounded-lg border border-border bg-white p-5 w-52 h-24">
                <Image
                  src={j.logo}
                  alt={j.name}
                  width={180}
                  height={64}
                  className="max-h-12 w-auto object-contain"
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-center font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
          And others.
        </p>
      </div>
    </div>
  );
}

function SlideKickoffSponsors() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <KickoffEyebrow n={6} label="Sponsors" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
          Our sponsors.
        </h2>
        {SPONSORS.length === 0 ? (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Announced at kickoff.
          </p>
        ) : (
          <ul className="flex flex-wrap justify-center gap-4">
            {SPONSORS.map((s) => (
              <li key={s.name} className="flex flex-col items-center gap-2">
                <div className={`flex items-center justify-center rounded-lg border border-border p-5 w-52 h-24 ${s.dark ? "bg-black" : "bg-white"}`}>
                  {s.logo ? (
                    <Image
                      src={s.logo}
                      alt={s.name}
                      width={180}
                      height={64}
                      className="max-h-12 w-auto object-contain"
                    />
                  ) : (
                    <span className="font-serif text-lg tracking-tight text-black">{s.name}</span>
                  )}
                </div>
                {s.tier && (
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">{s.tier}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ---------- Main deck slides ---------- */

function SlideWhat() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={1} label="What" />
      <div className="flex flex-col justify-center gap-[clamp(1rem,3vh,2.5rem)]">
        <h2 className="max-w-[18ch] font-serif text-[clamp(2.5rem,8.5vw,8rem)] leading-[0.95] tracking-tight">
          Toronto's biggest innovation hackathon.
        </h2>
        <p className="max-w-[55ch] text-[clamp(1.05rem,1.6vw,1.6rem)] text-muted-foreground">
          We're bringing 100 of the best AI builders in the city together to compete across multiple challenge tracks, with industry leaders judging live.
        </p>
      </div>
      <StatRow
        items={[
          { value: "100", label: "Builders" },
          { value: "01", label: "Week" },
          { value: "Live", label: "Demos" },
        ]}
      />
    </div>
  );
}

function SlideHow() {
  const parts = [
    {
      tag: "Part 1",
      title: "Kickoff Night",
      when: "Mon May 19, 8:00 PM",
      where: "Online",
      body: "Challenge tracks are revealed, teams form, the clock starts. Solo builders are welcome.",
    },
    {
      tag: "Part 2",
      title: "Build week",
      when: "May 19 to May 24",
      where: "Anywhere",
      body: "Six days to build something real. Submit by Sunday May 24, 11:59 PM.",
    },
    {
      tag: "Part 3",
      title: "Demo night",
      when: "Tue May 26, 5:30 PM",
      where: "510 Front St W, Suite 400",
      body: "Come back and present what you built. Judges evaluate live. Winners announced on the night.",
    },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={2} label="How it works" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Three parts.
        </h2>
        <ol className="grid gap-[clamp(1.25rem,3vh,2rem)] lg:grid-cols-3 lg:gap-[clamp(2rem,3vw,3rem)]">
          {parts.map((p) => (
            <li key={p.title} className="flex flex-col gap-3 border-t border-border pt-4">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {p.tag}
              </span>
              <h3 className="font-serif text-[clamp(1.5rem,3vw,2.75rem)] leading-tight tracking-tight">
                {p.title}
              </h3>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                {p.when} · {p.where}
              </p>
              <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                {p.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SlideCountdown() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={3} label="Countdown" />
      <div className="flex flex-col justify-center">
        <Countdown />
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        All times Eastern.
      </div>
    </div>
  );
}

function SlideSchedule() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={4} label="Demo night" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Tuesday <span className="text-muted-foreground">May 26.</span>
        </h2>
        <ul className="flex flex-col">
          {SCHEDULE.map((row) => {
            const start = new Date(row.startUtc).getTime();
            const end = new Date(row.endUtc).getTime();
            const live = now >= start && now < end;
            return (
              <li
                key={row.start}
                className={
                  "grid grid-cols-[7rem_1fr_auto] items-baseline gap-4 border-t border-border py-[clamp(0.65rem,1.6vh,1.1rem)] sm:grid-cols-[10rem_1fr_auto] " +
                  (live ? "text-foreground" : "")
                }
              >
                <span className="font-mono text-[clamp(0.85rem,1.4vw,1.1rem)] tabular-nums text-foreground">
                  {row.start} PM
                </span>
                <span className="font-serif text-[clamp(1.25rem,2.5vw,2.25rem)] tracking-tight">
                  {row.label}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {live ? (
                    <span className="inline-flex items-center gap-2 text-primary">
                      <span className="relative inline-flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      Now
                    </span>
                  ) : (
                    `to ${row.end} PM`
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SlideTracks() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={5} label="Challenge tracks" />
      <div className="flex flex-col justify-center gap-[clamp(1rem,2.5vh,2rem)]">
        <h2 className="font-serif text-[clamp(2rem,5vw,4.5rem)] leading-[0.95] tracking-tight">
          Pick a track. Ship in a week.
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {TRACKS.map((t, i) => (
            <div key={t.name} className="flex flex-col gap-3 border-t-2 border-foreground pt-4">
              <div className="overflow-hidden rounded-lg border border-border">
                <Image
                  src={t.image}
                  alt={t.name}
                  width={800}
                  height={450}
                  className="w-full h-32 object-cover"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{pad2(i + 1)}</span>
                <h3 className="font-sans font-semibold text-base leading-tight">{t.name}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.description}</p>
              <div className="mt-auto pt-3 border-t border-border">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground mb-2">Judging criteria</p>
                <ul className="flex flex-col gap-1">
                  {t.criteria.map((c) => (
                    <li key={c} className="flex items-baseline gap-2 text-xs text-muted-foreground">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideJudges() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={6} label="Judges" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="max-w-[20ch] font-serif text-[clamp(2.5rem,7.5vw,6.5rem)] leading-[0.95] tracking-tight">
          People who ship, judging live.
        </h2>
        {JUDGES.length === 0 ? (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Announced in the weeks before May 26.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JUDGES.map((j) => (
              <li key={j.name} className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="font-serif text-[clamp(1.25rem,2vw,1.75rem)] tracking-tight">
                  {j.name}
                </span>
                {j.role && (
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {j.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SlidePrizes() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={7} label="Prizes" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.9] tracking-tight">
          Prizes.
        </h2>
        {PRIZES.length === 0 ? (
          <p className="max-w-[40ch] font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Announced in the weeks before May 26. Bragging rights are guaranteed.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {PRIZES.map((p) => (
              <li
                key={p.place}
                className="grid grid-cols-[6rem_1fr] items-baseline gap-4 border-t border-border pt-3 sm:grid-cols-[10rem_1fr]"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                  {p.place}
                </span>
                <span className="font-serif text-[clamp(1.25rem,2.5vw,2rem)] tracking-tight">
                  {p.detail}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SlideWho() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={8} label="Who should apply" />
      <div className="grid items-center gap-[clamp(2rem,5vw,5rem)] md:grid-cols-2">
        <div className="flex flex-col gap-4 border-t border-foreground pt-5">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
            Builders
          </span>
          <h3 className="font-serif text-[clamp(2rem,5vw,4rem)] leading-tight tracking-tight">
            Founders, engineers, designers, makers.
          </h3>
          <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Hands-on AI experience. Able to ship something real in a week. Solo or in a team. Spots are strictly limited to 100.
          </p>
        </div>
        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Judges
          </span>
          <h3 className="font-serif text-[clamp(2rem,5vw,4rem)] leading-tight tracking-tight text-muted-foreground">
            Industry leaders and innovators.
          </h3>
          <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            We reach out directly. If you'd like to nominate someone, message us in the Discord.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideCommunity() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={9} label="Community" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[20ch] font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Find your team in the Discord.
        </h2>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 border-b border-foreground pb-1 font-mono text-sm uppercase tracking-[0.18em] text-foreground hover:opacity-80"
        >
          {DISCORD_URL.replace("https://", "")} <ArrowUpRight className="size-4" />
        </a>
        <div className="mt-[clamp(1.5rem,4vh,2.5rem)] grid gap-6 border-t border-border pt-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Community partner
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              The AI Collective is a global non-profit uniting 150,000+ leaders, builders, and stakeholders. Participating as a community partner only.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Featured in
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Toronto Tech Week 2026, May 25 to 29. A citywide celebration of the people building what's next, with hundreds of community-led events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideConduct() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={10} label="Code of conduct" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="max-w-[22ch] font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
          Build kindly. Ship boldly. Credit fully.
        </h2>
        <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          Attendees and organizers at events affiliated with The AI Collective agree to its code of conduct. Be the room you want to be in.
        </p>
      </div>
    </div>
  );
}

function SlideFindTeam() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={11} label="Find a team" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[16ch] font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.92] tracking-tight">
          Solo? Find a team.
        </h2>
        <p className="max-w-[55ch] text-base text-muted-foreground sm:text-lg">
          Drop your name, your background, and what you want in a teammate. We&apos;ll match you with other solo builders before kickoff.
        </p>
        <Link
          href="/hackathons/2026-innovation-hackathon/find-team"
          className="inline-flex w-fit items-center gap-2.5 bg-foreground px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background hover:opacity-90"
        >
          Get matched <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">makerslounge.ca / hackathons / 2026-innovation-hackathon / find-team</span>
      </div>
    </div>
  );
}

function SlideSubmit() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] overflow-y-auto">
      <Eyebrow n={12} label="Submit" />
      <div className="flex flex-col gap-[clamp(1.25rem,3vh,2.25rem)] pb-[clamp(2rem,6vh,4rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
          Submit your project.
        </h2>
        <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          One link is all that's required. Add a title, a description, a video, files, your team, whatever helps judges understand what you built.
        </p>
        <div className="mt-[clamp(1rem,2vh,1.5rem)]">
          <SubmissionForm />
        </div>
      </div>
    </div>
  );
}

function SlideRsvp() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={13} label="Join us" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[18ch] font-serif text-[clamp(3rem,11vw,10rem)] leading-[0.92] tracking-tight">
          Lock in your spot.
        </h2>
        <p className="max-w-[55ch] text-base text-muted-foreground sm:text-lg">
          100 spots. First come, host approval required. If you don't get in this time, keep applying.
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-foreground">
          <span>#MakerMondays</span>
          <span>#MakersLounge</span>
          <span>#TorontoTechWeek</span>
          <span>#BuildInPublic</span>
        </div>
        <span>makerslounge.ca / hackathons / 2026-innovation-hackathon</span>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function StatRow({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <div className="grid grid-cols-3 border-t border-border pt-5">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <span className="font-serif text-[clamp(2rem,5vw,4.5rem)] leading-none tracking-tight">
            {s.value}
          </span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
