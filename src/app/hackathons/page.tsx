"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronDown, ExternalLink, Play, Trophy } from "lucide-react";
import MarketingShell from "@/components/MarketingShell";

type HackathonEntry = {
  slug: string;
  href: string;
  title: string;
  tagline: string;
  date: string;
  location: string;
  status: "upcoming" | "past";
  external?: boolean;
  links?: { label: string; href: string; icon: "slides" | "scoring" | "rubric" | "external" }[];
};

const HACKATHONS: HackathonEntry[] = [
  {
    slug: "mulerun",
    href: "/hackathons/mulerun",
    title: "AI Hackathon Night with MuleRun",
    tagline:
      "Build, demo, and pitch an AI agent in one night. Cash prizes for the top 3.",
    date: "Thu May 14, 2026 · 6–9 PM",
    location: "510 Front St W, Suite 200, Toronto",
    status: "past",
  },
  {
    slug: "innovation",
    href: "/hackathons/2026-innovation-hackathon",
    title: "2026 Innovation Hackathon",
    tagline: "100 builders. One week. Live demos at Toronto Tech Week.",
    date: "May 19 to May 26, 2026",
    location: "510 Front St W, Suite 200, Toronto",
    status: "upcoming",
    links: [
      { label: "Demo Night Slides", href: "/hackathons/2026-innovation-hackathon/demo-night", icon: "slides" },
      { label: "Judge Scoring", href: "/hackathons/2026-innovation-hackathon/scoring/judge", icon: "scoring" },
      { label: "Scoring Rubric", href: "/hackathons/2026-innovation-hackathon/scoring", icon: "rubric" },
    ],
  },
];

export default function HackathonsPage() {
  const upcoming = HACKATHONS.filter((h) => h.status === "upcoming");
  const past = HACKATHONS.filter((h) => h.status === "past");

  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-[clamp(1.25rem,5vw,3rem)] pt-[clamp(2rem,6vh,4rem)] pb-[clamp(3rem,8vh,5rem)] text-foreground">
        <div className="mb-[clamp(2rem,5vh,4rem)] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">Index</span>
          <span className="h-px w-8 bg-border" />
          <span>Hackathons</span>
        </div>

        <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] leading-[0.92] tracking-tight">
          Hackathons.
        </h1>
        <p className="mt-[clamp(1rem,2.5vh,1.75rem)] max-w-[55ch] text-[clamp(1rem,1.4vw,1.35rem)] text-muted-foreground">
          Sprints, build weeks, and demo nights — hosted by MakersLounge and our partners. Ship something real with the community.
        </p>

        <section className="mt-[clamp(3rem,7vh,5rem)]">
          <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Upcoming
          </h2>
          {upcoming.length === 0 ? (
            <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
              Nothing scheduled — check back soon.
            </p>
          ) : (
            <ul className="flex flex-col">
              {upcoming.map((h) => (
                <HackathonRow key={h.slug} entry={h} />
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="mt-[clamp(3rem,7vh,5rem)]">
            <h2 className="mb-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Past
            </h2>
            <ul className="flex flex-col opacity-70">
              {past.map((h) => (
                <HackathonRow key={h.slug} entry={h} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </MarketingShell>
  );
}

const LINK_ICONS = {
  slides: <Play className="size-3.5" />,
  scoring: <Trophy className="size-3.5" />,
  rubric: <ExternalLink className="size-3.5" />,
  external: <ExternalLink className="size-3.5" />,
};

function HackathonRow({ entry }: { entry: HackathonEntry }) {
  const [open, setOpen] = useState(false);
  const hasLinks = entry.links && entry.links.length > 0;

  return (
    <li className="border-t border-border last:border-b">
      {/* Main row */}
      <div className="grid grid-cols-1 items-baseline gap-2 py-[clamp(1.25rem,3vh,2rem)] sm:grid-cols-[1fr_auto] sm:gap-8">
        <Link href={entry.href} className="group flex flex-col gap-2">
          <h3 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-tight transition-opacity group-hover:opacity-70">
            {entry.title}
          </h3>
          <p className="max-w-[50ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            {entry.tagline}
          </p>
        </Link>

        <div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:items-end sm:text-right">
          <span className="text-foreground">{entry.date}</span>
          <span>{entry.location}</span>
          <div className="mt-2 flex items-center gap-3">
            <Link
              href={entry.href}
              className="inline-flex items-center gap-1.5 text-foreground hover:opacity-70 transition-opacity"
            >
              View <ArrowUpRight className="size-3.5" />
            </Link>
            {hasLinks && (
              <button
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ${open ? "text-foreground" : ""}`}
                aria-label="Quick links"
              >
                <ChevronDown className={`size-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown quick links */}
      {hasLinks && open && (
        <div className="flex flex-wrap gap-2 pb-[clamp(1rem,2.5vh,1.5rem)]">
          {entry.links!.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-secondary/60"
            >
              {LINK_ICONS[link.icon]}
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </li>
  );
}
