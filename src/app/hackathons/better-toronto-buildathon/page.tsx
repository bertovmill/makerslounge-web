import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import MarketingShell from "@/components/MarketingShell";
import ApplyCountdown from "./ApplyCountdown";

const TITLE = "Better Toronto Buildathon — MakersLounge";
const DESCRIPTION =
  "Build a better Toronto in a weekend. Oct 24 to 25, 2026, downtown Toronto. Four tracks: housing, transit, safer streets and efficient government. Apply by Oct 20.";
const ASSETS = "/hackathons/better-toronto-buildathon";
const OG_IMAGE = `https://makerslounge.ca${ASSETS}/og-image.jpg`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: "Better Toronto Buildathon",
    description: DESCRIPTION,
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Better Toronto Buildathon",
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
};

const APPLY_URL = "https://tally.so/r/1AZR04";
const LUMA_URL = "https://luma.com/p4mthvry";

const STATS = [
  {
    track: "Housing",
    figure: "↓10%",
    body: "Housing starts are down 10% year over year. Toronto is building fewer homes while demand keeps climbing.",
  },
  {
    track: "Transit",
    figure: "↑53%",
    body: "Subway delay time is up 53%. Riders are losing more hours on the platform than ever.",
  },
  {
    track: "Safer streets",
    figure: "70%",
    body: "70% of Torontonians say they are worried about crime. Safety is the top issue at the door.",
  },
  {
    track: "Municipal government",
    figure: "48 hrs",
    body: "What a weekend of focused building can produce. Services, budgets and processes at City Hall are overdue for a rethink.",
  },
];

const TRACKS = [
  {
    n: "01",
    title: "Housing",
    body: "Faster approvals, better data on what gets built where, tools for renters and first-time buyers, and plans to get housing starts moving again.",
  },
  {
    n: "02",
    title: "Transit",
    body: "Delay tracking, service reliability, rider feedback loops, and the operational or budget changes that make the TTC run on time.",
  },
  {
    n: "03",
    title: "Safer streets",
    body: "Community safety, lighting and road design, response times, and the neighbourhood-level tools that help people feel safe where they live.",
  },
  {
    n: "04",
    title: "Efficient government",
    body: "Cut the friction out of City services. Procurement, permits, 311, budgets, and anything that makes the City move faster for less.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Apply with an idea",
    body: "Tell us which track you're building in and who's on your team. Applications are reviewed on a rolling basis, so earlier is better.",
    when: "Closes Tue Oct 20 · 11:59pm",
  },
  {
    n: "02",
    title: "Build with a mentor",
    body: "Saturday opens with panels and roundtables with Toronto tech and policy leaders. Then building starts, with mentor hours, dinner and a late-night meal.",
    when: "Sat Oct 24 · 11:30am to midnight",
  },
  {
    n: "03",
    title: "Present at the finale",
    body: "Final sprints Sunday morning, submissions at noon, and the closing finale in the afternoon where the winner is announced.",
    when: "Sun Oct 25 · 8:00am to 3:45pm",
  },
];

type AgendaRow = { time: string; label: string; detail?: string };

const AGENDA: { day: string; date: string; theme: string; rows: AgendaRow[] }[] = [
  {
    day: "Day 01",
    date: "Saturday, Oct 24",
    theme: "Learn, then build",
    rows: [
      { time: "11:30am", label: "Doors open, casual networking" },
      { time: "12:00pm", label: "Lunch" },
      { time: "12:30pm", label: "Panel 1", detail: "Policy tech" },
      { time: "1:00pm", label: "Panel 2", detail: "Fintech" },
      { time: "1:30pm", label: "Panel 3", detail: "City building" },
      { time: "2:00pm", label: "Roundtables with panelists" },
      { time: "2:30pm", label: "Builder kickoff with mentors" },
      { time: "3:00pm", label: "Building starts" },
      { time: "6:30pm", label: "Mentor hours" },
      { time: "7:30pm", label: "Dinner" },
      { time: "12:00am", label: "Late-night meal" },
    ],
  },
  {
    day: "Day 02",
    date: "Sunday, Oct 25",
    theme: "Ship, then present",
    rows: [
      { time: "8:00am", label: "Breakfast, then final sprints" },
      { time: "9:00am", label: "Mentor hours", detail: "Until 10:00am" },
      { time: "12:00pm", label: "Submissions due" },
      { time: "12:15pm", label: "Roundtable over lunch" },
      { time: "3:00pm", label: "Closing finale" },
      { time: "3:30pm", label: "Winner announced" },
      { time: "3:45pm", label: "Networking and closing" },
    ],
  },
];

