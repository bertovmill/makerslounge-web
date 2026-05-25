"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Linkedin } from "lucide-react";
import { supabase } from "@/lib/supabase";
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
  { name: "Ashish D'Sa", title: "CTO & Co-founder", company: "Arbor", photo: "/hackathons/innovation-hackathon/judges/ashish-dsa.png", companyLogo: "/hackathons/innovation-hackathon/judges/logo-arbor.png" },
];
const STATS: { participants: number; projectsSubmitted: number; teams: number } | null = null;

const SLIDE_COUNT = 13;

const DEMO_SLOT_COUNT = 6;

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
      if (!cancelled && data) setFinalists(data as Finalist[]);
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
    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      {/* top-left: counter + back link */}
      <div className="fixed left-[max(1.25rem,env(safe-area-inset-left))] top-[max(1.25rem,env(safe-area-inset-top))] z-40 flex items-center gap-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
      <div className="pointer-events-none fixed right-[max(1.25rem,env(safe-area-inset-right))] top-[max(1.1rem,env(safe-area-inset-top))] z-40 font-mono text-xs uppercase tracking-[0.18em]">
        <span className="text-gradient">Demo Night</span>
      </div>

      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth"
      >
        <Slide n={1} title="Opening">
          <SlideDemoNightOpener />
        </Slide>
        <Slide n={2} title="What is MakersLounge">
          <SlideWhatIsMakersLounge />
        </Slide>
        <Slide n={3} title="Sponsors">
          <SlideSponsors />
        </Slide>
        <Slide n={4} title="Judges">
          <SlideJudges />
        </Slide>
        <Slide n={5} title="Judging criteria">
          <SlideJudgingCriteria />
        </Slide>
        {Array.from({ length: DEMO_SLOT_COUNT }, (_, i) => finalists[i] ?? null).map((finalist, i) => (
          <Slide key={i} n={6 + i} title={`Demo ${pad2(i + 1)}`}>
            <SlideDemoPresentation finalist={finalist} index={i} slideN={6 + i} />
          </Slide>
        ))}
        <Slide n={12} title="Winners">
          <SlideWinners />
        </Slide>
        <Slide n={13} title="Thank you">
          <SlideThankYou />
        </Slide>
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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const eventStart = new Date("2026-05-26T21:30:00Z").getTime();
  const eventEnd = new Date("2026-05-27T00:30:00Z").getTime();
  const isLive = now >= eventStart && now < eventEnd;
  return (
    <div className="flex h-full flex-col">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a2a4a]/25 via-transparent to-[#1a1a2e]/15 dark:from-[#1a2a4a]/55 dark:via-transparent dark:to-[#1a1a2e]/35" />
        <div className="absolute left-1/2 top-[-15%] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#3A9FF3]/10 blur-[130px] dark:bg-[#3A9FF3]/18" />
        <div className="absolute bottom-[-5%] right-[-8%] h-[450px] w-[450px] rounded-full bg-primary/[0.07] blur-[110px]" />
        <div className="grain-overlay absolute inset-0 h-full w-full" />
      </div>

      {/* Eyebrow */}
      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span>May 26, 2026</span>
        <span className="h-px w-4 bg-border" />
        <span>Toronto Tech Week</span>
      </div>

      {/* Center content */}
      <div className="relative my-auto flex flex-row items-center gap-[clamp(2rem,5vw,5rem)]">
        {/* Left: heading + details */}
        <div className="flex flex-1 flex-col gap-[clamp(1rem,3vh,2rem)]">
          {isLive && (
            <div className="inline-flex w-fit items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.18em] text-primary">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live now
            </div>
          )}
          <h2 className="relative font-sans font-semibold text-[clamp(2.75rem,9vw,7rem)] leading-[1.0] tracking-tight">
            {isLive ? (
              <>We&rsquo;re{" "}<span className="text-gradient">live.</span></>
            ) : (
              <>Demo{" "}<span className="text-gradient">Night.</span></>
            )}
          </h2>
          <div className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.12em]">
            <span className="text-foreground">Tuesday May 26, 2026</span>
            <span className="text-muted-foreground">510 Front St W, Suite 200 · Toronto</span>
            <span className="text-muted-foreground">Doors 5:30 PM · Demos 6:30 PM</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {[["100+", "Builders"], ["5", "Days to build"], ["1–5", "People per team"]].map(([val, label]) => (
              <div key={label} className="flex flex-col rounded-xl border border-border/60 bg-background/40 px-4 py-3 backdrop-blur-sm">
                <span className="font-sans font-semibold text-[clamp(1.25rem,2vw,1.75rem)] leading-none tracking-tight text-gradient">{val}</span>
                <span className="mt-1 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: event poster */}
        <div className="relative hidden flex-shrink-0 sm:block" style={{ width: "clamp(220px,32vw,420px)" }}>
          <div className="overflow-hidden rounded-xl border border-border/60 shadow-xl">
            <Image
              src="/hackathons/innovation-hackathon/Innovation (1).png"
              alt="2026 Innovation Hackathon — Demo Night"
              width={600}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>makerslounge.ca</span>
      </div>
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

function SlideWhatIsMakersLounge() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(2)}</span>
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
            <p className="font-sans text-[clamp(0.95rem,1.5vw,1.2rem)] leading-relaxed text-foreground/80">
              MakersLounge is a community of <span className="font-semibold text-foreground">900 builders</span>, mostly based in Toronto — people who turn ideas into real things.
            </p>
            <p className="font-sans text-[clamp(0.95rem,1.5vw,1.2rem)] leading-relaxed text-muted-foreground">
              We host multiple events every month — hackathons, builder meetups, special presentations, and more — all with one rule: no talks, no pitches, just makers building and shipping together.
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
    rep: {
      name: "Matthew Gledhill",
      title: "Engagement Manager",
      photo: "/hackathons/innovation-hackathon/matthew-gledhill.png",
      linkedin: null,
    },
  },
];

