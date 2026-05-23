import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import MarketingShell from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "AI Hackathon Night with MuleRun — MakersLounge",
  description:
    "MuleRun AI Agent Hackathon by Makerslounge. Thursday May 14, 2026, 6–9 PM at 510 Front St W, Toronto. Build an AI agent, demo it, win cash.",
  openGraph: {
    title: "AI Hackathon Night with MuleRun — MakersLounge",
    description:
      "MuleRun AI Agent Hackathon by Makerslounge. Thursday May 14, 2026.",
    type: "website",
  },
};

const LUMA_URL = "";
const MULERUN_TUTORIAL_URL =
  "https://mulerun.com/docs/creator-guide/quickstart/get-started";

export default function MulerunHackathonPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(2rem,6vh,4rem)] pb-[clamp(3rem,8vh,5rem)] text-foreground">
        <div className="mb-[clamp(2rem,5vh,4rem)] flex items-center justify-between gap-4">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-opacity hover:opacity-70"
          >
            <ArrowLeft className="size-3.5" />
            All hackathons
          </Link>
          <Link
            href="/hackathons/mulerun/present"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-opacity hover:opacity-70"
          >
            Open presentation
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">No. 01</span>
          <span className="h-px w-8 bg-border" />
          <span>MuleRun × MakersLounge</span>
        </div>

        <h1 className="mt-[clamp(1rem,2.5vh,2rem)] font-serif text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.92] tracking-tight">
          AI Hackathon
          <br />
          Night with
          <br />
          MuleRun.
        </h1>

        <p className="mt-[clamp(1.25rem,3vh,2.25rem)] max-w-[55ch] text-[clamp(1rem,1.5vw,1.4rem)] text-muted-foreground">
          A high-energy night of building AI agents, shipping demos, and winning cash. Not a workshop — a competition.
        </p>

        <div className="mt-[clamp(2rem,5vh,3.5rem)] grid grid-cols-2 gap-x-12 gap-y-6 border-t border-border pt-6 sm:grid-cols-4">
          <Fact label="Date" value="Thu May 14, 2026" />
          <Fact label="Time" value="6:00–9:00 PM" />
          <Fact label="Team size" value="1 to 3 people" />
          <Fact label="Location" value="510 Front St W, #400" />
        </div>

        <section className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={1} label="What" />
          <h2 className="max-w-[22ch] font-serif text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Design, build, and pitch an AI agent — in one night.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            You&apos;ll have a couple of hours to design, build, and pitch your own AI agent using MuleRun. Best builds take home the prizes. Bring your laptop, bring your ideas, and let&apos;s see who can ship the best agent.
          </p>
          <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground">
            New to MuleRun? Run through the quickstart together:{" "}
            <a
              href={MULERUN_TUTORIAL_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 border-b border-foreground/40 text-foreground hover:opacity-80"
            >
              MuleRun creator quickstart <ArrowUpRight className="size-3.5" />
            </a>
          </p>
        </section>

        <section className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={2} label="Schedule" />
          <h2 className="font-serif text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Thursday May 14.
          </h2>
          <ul className="flex flex-col">
            {[
              { time: "6:00 PM", end: "6:15 PM", label: "Intro and kickoff" },
              { time: "6:15 PM", end: "8:15 PM", label: "Hack time" },
              { time: "8:15 PM", end: "9:00 PM", label: "Demos and judging" },
            ].map((row) => (
              <li
                key={row.time}
                className="grid grid-cols-[7rem_1fr_auto] items-baseline gap-4 border-t border-border py-[clamp(0.65rem,1.6vh,1.1rem)] last:border-b sm:grid-cols-[10rem_1fr_auto]"
              >
                <span className="font-mono text-[clamp(0.85rem,1.4vw,1.1rem)] tabular-nums text-foreground">
                  {row.time}
                </span>
                <span className="font-serif text-[clamp(1.25rem,2.5vw,2rem)] tracking-tight">
                  {row.label}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  to {row.end}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={3} label="What you get" />
          <ul className="grid gap-[clamp(1.25rem,3vh,2rem)] sm:grid-cols-3">
            {[
              {
                tag: "Prizes",
                title: "Cash for the top 3",
                body: "Top three demos take home cash prizes.",
              },
              {
                tag: "Credits",
                title: "$15 in MuleRun credits",
                body: "Every attendee gets MuleRun credits to build with.",
              },
              {
                tag: "Fuel",
                title: "Food provided",
                body: "DM bertomill on LinkedIn with any dietary restrictions.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="flex flex-col gap-3 border-t border-border pt-4"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {item.tag}
                </span>
                <h3 className="font-serif text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-tight">
                  {item.title}
                </h3>
                <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={4} label="Partners" />
          <h2 className="max-w-[24ch] font-serif text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Brought to you with Aucctus AI and Disruptive Edge.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Aucctus AI and Disruptive Edge are generously sponsoring the venue.
          </p>
        </section>

        <section className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={5} label="Getting in" />
          <ul className="flex flex-col">
            {[
              { label: "510 Front St W, Suite 200, Toronto, ON M5V 1B8" },
              { label: "The event is on the 4th floor" },
              { label: "Someone will be at the ground floor to let attendees up" },
            ].map((row) => (
              <li
                key={row.label}
                className="border-t border-border py-[clamp(0.65rem,1.6vh,1rem)] font-serif text-[clamp(1.1rem,2vw,1.5rem)] tracking-tight last:border-b"
              >
                {row.label}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-[clamp(3rem,7vh,5rem)] flex flex-col gap-[clamp(1.5rem,4vh,3rem)] border-t border-border pt-[clamp(2rem,5vh,3.5rem)]">
          <Eyebrow n={6} label="Register" />
          <h2 className="max-w-[18ch] font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.92] tracking-tight">
            See you Thursday.
          </h2>
          {LUMA_URL ? (
            <a
              href={LUMA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-2.5 bg-foreground px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background hover:opacity-90"
            >
              Request to join on Luma <ArrowUpRight className="size-4" />
            </a>
          ) : (
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Luma link coming — registration is approval-required.
            </p>
          )}
        </section>
      </div>
    </MarketingShell>
  );
}

function Eyebrow({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-foreground">{n.toString().padStart(2, "0")}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="font-serif text-[clamp(1.1rem,1.8vw,1.5rem)] leading-tight tracking-tight">
        {value}
      </span>
    </div>
  );
}