const ROLES = [
  {
    tag: "The core of the weekend",
    title: "Builders",
    body: "Students and early-career builders who want to spend a weekend on a team shipping something real for the city. Apply with a team and an idea, or solo and we'll match you. Developers, designers, policy students and operators all belong here.",
    note: "Apply by Oct 20",
    cta: { label: "Builder application", href: APPLY_URL },
  },
  {
    tag: "Guide a team",
    title: "Mentors",
    body: "Engineers, designers, and policy or city-building experts who want to sit with a team, unblock them, and push the work toward something City Hall can use.",
    note: "Approval required",
    cta: { label: "Request on Luma", href: LUMA_URL },
  },
  {
    tag: "Share what you know",
    title: "Speakers & panelists",
    body: "Leaders in policy tech, fintech and city building who want to speak on a Saturday panel or lead a roundtable.",
    note: "Invitation",
    cta: { label: "Request on Luma", href: LUMA_URL },
  },
  {
    tag: "See the work",
    title: "VIP guests",
    body: "Invited executives, investors and civic leaders joining for the panels, roundtables and the Sunday finale.",
    note: "Invitation only",
    cta: { label: "Request on Luma", href: LUMA_URL },
  },
];

const HOSTS = [
  {
    name: "Michael Lewski",
    links: [{ label: "Luma", href: "https://lu.ma/user/usr-lQHGIrFLXqAJK1n" }],
  },
  {
    name: "Berto Mill",
    links: [
      { label: "Luma", href: "https://lu.ma/user/bertomill" },
      { label: "Instagram", href: "https://instagram.com/bertomill" },
      { label: "X", href: "https://x.com/robert_vmill" },
    ],
  },
  {
    name: "Landon Gardner",
    links: [
      { label: "Luma", href: "https://lu.ma/user/landonogardner" },
      { label: "Instagram", href: "https://instagram.com/LandonOGX" },
      { label: "X", href: "https://x.com/LandonOGX" },
    ],
  },
];

