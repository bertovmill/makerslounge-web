import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Judging Rubric — 2026 Innovation Hackathon",
  description: "Scoring criteria and weights for the 2026 Innovation Hackathon. Three tracks, four criteria each.",
};

type Criterion = { label: string; weight: number; description: string };
type Track = { n: number; name: string; description: string; criteria: Criterion[] };

const TRACKS: Track[] = [
  {
    n: 1,
    name: "Validating a Business Idea",
    description: "Innovation teams collect thousands of ideas every year, far more than they can evaluate. Build an AI agent or tool that streamlines the innovation pipeline from raw idea to commercialized product.",
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
    description: "The business landscape is changing fast, and separating signal from noise has become critical. Build an agentic AI tool or platform that continuously monitors the market for signals relevant to a company's innovation function.",
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
    description: "Real customer studies are slow, expensive, and often fail to surface what customers actually want. Build an AI tool or platform that simulates synthetic customer feedback on new product ideas.",
    criteria: [
      { label: "Fidelity of synthetic feedback", weight: 35, description: "Simulated customers behave and respond like real market segments. Feedback is nuanced, not generic — accounts for edge cases and varied personas." },
      { label: "Non-obvious insight generation", weight: 25, description: "Surfaces things traditional surveys often miss: minority opinions, contradictions between stated and revealed preferences, unexpected objections." },
      { label: "Time & cost savings vs. real research", weight: 25, description: "Makes a credible case for replacing or meaningfully augmenting traditional customer research — speed, cost, or breadth of coverage." },
      { label: "Demo clarity", weight: 15, description: "A non-technical stakeholder understands the value proposition and how to use the tool within 5 minutes." },
    ],
  },
];

export default function ScoringPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-[clamp(1.25rem,5vw,3rem)] py-[clamp(3rem,8vh,6rem)]">

        {/* Header */}
        <div className="mb-[clamp(2.5rem,6vh,5rem)] flex flex-col gap-[clamp(1.5rem,3vh,2.5rem)]">
          <Link
            href="/hackathons/2026-innovation-hackathon"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            ← 2026 Innovation Hackathon
          </Link>
          <div className="flex flex-col gap-4 border-b border-border pb-[clamp(1.5rem,3vh,2.5rem)]">
            <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              <span className="text-foreground">Judging Rubric</span>
              <span className="h-px w-8 bg-border" />
              <span>Demo Night · May 26, 2026</span>
            </div>
            <h1 className="font-serif text-[clamp(2.5rem,7vw,5rem)] leading-[0.95] tracking-tight">
              Scoring criteria.
            </h1>
            <p className="max-w-[55ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Three tracks. Four criteria each. All criteria sum to 100% per track. Score each criterion independently, then apply the weights to produce a final score out of 100.
            </p>
          </div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col gap-[clamp(3rem,7vh,5rem)]">
          {TRACKS.map((track) => (
            <section key={track.n} className="flex flex-col gap-6">

              {/* Track header */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  <span className="text-foreground">Track {String(track.n).padStart(2, "0")}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <h2 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-tight">
                  {track.name}
                </h2>
                <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {track.description}
                </p>
              </div>

              {/* Criteria table */}
              <div className="flex flex-col">
                {/* Table header */}
                <div className="grid grid-cols-[1fr_4rem] gap-4 border-b border-border pb-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-muted-foreground sm:grid-cols-[8rem_1fr_4rem]">
                  <span className="hidden sm:block">Criterion</span>
                  <span className="sm:hidden">Criterion / What judges look for</span>
                  <span className="hidden sm:block">What judges look for</span>
                  <span className="text-right">Weight</span>
                </div>

                {track.criteria.map((c) => (
                  <div
                    key={c.label}
                    className="grid grid-cols-[1fr_4rem] items-baseline gap-4 border-b border-border py-[clamp(0.75rem,1.8vh,1.25rem)] sm:grid-cols-[8rem_1fr_4rem]"
                  >
                    <span className="font-sans text-sm font-medium leading-snug text-foreground sm:text-base">
                      {c.label}
                    </span>
                    <p className="hidden text-sm leading-relaxed text-muted-foreground sm:block">
                      {c.description}
                    </p>
                    <p className="block text-[0.7rem] leading-relaxed text-muted-foreground sm:hidden col-span-2 -mt-1">
                      {c.description}
                    </p>
                    <span className="text-right font-mono text-sm tabular-nums text-foreground">
                      {c.weight}%
                    </span>
                  </div>
                ))}

                {/* Total row */}
                <div className="grid grid-cols-[1fr_4rem] gap-4 pt-3 font-mono text-xs uppercase tracking-[0.18em] sm:grid-cols-[8rem_1fr_4rem]">
                  <span className="hidden sm:block" />
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-right font-medium text-foreground">100%</span>
                </div>
              </div>

            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>2026 Innovation Hackathon · MakersLounge</span>
          <Link
            href="/hackathons/2026-innovation-hackathon"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            Back to hackathon <ArrowUpRight className="size-3" />
          </Link>
        </div>

      </div>
    </main>
  );
}
