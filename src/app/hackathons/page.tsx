import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import MarketingShell from "@/components/MarketingShell";

export const metadata: Metadata = {
  title: "Hackathons — MakersLounge",
  description:
    "Hackathons hosted and partnered with MakersLounge. Build something real with the community.",
  openGraph: {
    title: "Hackathons — MakersLounge",
    description: "Hackathons hosted and partnered with MakersLounge.",
    type: "website",
  },
};

type HackathonEntry = {
  slug: string;
  href: string;
  title: string;
  tagline: string;
  date: string;
  location: string;
  status: "upcoming" | "past";
  external?: boolean;
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

function HackathonRow({ entry }: { entry: HackathonEntry }) {
  return (
    <li className="border-t border-border last:border-b">
      <Link
        href={entry.href}
        className="group grid grid-cols-1 items-baseline gap-2 py-[clamp(1.25rem,3vh,2rem)] sm:grid-cols-[1fr_auto] sm:gap-8"
      >
        <div className="flex flex-col gap-2">
          <h3 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-tight transition-opacity group-hover:opacity-70">
            {entry.title}
          </h3>
          <p className="max-w-[50ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
            {entry.tagline}
          </p>
        </div>
        <div className="flex flex-col gap-1 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:items-end sm:text-right">
          <span className="text-foreground">{entry.date}</span>
          <span>{entry.location}</span>
          <span className="mt-2 inline-flex items-center gap-1.5 text-foreground">
            View <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </Link>
    </li>
  );
}