export default function BetterTorontoBuildathonPage() {
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
          <a
            href={LUMA_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-foreground transition-opacity hover:opacity-70"
          >
            Luma
            <ArrowUpRight className="size-3.5" />
          </a>
        </div>

        {/* Hero */}
        <section id="overview">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-foreground">Oct 24 to 25</span>
            <span className="h-px w-8 bg-border" />
            <span>A municipal engagement weekend</span>
          </div>

          <h1 className="mt-[clamp(1rem,2.5vh,2rem)] font-display text-[clamp(2.75rem,9vw,7.5rem)] leading-[0.92] tracking-tight">
            Build a better
            <br />
            Toronto in
            <br />
            a weekend.
          </h1>

          <p className="mt-[clamp(1.25rem,3vh,2.25rem)] max-w-[55ch] text-[clamp(1rem,1.5vw,1.4rem)] text-muted-foreground">
            In 2022, Toronto developers rebuilt the ArriveCan app in under 48 hours. Imagine what we could build for this city in two days. Teams and mentors spend the weekend building an app, a working prototype, or a plan that makes City Hall work better.
          </p>

          <div className="mt-[clamp(1.5rem,4vh,2.5rem)] flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 bg-foreground px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background hover:opacity-90"
            >
              Apply as a builder <ArrowUpRight className="size-4" />
            </a>
            <a
              href={LUMA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border-b border-foreground/40 font-mono text-sm uppercase tracking-[0.18em] text-foreground hover:opacity-80"
            >
              Mentor, speak or attend <ArrowUpRight className="size-3.5" />
            </a>
          </div>

          <div className="mt-[clamp(2rem,5vh,3.5rem)] grid grid-cols-2 gap-x-12 gap-y-6 border-t border-border pt-6 sm:grid-cols-4">
            <Fact label="When" value="Sat Oct 24 to Sun Oct 25" />
            <Fact label="Where" value="Downtown Toronto" />
            <Fact label="Apply by" value="Tue Oct 20, 11:59pm" />
            <Fact label="Prize" value="Best work goes to City Hall" />
          </div>

          <figure className="mt-[clamp(2rem,5vh,3.5rem)] flex flex-col gap-3">
            <video
              className="aspect-video w-full rounded-lg border border-border bg-muted object-cover"
              src={`${ASSETS}/promo.mp4`}
              poster={`${ASSETS}/promo-poster.jpg`}
              controls
              playsInline
              preload="none"
            />
            <figcaption className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              48 seconds · from the organizers
            </figcaption>
          </figure>
        </section>

        {/* Why now */}
        <section id="why-now" className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={1} label="Why now" />
          <h2 className="max-w-[20ch] font-display text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            The city has problems worth solving.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Toronto is heading into a municipal election. These numbers are the reason this weekend exists. Pick one, bring a team, and build something City Hall can actually use.
          </p>
          <ul className="grid gap-[clamp(1.25rem,3vh,2rem)] sm:grid-cols-2">
            {STATS.map((stat) => (
              <li key={stat.track} className="flex flex-col gap-3 border-t border-border pt-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {stat.track}
                </span>
                <span className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-none tracking-tight">
                  {stat.figure}
                </span>
                <p className="max-w-[44ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {stat.body}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Tracks */}
        <section id="tracks" className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={2} label="Four tracks" />
          <h2 className="font-display text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Pick your fight.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Build tools that help residents with daily problems, or build the policy, service or budget idea that City Hall could act on. Both count. Both can win.
          </p>
          <ul className="flex flex-col">
            {TRACKS.map((track) => (
              <li
                key={track.n}
                className="grid grid-cols-1 gap-2 border-t border-border py-[clamp(1rem,2.5vh,1.5rem)] last:border-b sm:grid-cols-[6rem_16rem_1fr] sm:gap-6"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Track {track.n}
                </span>
                <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-tight">
                  {track.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{track.body}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-[clamp(1.25rem,3vw,2rem)]">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Idea starter
            </span>
            <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-tight">
              Close the loop on 311.
            </h3>
            <p className="max-w-[60ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
              Build a reporting mechanism that lets residents flag a problem, see it land with the right department, and track the City&apos;s response until it&apos;s fixed. Simple to describe, hard to do well, and exactly the kind of thing that gets adopted.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={3} label="How it works" />
          <h2 className="font-display text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Apply. Build. Present.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Builders apply as a team with an idea. Solo, or a team of two or three? Still apply. We&apos;ll match you with teammates and a mentor before the weekend starts.
          </p>
          <ul className="grid gap-[clamp(1.25rem,3vh,2rem)] sm:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="flex flex-col gap-3 border-t border-border pt-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {step.n}
                </span>
                <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-tight">
                  {step.title}
                </h3>
                <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {step.body}
                </p>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                  {step.when}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-[clamp(1.5rem,4vh,2.5rem)]">
            <h3 className="max-w-[22ch] font-display text-[clamp(1.75rem,4.5vw,3.5rem)] leading-[0.95] tracking-tight">
              After the election, the best work goes to City Hall.
            </h3>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              This isn&apos;t a demo for a demo&apos;s sake. The winning app, prototype or policy plan gets put in front of the people who can act on it.
            </p>
          </div>
        </section>

        {/* Agenda */}
        <section id="agenda" className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={4} label="Agenda" />
          <h2 className="font-display text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Two days, one deliverable.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Downtown Toronto. The exact address is sent on acceptance. Meals are on us, including the late-night one.
          </p>
          <div className="grid gap-[clamp(2rem,5vh,3rem)] lg:grid-cols-2 lg:gap-12">
            {AGENDA.map((day) => (
              <div key={day.day} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {day.day} · {day.theme}
                  </span>
                  <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-tight">
                    {day.date}
                  </h3>
                </div>
                <ul className="flex flex-col">
                  {day.rows.map((row) => (
                    <li
                      key={row.time + row.label}
                      className="grid grid-cols-[5.5rem_1fr] items-baseline gap-4 border-t border-border py-[clamp(0.55rem,1.4vh,0.9rem)] last:border-b"
                    >
                      <span className="font-mono text-sm tabular-nums text-foreground">{row.time}</span>
                      <span className="text-base tracking-tight">
                        {row.label}
                        {row.detail && (
                          <span className="ml-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {row.detail}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section id="who-its-for" className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={5} label="Who it's for" />
          <h2 className="max-w-[20ch] font-display text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Builders first. Everyone else welcome.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            All tickets are approval or invitation based. Pick the role that fits. Not sure where you fit? Request to join on Luma and tell us a bit about yourself.
          </p>
          <ul className="grid gap-[clamp(1.25rem,3vh,2rem)] sm:grid-cols-2">
            {ROLES.map((role) => (
              <li key={role.title} className="flex flex-col gap-3 border-t border-border pt-4">
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {role.tag}
                </span>
                <h3 className="font-display text-[clamp(1.5rem,3vw,2.25rem)] leading-tight tracking-tight">
                  {role.title}
                </h3>
                <p className="max-w-[44ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {role.body}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs uppercase tracking-[0.18em]">
                  <span className="text-muted-foreground">{role.note}</span>
                  <a
                    href={role.cta.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-foreground hover:opacity-70"
                  >
                    {role.cta.label} <ArrowUpRight className="size-3.5" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Hosts */}
        <section id="hosts" className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)]">
          <Eyebrow n={6} label="Hosts" />
          <h2 className="font-display text-[clamp(2rem,6vw,5rem)] leading-[0.95] tracking-tight">
            Run by people who live here.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Three Torontonians who think the city deserves better tools and better plans, and that a weekend is enough time to prove it.
          </p>
          <ul className="flex flex-col">
            {HOSTS.map((host) => (
              <li
                key={host.name}
                className="flex flex-col gap-2 border-t border-border py-[clamp(0.9rem,2vh,1.25rem)] last:border-b sm:flex-row sm:items-baseline sm:justify-between"
              >
                <span className="font-display text-[clamp(1.4rem,2.6vw,2rem)] tracking-tight">{host.name}</span>
                <span className="flex gap-4 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {host.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Apply */}
        <section
          id="apply"
          className="mt-[clamp(3rem,7vh,5rem)] flex scroll-mt-24 flex-col gap-[clamp(1.5rem,4vh,3rem)] border-t border-border pt-[clamp(2rem,5vh,3.5rem)]"
        >
          <Eyebrow n={7} label="Apply" />
          <h2 className="max-w-[18ch] font-display text-[clamp(2.5rem,8vw,7rem)] leading-[0.92] tracking-tight">
            Let&apos;s build a better Toronto.
          </h2>
          <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            We&apos;re looking for builders. Apply as a team, or apply solo and we&apos;ll match you. Applications are reviewed as they come in, and spots fill before the deadline.
          </p>
          <ApplyCountdown />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <a
              href={APPLY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 bg-foreground px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background hover:opacity-90"
            >
              Apply as a builder <ArrowUpRight className="size-4" />
            </a>
            <a
              href={LUMA_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 border-b border-foreground/40 font-mono text-sm uppercase tracking-[0.18em] text-foreground hover:opacity-80"
            >
              Event page on Luma <ArrowUpRight className="size-3.5" />
            </a>
          </div>
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
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <span className="font-display text-[clamp(1.1rem,1.8vw,1.5rem)] leading-tight tracking-tight">{value}</span>
    </div>
  );
}
