"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Criterion = { label: string; weight: number; description: string };
type Track = {
  n: number;
  name: string;
  description: string;
  image: string;
  criteria: Criterion[];
};

const TRACKS: Track[] = [
  {
    n: 1,
    name: "Validating a Business Idea",
    description:
      "Innovation teams collect thousands of ideas every year, far more than they can evaluate. Build an AI agent or tool that streamlines the innovation pipeline from raw idea to commercialized product.",
    image: "/hackathons/innovation-hackathon/track-idea-validation-art.png",
    criteria: [
      { label: "End-to-end pipeline coverage", weight: 25, description: "Handles the full journey from idea intake through evaluation, prioritization, and output — not just one step of the funnel." },
      { label: "Quality of scoring / triage logic", weight: 35, description: "The AI's ranking methodology is defensible, consistent, and meaningfully better than gut-feel. Handles nuanced, similar ideas differently." },
      { label: "Speed & scalability over manual review", weight: 25, description: "Demonstrates a credible reduction in time or cost vs. a human team reviewing the same volume of ideas." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
  {
    n: 2,
    name: "Continuous Market Monitoring",
    description:
      "The business landscape is changing fast, and separating signal from noise has become critical. Build an agentic AI tool or platform that continuously monitors the market for signals relevant to a company's innovation function.",
    image: "/hackathons/innovation-hackathon/track-market-monitoring-art.png",
    criteria: [
      { label: "Signal relevance & accuracy", weight: 35, description: "Surfaces signals genuinely useful to an innovation team — not just news summaries. Filters noise and avoids false positives." },
      { label: "Real-time or near-real-time capability", weight: 25, description: "Data freshness matters. The platform detects and surfaces new signals quickly; latency is minimized and made transparent." },
      { label: "Actionability of insights surfaced", weight: 25, description: "Insights are specific enough to act on. Not just 'AI is growing' — but what an innovation team should do differently because of it." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
  {
    n: 3,
    name: "Synthetic Customers",
    description:
      "Real customer studies are slow, expensive, and often fail to surface what customers actually want. Build an AI tool or platform that simulates synthetic customer feedback on new product ideas.",
    image: "/hackathons/innovation-hackathon/track-synthetic-customers-art.png",
    criteria: [
      { label: "Fidelity of synthetic feedback", weight: 35, description: "Simulated customers behave and respond like real market segments. Feedback is nuanced, not generic — accounts for edge cases and varied personas." },
      { label: "Non-obvious insight generation", weight: 25, description: "Surfaces things traditional surveys often miss: minority opinions, contradictions between stated and revealed preferences, unexpected objections." },
      { label: "Time & cost savings vs. real research", weight: 25, description: "Makes a credible case for replacing or meaningfully augmenting traditional customer research — speed, cost, or breadth of coverage." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
];

const TRACK_ACCENT_COLORS = [
  { ring: "ring-amber-400/60", badge: "bg-amber-400/20 text-amber-300 border border-amber-400/30", dot: "bg-amber-400" },
  { ring: "ring-sky-400/60", badge: "bg-sky-400/20 text-sky-300 border border-sky-400/30", dot: "bg-sky-400" },
  { ring: "ring-violet-400/60", badge: "bg-violet-400/20 text-violet-300 border border-violet-400/30", dot: "bg-violet-400" },
];

export default function ScoringContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Top navigation bar ── */}
      <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-5 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <Link
          href="/hackathons/2026-innovation-hackathon"
          className="flex items-center gap-2.5 hover:opacity-75 transition-opacity"
        >
          <Image
            src="/logos/logo.svg"
            alt="MakersLounge"
            width={18}
            height={19}
            className="dark:hidden"
          />
          <Image
            src="/logos/logo-light.svg"
            alt="MakersLounge"
            width={18}
            height={19}
            className="hidden dark:block"
          />
          <span className="font-sans text-sm font-medium text-foreground hidden sm:inline">
            makerslounge
          </span>
        </Link>

        <nav className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.14em]">
          <Link
            href="/hackathons/2026-innovation-hackathon"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            Hackathon
          </Link>
          <Link
            href="/hackathons/2026-innovation-hackathon/demo-night"
            className="px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
          >
            Demo Night
          </Link>
          <span className="px-3 py-1.5 rounded-md text-foreground bg-secondary/60">
            Scoring
          </span>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative h-[56vh] min-h-[340px] max-h-[540px] overflow-hidden">
        <Image
          src="/hackathons/innovation-hackathon/cover-art.png"
          alt="2026 Innovation Hackathon"
          fill
          className="object-cover object-center"
          priority
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-background" />

        <div className="relative z-10 flex flex-col justify-end h-full px-[clamp(1.25rem,5vw,3rem)] pb-[clamp(2rem,5vh,4rem)]">
          <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/60 mb-3">
            <span className="text-white/90">Judging Rubric</span>
            <span className="h-px w-6 bg-white/30" />
            <span>Demo Night · May 26, 2026</span>
          </div>
          <h1 className="font-serif text-[clamp(3rem,9vw,6.5rem)] leading-[0.9] tracking-tight text-white">
            Scoring criteria.
          </h1>
          <p className="mt-4 max-w-[50ch] text-[clamp(0.875rem,2vw,1.125rem)] leading-relaxed text-white/70">
            Three tracks. Four criteria each. Score 1–5 per criterion, then apply weights for a total out of 100.
          </p>
        </div>
      </section>

      {/* ── Tracks ── */}
      <div className="flex flex-col gap-0">
        {TRACKS.map((track, i) => {
          const accent = TRACK_ACCENT_COLORS[i];
          return (
            <section key={track.n} className="border-t border-border/50 py-[clamp(3rem,7vh,5rem)]">

              {/* Track header */}
              <div className="px-[clamp(1.25rem,5vw,3rem)] mb-6">
                <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6rem] font-mono uppercase tracking-widest ${accent.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
                    Track {String(track.n).padStart(2, "0")}
                  </span>
                  <span className="h-px flex-1 bg-border/50 max-w-[8rem]" />
                </div>
                <h2 className="font-serif text-[clamp(1.75rem,4.5vw,3.25rem)] leading-tight tracking-tight mb-3">
                  {track.name}
                </h2>
                <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {track.description}
                </p>
              </div>

              {/* Track image */}
              <div className="px-[clamp(1.25rem,5vw,3rem)] mb-8">
                <div className={`relative w-full rounded-2xl overflow-hidden ring-1 ${accent.ring} h-40 sm:h-52`}>
                  <Image
                    src={track.image}
                    alt={track.name}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/40 via-transparent to-transparent" />
                </div>
              </div>

              {/* Horizontal scroll criteria gallery */}
              <div className="relative">
                {/* scroll hint fade — right edge */}
                <div className="pointer-events-none absolute top-0 right-0 h-full w-16 bg-gradient-to-l from-background to-transparent z-10 hidden sm:block" />

                <div
                  className="flex gap-4 overflow-x-auto pb-4 px-[clamp(1.25rem,5vw,3rem)] snap-x snap-mandatory scroll-smooth"
                  style={{ scrollbarWidth: "none" }}
                >
                  {track.criteria.map((c, ci) => (
                    <div
                      key={c.label}
                      className="snap-start shrink-0 flex flex-col gap-3 rounded-xl border border-border bg-card p-5 w-[min(82vw,320px)] sm:w-72"
                    >
                      {/* Weight badge */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">
                          Criterion {String(ci + 1).padStart(2, "0")}
                        </span>
                        <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded-full ${accent.badge}`}>
                          {c.weight}%
                        </span>
                      </div>

                      {/* Label */}
                      <h3 className="text-base font-medium leading-snug text-foreground">
                        {c.label}
                      </h3>

                      {/* Description */}
                      <p className="text-[0.8rem] leading-relaxed text-muted-foreground flex-1">
                        {c.description}
                      </p>

                      {/* Score slot */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                          Score (1–5)
                        </span>
                        <span className="font-mono text-sm text-muted-foreground/40 tracking-widest">
                          _ / 5
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Total card */}
                  <div className="snap-start shrink-0 flex flex-col justify-center items-center gap-2 rounded-xl border border-dashed border-border/50 p-5 w-44 text-center">
                    <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-muted-foreground">Total</span>
                    <span className="font-mono text-2xl font-medium text-foreground">100%</span>
                    <div className="mt-2 h-px w-8 bg-border" />
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                      Weighted
                      <br />
                      score
                    </span>
                  </div>
                </div>
              </div>

            </section>
          );
        })}
      </div>

      {/* ── Scoring scale ── */}
      <section className="border-t border-border/50 py-[clamp(2.5rem,6vh,4rem)] px-[clamp(1.25rem,5vw,3rem)]">
        <div className="max-w-2xl">
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground mb-5">
            Scoring scale
          </h2>
          <div className="flex flex-col">
            {[
              { score: 5, label: "Exceptional", desc: "Clearly exceeds the criterion" },
              { score: 4, label: "Strong", desc: "Meets the criterion with notable quality" },
              { score: 3, label: "Meets the bar", desc: "Solid but unremarkable" },
              { score: 2, label: "Weak attempt", desc: "Partially addressed" },
              { score: 1, label: "Does not address", desc: "The criterion is not addressed" },
            ].map((row) => (
              <div
                key={row.score}
                className="flex items-baseline gap-5 py-3 border-b border-border/50 last:border-0"
              >
                <span className="font-mono text-xl font-medium text-foreground w-4 shrink-0">{row.score}</span>
                <span className="text-sm font-medium text-foreground w-36 shrink-0">{row.label}</span>
                <span className="text-sm text-muted-foreground">{row.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-6 px-[clamp(1.25rem,5vw,3rem)] flex flex-col gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>2026 Innovation Hackathon · MakersLounge</span>
        <Link
          href="/hackathons/2026-innovation-hackathon"
          className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
        >
          Back to hackathon <ArrowUpRight className="size-3" />
        </Link>
      </footer>

    </div>
  );
}