function SlideSponsors() {
  return (
    <div className="flex h-full flex-col">
      <SlideBackground />

      <div className="relative flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-gradient">Demo Night</span>
        <span className="h-px w-8 bg-border" />
        <span className="text-foreground">{pad2(3)}</span>
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
                  <div className="h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-full border border-border/60">
                    <Image src={s.rep.photo} alt={s.rep.name} width={72} height={72} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5">
                    <span className="font-sans font-semibold text-[clamp(1.05rem,1.5vw,1.3rem)] leading-snug">{s.rep.name}</span>
                    <span className="font-mono text-[0.75rem] uppercase tracking-[0.1em] text-muted-foreground">{s.rep.title}</span>
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
        <span>Demo Night · May 26</span>
      </div>
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
        <span className="text-foreground">{pad2(4)}</span>
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
        <div className="overflow-hidden rounded-xl" style={{ width: "clamp(80px,9vw,120px)", height: "clamp(80px,9vw,120px)" }}>
          <Image src={j.photo} alt={j.name} width={120} height={120} className="w-full h-full object-cover" />
        </div>
      )}
      <h3 className="font-sans font-semibold text-[clamp(1rem,1.5vw,1.35rem)] leading-snug">{j.name}</h3>
      <p className="font-sans text-[clamp(0.8rem,1.1vw,1rem)] leading-snug text-muted-foreground">{j.title}</p>
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
        <span className="text-foreground">{pad2(5)}</span>
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
                <h3 className="font-sans font-semibold text-[clamp(1.1rem,1.6vw,1.5rem)] leading-snug">{t.name}</h3>
                <p className="text-[clamp(0.85rem,1.15vw,1.05rem)] leading-relaxed text-muted-foreground">{t.description}</p>
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
        <span className="text-foreground">{pad2(12)}</span>
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
        <span className="text-foreground">{pad2(13)}</span>
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

      <div className="relative my-auto flex flex-col gap-[clamp(1rem,3vh,2rem)]">
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
            <h2 className="font-sans font-semibold text-[clamp(2.75rem,9vw,8rem)] leading-[1.0] tracking-tight">
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

      <div className="relative mt-auto flex items-center justify-between font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>2026 Innovation Hackathon</span>
        <span>{pad2(index + 1)} of {pad2(DEMO_SLOT_COUNT)}</span>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
