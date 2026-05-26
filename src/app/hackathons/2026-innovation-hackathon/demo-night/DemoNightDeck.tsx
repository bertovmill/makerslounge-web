"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Linkedin, Info, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

type TrackCriterion = { label: string; weight: number; description: string };
const TRACKS: Array<{ name: string; description: string; image: string; criteria: TrackCriterion[] }> = [
  {
    name: "Validating a Business Idea",
    description: "Innovation teams collect thousands of ideas every year, far more than they can evaluate. Build an AI agent or tool that streamlines the innovation pipeline from raw idea to commercialized product.",
    image: "/hackathons/innovation-hackathon/track-idea-validation-art.png",
    criteria: [
      { label: "End-to-end pipeline coverage", weight: 25, description: "Handles the full journey from idea intake through evaluation, prioritization, and output — not just one step of the funnel." },
      { label: "Quality of scoring / triage logic", weight: 35, description: "The AI's ranking methodology is defensible, consistent, and meaningfully better than gut-feel. Handles nuanced, similar ideas differently." },
      { label: "Speed & scalability over manual review", weight: 25, description: "Demonstrates a credible reduction in time or cost vs. a human team reviewing the same volume of ideas." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
  {
    name: "Continuous Market Monitoring",
    description: "The business landscape is changing fast, and separating signal from noise has become critical. Build an agentic AI tool or platform that continuously monitors the market for signals relevant to a company's innovation function.",
    image: "/hackathons/innovation-hackathon/track-market-monitoring-art.png",
    criteria: [
      { label: "Signal relevance & accuracy", weight: 35, description: "Surfaces signals genuinely useful to an innovation team — not just news summaries. Filters noise and avoids false positives." },
      { label: "Real-time or near-real-time capability", weight: 25, description: "Data freshness matters. The platform detects and surfaces new signals quickly; latency is minimized and made transparent." },
      { label: "Actionability of insights surfaced", weight: 25, description: "Insights are specific enough to act on. Not just 'AI is growing' — but what an innovation team should do differently because of it." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
  {
    name: "Synthetic Customers",
    description: "Real customer studies are slow, expensive, and often fail to surface what customers actually want. Build an AI tool or platform that simulates synthetic customer feedback on new product ideas.",
    image: "/hackathons/innovation-hackathon/track-synthetic-customers-art.png",
    criteria: [
      { label: "Fidelity of synthetic feedback", weight: 35, description: "Simulated customers behave and respond like real market segments. Feedback is nuanced, not generic — accounts for edge cases and varied personas." },
      { label: "Non-obvious insight generation", weight: 25, description: "Surfaces things traditional surveys often miss: minority opinions, contradictions between stated and revealed preferences, unexpected objections." },
      { label: "Time & cost savings vs. real research", weight: 25, description: "Makes a credible case for replacing or meaningfully augmenting traditional customer research — speed, cost, or breadth of coverage." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
];

interface Finalist {
  id: string;
  title: string | null;
  team_name: string | null;
  challenge_track: string | null;
  description: string | null;
}
const WINNERS: Array<{ track: string; project: string; team: string }> = [];
const JUDGES: Array<{ name: string; title: string; company: string; photo?: string; companyLogo?: string }> = [
  { name: "James Maeng", title: "Senior Director, Enterprise Innovation", company: "CIBC", photo: "/hackathons/innovation-hackathon/judges/james-maeng.png", companyLogo: "/hackathons/innovation-hackathon/judges/logo-cibc.png" },
  { name: "Naina Dewan", title: "Manager, New Technology & Innovation", company: "TTC", photo: "/hackathons/innovation-hackathon/judges/naina-dewan.png", companyLogo: "/hackathons/innovation-hackathon/judges/logo-ttc.png" },
  { name: "Rishi Midha", title: "AI Program Manager", company: "EllisDon", photo: "/hackathons/innovation-hackathon/judges/rishi-midha.png", companyLogo: "/hackathons/innovation-hackathon/judges/logo-ellisdon.png" },
  { name: "Dave Jani", title: "Director, Innovation & Technology Enablement", company: "Chartwell Retirement Residences", photo: "/hackathons/innovation-hackathon/judges/dave-jani.png", companyLogo: "/hackathons/innovation-hackathon/judges/logo-chartwell.png" },
  { name: "Ashish DSa", title: "Chief Technology Officer", company: "Arbor", photo: "/hackathons/innovation-hackathon/judges/ashish-dsa.png", companyLogo: "/hackathons/innovation-hackathon/judges/logo-arbor.png" },
];
type TeamMember = { name: string; photo?: string; linkedin?: string };
const FINALIST_TEAMS: Record<string, TeamMember[]> = {
  "snoop.ai": [
    { name: "Vraj Patel", photo: "/hackathons/innovation-hackathon/teams/snoop-ai/vraj-patel.png", linkedin: "https://www.linkedin.com/in/vrajpatel13/" },
    { name: "Malko-Bani Somo", photo: "/hackathons/innovation-hackathon/teams/snoop-ai/malko-bani-somo.png", linkedin: "https://www.linkedin.com/in/malko-bani-somo-a78763221/" },
    { name: "Ha Nguyen", photo: "/hackathons/innovation-hackathon/teams/snoop-ai/ha-nguyen.png", linkedin: "https://www.linkedin.com/in/nguyen-thanh-ha-cs/" },
  ],
  "cascade": [
    { name: "Mansi K.", photo: "/hackathons/innovation-hackathon/teams/cascade-ai/mansi-k.png", linkedin: "https://www.linkedin.com/in/mansi-k-7aa4621b5/" },
    { name: "Alexandra R.", photo: "/hackathons/innovation-hackathon/teams/cascade-ai/alexandra-r.png", linkedin: "https://www.linkedin.com/in/alexandra-roszczenko/" },
  ],
  "doppel": [
    { name: "Trisha Duno", photo: "/hackathons/innovation-hackathon/teams/doppel/trisha-duno.png", linkedin: "https://www.linkedin.com/in/trisha-duno/" },
    { name: "Dhanush Chandar Sivakumar", photo: "/hackathons/innovation-hackathon/teams/doppel/dhanush-chandar-sivakumar.png", linkedin: "https://www.linkedin.com/in/dhanush-chandar-sivakumar/" },
  ],
  "forgeos": [
    { name: "Kylie Vincent", photo: "/hackathons/innovation-hackathon/teams/forgeos/kylie-vincent.png", linkedin: "https://www.linkedin.com/in/kylie-vincent905/" },
  ],
  "idea forge": [
    { name: "Karan Aggarwal", photo: "/hackathons/innovation-hackathon/teams/idea-forge/karan-aggarwal.png", linkedin: "https://www.linkedin.com/in/karanagg262/" },
    { name: "Behzad Janjua", photo: "/hackathons/innovation-hackathon/teams/idea-forge/behzad-janjua.png", linkedin: "https://www.linkedin.com/in/behzad-janjua/" },
    { name: "Prakash Raaj Vasudevan", photo: "/hackathons/innovation-hackathon/teams/idea-forge/prakash-raaj-vasudevan.png", linkedin: "https://www.linkedin.com/in/prakash-raaj-vasudevan/" },
  ],
  "overton": [
    { name: "Damon Deng", photo: "/hackathons/innovation-hackathon/teams/overton/damon-deng.png", linkedin: "https://www.linkedin.com/in/damondeng/" },
  ],
  "vito agent": [
    { name: "Alexander Galea", photo: "/hackathons/innovation-hackathon/teams/vito-agent/alexander-galea.png", linkedin: "https://www.linkedin.com/in/alexandergalea/" },
    { name: "Harish Kukreja", photo: "/hackathons/innovation-hackathon/teams/vito-agent/harish-kukreja.png", linkedin: "https://www.linkedin.com/in/harish-kukreja/" },
    { name: "Arash Nouri", photo: "/hackathons/innovation-hackathon/teams/vito-agent/arash-nouri.png", linkedin: "https://www.linkedin.com/in/arashnouri95/" },
  ],
};

const BONUS_TEAMS: Record<string, TeamMember[]> = {
  "auctopus": [],
  "samm": [],
};

const STATS: { participants: number; projectsSubmitted: number; teams: number } | null = null;

const SLIDE_COUNT = 17;

const SLIDE_INDEX: Array<{ n: number; title: string }> = [
  { n: 1, title: "Opening" },
  { n: 2, title: "Event Overview" },
  { n: 3, title: "About Us" },
  { n: 4, title: "Sponsors" },
  { n: 5, title: "Judges" },
  { n: 6, title: "Tracks" },
  { n: 7, title: "Demo 01" },
  { n: 8, title: "Demo 02" },
  { n: 9, title: "Demo 03" },
  { n: 10, title: "Demo 04" },
  { n: 11, title: "Demo 05" },
  { n: 12, title: "Demo 06" },
  { n: 13, title: "Demo 07" },
  { n: 14, title: "Bonus 01" },
  { n: 15, title: "Bonus 02" },
  { n: 16, title: "Winners" },
  { n: 17, title: "Thank You" },
];

const DEMO_SLOT_COUNT = 7;
const BONUS_SLOT_COUNT = 2;

export default function DemoNightDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [finalists, setFinalists] = useState<Finalist[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("hackathon_submissions")
        .select("id, title, team_name, challenge_track, description")
        .eq("is_finalist", true)
        .order("title");
      if (!cancelled && data) {
        const sorted = [...(data as Finalist[])].sort((a, b) => {
          const aIsSnoop = (a.title ?? "").toLowerCase().includes("snoop");
          const bIsSnoop = (b.title ?? "").toLowerCase().includes("snoop");
          if (aIsSnoop && !bIsSnoop) return -1;
          if (bIsSnoop && !aIsSnoop) return 1;
          return 0;
        });
        setFinalists(sorted);
      }
    };
    load();
    const interval = setInterval(load, 8000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const scrollToSlide = useCallback((n: number) => {
    const target = Math.max(1, Math.min(SLIDE_COUNT, n));
    const el = document.getElementById(`dn-slide-${target}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // On mount: scroll to slide indicated by hash
  useEffect(() => {
    const match = window.location.hash.match(/^#slide-(\d+)$/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= 1 && n <= SLIDE_COUNT) {
        requestAnimationFrame(() => scrollToSlide(n));
      }
    }
  }, [scrollToSlide]);

  // Keep hash in sync as slide changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.hash = `slide-${currentSlide}`;
    window.history.replaceState(null, "", url.toString());
  }, [currentSlide]);

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
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      {/* Left sidebar – slide index */}
      <aside className="flex h-full w-48 shrink-0 flex-col overflow-hidden border-r border-border/40 bg-background/60 backdrop-blur-md">
        <div className="border-b border-border/30 px-4 py-3">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Index</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {SLIDE_INDEX.map(({ n, title }) => (
            <button
              key={n}
              onClick={() => scrollToSlide(n)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-foreground/5",
                currentSlide === n && "bg-foreground/[0.06]"
              )}
            >
              <span
                className={cn(
                  "shrink-0 font-mono text-[0.6rem] tabular-nums",
                  currentSlide === n ? "text-foreground" : "text-muted-foreground/40"
                )}
              >
                {n.toString().padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "font-sans text-[0.75rem] leading-snug",
                  currentSlide === n ? "text-gradient font-medium" : "text-muted-foreground"
                )}
              >
                {title}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <div className="relative flex-1 overflow-hidden">
        {/* top-left: counter + back link */}
        <div className="absolute left-5 top-5 z-40 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="pointer-events-none">
            <span className="text-foreground">{pad2(currentSlide)}</span>
            <span className="text-foreground/30"> / </span>
            <span>{pad2(SLIDE_COUNT)}</span>
          </span>
          <span className="text-foreground/20">·</span>
          <Link
            href="/hackathons/2026-innovation-hackathon"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3" />
            Main deck
          </Link>
        </div>

        {/* top-right: section label */}
        <div className="pointer-events-none absolute right-5 top-5 z-40 font-mono text-xs uppercase tracking-[0.18em]">
          <span className="text-gradient">Demo Night</span>
        </div>

        <div
          ref={containerRef}
          className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth"
        >
          <Slide n={1} title="Opening">
            <SlideDemoNightOpener />
          </Slide>
          <Slide n={2} title="Event Overview">
            <SlideEventOverview />
          </Slide>
          <Slide n={3} title="What is MakersLounge">
            <SlideWhatIsMakersLounge />
          </Slide>
          <Slide n={4} title="Sponsors">
            <SlideSponsors />
          </Slide>
          <Slide n={5} title="Judges">
            <SlideJudges />
          </Slide>
          <Slide n={6} title="Judging criteria">
            <SlideJudgingCriteria />
          </Slide>
          {Array.from({ length: DEMO_SLOT_COUNT }, (_, i) => finalists[i] ?? null).map((finalist, i) => (
            <Slide key={i} n={7 + i} title={`Demo ${pad2(i + 1)}`}>
              <SlideDemoPresentation finalist={finalist} index={i} slideN={7 + i} />
            </Slide>
          ))}
          {Array.from({ length: BONUS_SLOT_COUNT }, (_, i) => i).map((i) => (
            <Slide key={`bonus-${i}`} n={14 + i} title={`Bonus Demo ${pad2(i + 1)}`}>
              <SlideBonusPresentation index={i} slideN={14 + i} />
            </Slide>
          ))}
          <Slide n={16} title="Winners">
            <SlideWinners />
          </Slide>
          <Slide n={17} title="Thank you">
            <SlideThankYou />
          </Slide>
        </div>
      </div>
    </div>
  );
}

function Slide({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section
      id={`dn-slide-${n}`}
      data-slide={n}
      aria-label={`Slide ${n}: ${title}`}
      className="relative flex h-svh w-full snap-start flex-col justify-center overflow-y-auto px-[clamp(1.25rem,5vw,5rem)] py-[clamp(4.5rem,8vh,7rem)]"
    >
      {children}
    </section>
  );
}

/* ---------- Slides ---------- */

function SlideDemoNightOpener() {
  return (
    <div className="absolute inset-0">
      <Image
        src="/hackathons/innovation-hackathon/demo-night-banner.png"
        alt="2026 Innovation Hackathon — Demo Night"
        fill
        className="object-cover object-center"
        priority
      />
    </div>
  );
}

function SlideBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a4a]/25 via-transparent to-[#1a1a2e]/15 dark:from-[#1a2a4a]/55 dark:via-transparent dark:to-[#1a1a2e]/35" />
      <div className="absolute left-1/2 top-[-15%] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#3A9FF3]/10 blur-[130px] dark:bg-[#3A9FF3]/18" />
      <div className="absolute bottom-[-5%] right-[-8%] h-[450px] w-[450px] rounded-full bg-primary/[0.07] blur-[110px]" />
      <div className="grain-overlay absolute inset-0 h-full w-full" />
    </div>
  );
}

function SlideEventOverview() {
  const stats = [
    { value: "150+", label: "Sign-ups" },
    { value: "120", label: "Participants" },
    { value: "30", label: "Team submissions" },
  ];
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />
      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(2)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Event overview</span>
      </div>

      <div className="relative my-auto flex flex-col gap-[clamp(2rem,5vh,4rem)]">
        <div className="flex flex-col gap-[clamp(0.75rem,2vh,1.5rem)]">
          <h2 className="font-sans font-semibold text-[clamp(2.75rem,8vw,6.5rem)] leading-[1.0] tracking-tight">
            The <span className="text-gradient">hackathon</span><br />by the numbers.
          </h2>
          <p className="font-sans text-[clamp(1.1rem,1.8vw,1.45rem)] leading-relaxed text-foreground/70 max-w-2xl">
            Starting last Tuesday, builders from across Toronto came together to tackle three enterprise innovation challenges — and the results speak for themselves.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-[clamp(1rem,3vw,2.5rem)] max-w-3xl">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="flex flex-col gap-2 rounded-2xl border border-border/50 bg-background/40 px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(1.25rem,2.5vh,2rem)] backdrop-blur-sm"
            >
              <span className="font-sans font-semibold text-[clamp(2.5rem,6vw,5rem)] leading-none tracking-tight text-gradient">
                {value}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SlideWhatIsMakersLounge() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(3)}</span>
        <span className="h-px w-4 bg-border" />
        <span>About us</span>
      </div>

      <div className="relative my-auto flex flex-row items-center gap-[clamp(2rem,5vw,5rem)]">
        {/* Left */}
        <div className="flex flex-1 flex-col gap-[clamp(1.25rem,3vh,2.5rem)]">
          <h2 className="font-sans font-semibold text-[clamp(2.75rem,8vw,6.5rem)] leading-[1.0] tracking-tight">
            What is <span className="text-gradient">MakersLounge?</span>
          </h2>
          <div className="flex flex-col gap-[clamp(0.75rem,1.5vh,1.25rem)] max-w-xl">
            <p className="font-sans text-[clamp(1.2rem,2vw,1.6rem)] leading-relaxed text-foreground/80">
              MakersLounge is a community of <span className="font-semibold text-foreground">1000+ builders</span>, mostly based in Toronto — people who turn ideas into real things.
            </p>
            <p className="font-sans text-[clamp(1.2rem,2vw,1.6rem)] leading-relaxed text-muted-foreground">
              We host multiple events every month — hackathons, builder meetups, special presentations, and more — all with one rule: no talks, no pitches, just makers building and shipping together.
            </p>
            <p className="font-sans text-[clamp(1.2rem,2vw,1.6rem)] leading-relaxed text-foreground/80">
              Our mission is to help <span className="font-semibold text-foreground">AI builders</span> connect and scale their services to the world.
            </p>
          </div>
          <div className="mt-[clamp(0.5rem,1.5vh,1rem)] inline-flex w-fit items-center gap-3 rounded-full border border-border/60 bg-background/40 px-5 py-2 backdrop-blur-sm">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-gradient">Build.</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-gradient">Connect.</span>
            <span className="h-3 w-px bg-border" />
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-gradient">Create.</span>
          </div>
        </div>

        {/* Right: logo */}
        <div className="relative hidden flex-shrink-0 sm:block" style={{ width: "clamp(160px,22vw,300px)" }}>
          <Image
            src="/logos/logo-luma.png"
            alt="MakersLounge"
            width={300}
            height={300}
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>makerslounge.ca</span>
      </div>
    </div>
  );
}

const SPONSORS = [
  {
    name: "Aucctus",
    logo: "/logos/partner-logos/Aucctus-Full-Colour-Logo1.webp",
    logoWidth: 400,
    logoHeight: 120,
    logoClassName: "max-h-16 max-w-full object-contain",
    url: "https://aucctus.com/",
    description: "We engineer better innovation outcomes. The AI operating system for enterprise innovators to ship winners faster and prove ROI.",
    message: "We're Aucctus — the AI operating system built for enterprise innovators. We help organizations take ideas from raw concept to validated, revenue-generating innovation faster than ever. Sponsoring this hackathon was a natural fit: the problems you've been building against this week are exactly the ones we work on every day. We're genuinely grateful to every judge who gave their time, and to everyone who showed up, built something real, and put it in front of the room tonight. You're the kind of people who make innovation happen.",
    rep: {
      name: "Laine McGarragle",
      title: "Head of Customer Success",
      photo: "/hackathons/innovation-hackathon/laine-mcgarragle.png",
      linkedin: "https://www.linkedin.com/in/laine-mcgarragle/",
    },
  },
  {
    name: "Disruptive Edge",
    logo: "/logos/partner-logos/Disruptive-Edge-SQ.png",
    logoWidth: 200,
    logoHeight: 200,
    logoClassName: "max-h-36 max-w-[75%] object-contain",
    url: "https://www.disruptiveedge.com/",
    description: "Disruptive Edge is an AI-native strategy and innovation firm that helps the world's leading enterprises deploy AI, launch new products and ventures, and turn innovation into revenue.",
    message: "Disruptive Edge is an AI-native strategy and innovation firm. We partner with leading enterprises to deploy AI that actually moves the needle — new products, new ventures, and innovation that converts into real revenue. Events like tonight are where the future gets built, and we're honoured to support MakersLounge and the community behind this hackathon. A sincere thank you to the judges who brought their expertise, the attendees who showed up with curiosity, and every team who pushed their idea to the finish line.",
    rep: {
      name: "Matthew Gledhill",
      title: "Engagement Manager",
      photo: "/hackathons/innovation-hackathon/matthew-gledhill.png",
      linkedin: null,
    },
  },
];

function SlideSponsors() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(4)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Sponsors</span>
      </div>

      <div className="relative flex flex-1 flex-col gap-[clamp(0.75rem,1.5vh,1.25rem)] py-[clamp(0.5rem,1.5vh,1.5rem)]">
        <div>
          <h2 className="font-sans font-semibold text-[clamp(2.75rem,8vw,6.5rem)] leading-[1.0] tracking-tight">
            A huge <span className="text-gradient">thank you.</span>
          </h2>
          <p className="mt-2 font-sans text-[clamp(0.95rem,1.5vw,1.15rem)] leading-relaxed text-muted-foreground">
            Tonight wouldn&rsquo;t be possible without our proud sponsors.
          </p>
        </div>

        <div className="flex flex-1 gap-6">
          {SPONSORS.map((s) => (
            <div
              key={s.name}
              className="flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-background/40 backdrop-blur-sm"
            >
              <div className="flex items-center justify-center bg-white p-8" style={{ height: "clamp(140px,26vh,240px)" }}>
                <Image
                  src={s.logo}
                  alt={s.name}
                  width={s.logoWidth}
                  height={s.logoHeight}
                  className={s.logoClassName}
                />
              </div>
              <div className="flex items-center justify-between gap-6 px-7 py-6">
                <div className="flex flex-1 flex-col gap-2">
                  <p className="font-sans text-[clamp(1rem,1.4vw,1.25rem)] leading-relaxed text-muted-foreground">
                    {s.description}
                  </p>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[0.75rem] uppercase tracking-[0.12em] text-gradient transition-opacity hover:opacity-70"
                  >
                    {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")} →
                  </a>
                </div>
                <div className="flex-shrink-0 overflow-hidden rounded-xl border border-border/40">
                  <QRCodeSVG value={s.url} size={120} bgColor="#ffffff" fgColor="#111111" />
                </div>
              </div>
              {s.rep && (
                <div className="flex items-center gap-5 border-t border-border/60 px-7 py-5">
                  <div className="h-[96px] w-[96px] flex-shrink-0 overflow-hidden rounded-full border border-border/60">
                    <Image src={s.rep.photo} alt={s.rep.name} width={96} height={96} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <span className="font-sans font-semibold text-[clamp(1.2rem,1.8vw,1.55rem)] leading-snug">{s.rep.name}</span>
                    <span className="font-mono text-[0.875rem] uppercase tracking-[0.1em] text-muted-foreground">{s.rep.title}</span>
                  </div>
                  {s.rep.linkedin && (
                    <a
                      href={s.rep.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-muted-foreground transition-colors hover:text-[#0A66C2]"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="size-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <div className="flex items-center gap-4">
          <span>Demo Night · May 26</span>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/30 px-2.5 py-1 text-muted-foreground backdrop-blur-sm transition-colors hover:border-border hover:text-foreground"
          >
            <Info className="size-3" />
            <span>From our sponsors</span>
          </button>
        </div>
      </div>

      {/* Sponsor messages modal */}
      {open && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative mx-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-8 py-5">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">A note from our sponsors</span>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-0 divide-y divide-border/60">
              {SPONSORS.map((s) => (
                <div key={s.name} className="flex flex-col gap-4 px-8 py-7">
                  <div className="rounded-lg bg-white px-4 py-2 w-fit">
                    <Image src={s.logo} alt={s.name} width={120} height={36} className="h-7 w-auto object-contain" />
                  </div>
                  <p className="font-sans text-[clamp(0.9rem,1.2vw,1.05rem)] leading-relaxed text-muted-foreground">
                    {s.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideJudges() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(5)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Judges</span>
      </div>

      <div className="relative my-auto flex flex-col gap-[clamp(0.75rem,2vh,1.5rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2rem,4.5vw,3.5rem)] leading-[1.0] tracking-tight">
          Our <span className="text-gradient">judges.</span>
        </h2>

        {JUDGES.length === 0 ? (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Introduced at the event.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Row 1: first 3 judges */}
            <div className="grid grid-cols-3 gap-3">
              {JUDGES.slice(0, 3).map((j, i) => <JudgeCard key={i} judge={j} index={i} />)}
            </div>
            {/* Row 2: remaining judges, centered */}
            {JUDGES.length > 3 && (
              <div className="flex justify-center gap-3">
                {JUDGES.slice(3).map((j, i) => (
                  <div key={i + 3} className="w-[calc(33.333%-0.5rem)]">
                    <JudgeCard judge={j} index={i + 3} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        {JUDGES.length > 0 && <span>{JUDGES.length} judge{JUDGES.length !== 1 ? "s" : ""}</span>}
      </div>
    </div>
  );
}


function JudgeCard({ judge: j, index: i }: { judge: typeof JUDGES[number]; index: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/40 p-5 backdrop-blur-sm h-full">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">{pad2(i + 1)}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      {j.photo && (
        <div className="overflow-hidden rounded-xl" style={{ width: "clamp(100px,12vw,160px)", height: "clamp(100px,12vw,160px)" }}>
          <Image src={j.photo} alt={j.name} width={160} height={160} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="font-sans font-semibold text-[clamp(1.2rem,2vw,1.75rem)] leading-snug">{j.name}</h3>
      <p className="font-sans text-[clamp(0.9rem,1.3vw,1.15rem)] leading-snug text-muted-foreground">{j.title}</p>
      {j.companyLogo ? (
        <div className="mt-auto rounded-md bg-white px-3 py-1.5" style={{ width: "fit-content" }}>
          <Image src={j.companyLogo} alt={j.company} width={110} height={32} className="h-7 w-auto object-contain" />
        </div>
      ) : (
        <p className="mt-auto font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{j.company}</p>
      )}
    </div>
  );
}

function SlideJudgingCriteria() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(6)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Judging criteria</span>
      </div>

      <div className="relative my-auto flex flex-col gap-[clamp(1rem,2.5vh,2rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2rem,5vw,4.5rem)] leading-[1.0] tracking-tight">
          The <span className="text-gradient">three tracks.</span>
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {TRACKS.map((t, i) => (
            <div key={t.name} className="flex flex-col gap-4 rounded-xl border border-border/60 bg-background/40 overflow-hidden backdrop-blur-sm">
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <Image src={t.image} alt={t.name} fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-3 px-5 pb-5">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.6rem] tabular-nums text-muted-foreground">{pad2(i + 1)}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <h3 className="font-sans font-semibold text-[clamp(1.35rem,2.2vw,2rem)] leading-snug">{t.name}</h3>
                <p className="text-[clamp(0.95rem,1.35vw,1.2rem)] leading-relaxed text-muted-foreground">{t.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>3 tracks</span>
      </div>
    </div>
  );
}

function SlideWinners() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(16)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Winners</span>
      </div>

      <div className="relative my-auto flex flex-row items-center gap-[clamp(2rem,5vw,5rem)]">
        {/* Left */}
        <div className="flex flex-1 flex-col gap-[clamp(1.25rem,3vh,2.5rem)]">
          <h2 className="font-sans font-semibold text-[clamp(2.75rem,9vw,8rem)] leading-[1.0] tracking-tight">
            The <span className="text-gradient">winners.</span>
          </h2>
          {WINNERS.length === 0 ? (
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Announced at the event.
            </p>
          ) : (
            <ul className="flex flex-col">
              {WINNERS.map((w) => (
                <li
                  key={w.track}
                  className="grid items-baseline gap-4 border-t border-border py-[clamp(0.65rem,1.6vh,1rem)] sm:grid-cols-[12rem_1fr_auto]"
                >
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{w.track}</span>
                  <span className="font-sans font-semibold text-[clamp(1.1rem,2vw,1.6rem)] tracking-tight">{w.project}</span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted-foreground">{w.team}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Right: poster shown when no winners yet */}
        {WINNERS.length === 0 && (
          <div className="relative hidden flex-shrink-0 sm:block" style={{ width: "clamp(220px,30vw,380px)" }}>
            <div className="overflow-hidden rounded-xl border border-border/60 shadow-xl">
              <Image
                src="/hackathons/innovation-hackathon/Innovation (1).png"
                alt="2026 Innovation Hackathon"
                width={600}
                height={600}
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>Demo Night · May 26</span>
      </div>
    </div>
  );
}

function SlideThankYou() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(17)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Thank you</span>
      </div>

      <div className="relative my-auto flex flex-col gap-[clamp(1.5rem,3.5vh,3rem)]">
        <h2 className="font-sans font-semibold text-[clamp(2.75rem,9vw,8rem)] leading-[1.0] tracking-tight">
          Thank <span className="text-gradient">you.</span>
        </h2>

        <p className="max-w-2xl font-sans text-[clamp(0.95rem,1.5vw,1.2rem)] leading-relaxed text-muted-foreground">
          You showed up, you built something, and you put it in front of the room. That takes courage — and this community is better because of you.
        </p>

        {STATS ? (
          <div className="grid grid-cols-3 gap-5" style={{ maxWidth: "clamp(360px,55vw,640px)" }}>
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-5 backdrop-blur-sm">
              <span className="font-sans font-semibold text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-tight text-gradient">
                {STATS.participants}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Participants</span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-5 backdrop-blur-sm">
              <span className="font-sans font-semibold text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-tight text-gradient">
                {STATS.projectsSubmitted}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Projects submitted</span>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-background/40 p-5 backdrop-blur-sm">
              <span className="font-sans font-semibold text-[clamp(2rem,4vw,3.5rem)] leading-none tracking-tight text-gradient">
                {STATS.teams}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">Teams</span>
            </div>
          </div>
        ) : (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Stats shared at the event.
          </p>
        )}

        {/* QR codes — sponsors + MakersLounge */}
        <div className="grid w-full grid-cols-3 gap-5">
          {[
            { name: "Aucctus", logo: "/logos/partner-logos/Aucctus-Full-Colour-Logo1.webp", logoW: 140, logoH: 40, url: "https://www.linkedin.com/company/aucctus/", label: "Follow on LinkedIn", icon: "linkedin" as const },
            { name: "Disruptive Edge", logo: "/logos/partner-logos/Disruptive-Edge-SQ.png", logoW: 56, logoH: 56, url: "https://www.linkedin.com/company/disruptiveedge/posts/?feedView=all", label: "Follow on LinkedIn", icon: "linkedin" as const },
            { name: "MakersLounge", logo: "/logos/logo-luma.png", logoW: 56, logoH: 56, url: "https://www.linkedin.com/company/makeandlearn", label: "Follow on LinkedIn", icon: "linkedin" as const },
          ].map((s) => (
            <div key={s.name} className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-background/40 p-6 backdrop-blur-sm">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <QRCodeSVG value={s.url} size={160} bgColor="#ffffff" fgColor="#111111" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center overflow-hidden rounded-lg bg-white px-4 py-2.5" style={{ minWidth: 64, minHeight: 44 }}>
                  <Image src={s.logo} alt={s.name} width={s.logoW} height={s.logoH} className="object-contain" style={{ maxHeight: 40, width: "auto" }} />
                </div>
                <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                  {s.icon === "linkedin" ? <Linkedin className="size-3" /> : <span className="size-3 inline-flex items-center justify-center text-[0.55rem]">↗</span>}
                  {s.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>makerslounge.ca</span>
      </div>
    </div>
  );
}

function SlideDemoPresentation({ finalist, index, slideN }: { finalist: Finalist | null; index: number; slideN: number }) {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(slideN)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Demo {pad2(index + 1)}</span>
      </div>

      {/* Title area — compact, no my-auto so team grid can fill the rest */}
      <div className="relative mt-[clamp(1rem,2vh,2rem)] flex flex-col gap-[clamp(0.5rem,1vh,1rem)]">
        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-gradient font-semibold">Demo {pad2(index + 1)}</span>
          <span className="mx-3 text-foreground/20">/</span>
          <span>{pad2(DEMO_SLOT_COUNT)}</span>
        </div>

        {!finalist ? (
          <>
            <h2 className="font-sans font-semibold text-[clamp(2.75rem,9vw,8rem)] leading-[1.0] tracking-tight text-foreground/15">
              TBA
            </h2>
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground/30">
              Finalist pending
            </p>
          </>
        ) : (
          <>
            <h2 className="font-sans font-semibold text-[clamp(2.75rem,7vw,6rem)] leading-[1.0] tracking-tight">
              <span className="text-gradient">{finalist.title ?? finalist.team_name ?? "Untitled"}</span>
            </h2>
            {finalist.team_name && finalist.title && (
              <p className="font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground">
                {finalist.team_name}
              </p>
            )}
            {finalist.challenge_track && (
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground/60">
                {finalist.challenge_track}
              </p>
            )}
          </>
        )}
      </div>

      {/* Team members — fills remaining vertical space */}
      {finalist && <TeamMembersRow title={finalist.title} />}

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>{pad2(index + 1)} of {pad2(DEMO_SLOT_COUNT)}</span>
      </div>
    </div>
  );
}

const BONUS_DEMO_NAMES: string[] = ["Auctopus", "SAMM"];

function SlideBonusPresentation({ index, slideN }: { index: number; slideN: number }) {
  const name = BONUS_DEMO_NAMES[index] ?? null;
  const members = name ? (BONUS_TEAMS[name.toLowerCase()] ?? null) : null;

  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(slideN)}</span>
        <span className="h-px w-4 bg-border" />
        <span>Bonus Demo {pad2(index + 1)}</span>
      </div>

      <div className="relative mt-[clamp(1rem,2vh,2rem)] flex flex-col gap-[clamp(0.5rem,1vh,1rem)]">
        {/* SOON Hackathon badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 rounded-full border border-border/60 bg-background/40 px-3 py-1.5 backdrop-blur-sm">
            <Image src="/hackathons/soon-hackathon/logo.png" alt="SOON Hackathon" width={24} height={24} className="h-6 w-6 object-contain" />
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">SOON Hackathon · Bonus Demo</span>
          </div>
        </div>

        <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-gradient font-semibold">Bonus {pad2(index + 1)}</span>
          <span className="mx-3 text-foreground/20">/</span>
          <span>{pad2(BONUS_SLOT_COUNT)}</span>
        </div>

        {!name ? (
          <h2 className="font-sans font-semibold text-[clamp(2.75rem,7vw,6rem)] leading-[1.0] tracking-tight text-foreground/15">
            TBA
          </h2>
        ) : (
          <h2 className="font-sans font-semibold text-[clamp(2.75rem,7vw,6rem)] leading-[1.0] tracking-tight">
            <span className="text-gradient">{name}</span>
          </h2>
        )}
      </div>

      {name && members && <TeamMembersRow title={name} teams={BONUS_TEAMS} />}

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>Bonus {pad2(index + 1)} of {pad2(BONUS_SLOT_COUNT)}</span>
      </div>
    </div>
  );
}

function TeamMembersRow({ title, teams = FINALIST_TEAMS }: { title: string | null; teams?: Record<string, TeamMember[]> }) {
  if (!title) return null;
  const key = Object.keys(teams).find((k) => title.toLowerCase().includes(k.toLowerCase()));
  const members = key ? teams[key] : null;
  if (!members || members.length === 0) return null;

  return (
    <div className={`relative mt-[clamp(0.75rem,1.5vh,1.5rem)] grid flex-1 min-h-0 gap-5 pb-[clamp(2rem,5vh,4rem)]`} style={{ gridTemplateColumns: `repeat(${members.length}, 1fr)` }}>
      {members.map((m) => (
        <div key={m.name} className="flex flex-col items-center justify-center gap-[clamp(1rem,2.5vh,2rem)] rounded-2xl border border-border/60 bg-background/40 p-[clamp(1.25rem,3vw,2.5rem)] backdrop-blur-sm">
          {m.photo && (
            <div className="overflow-hidden rounded-2xl border border-border/40 shadow-lg" style={{ width: "clamp(120px,16vw,220px)", height: "clamp(120px,16vw,220px)" }}>
              <Image src={m.photo} alt={m.name} width={220} height={220} className="h-full w-full object-cover object-top" />
            </div>
          )}
          <span className="font-sans font-semibold text-[clamp(1.25rem,2.5vw,2.25rem)] leading-snug text-center">{m.name}</span>
          {m.linkedin && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-xl bg-white p-2.5 shadow-sm">
                <QRCodeSVG value={m.linkedin} size={130} bgColor="#ffffff" fgColor="#111111" />
              </div>
              <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                <Linkedin className="size-3" />
                Connect on LinkedIn
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Helpers ---------- */

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
