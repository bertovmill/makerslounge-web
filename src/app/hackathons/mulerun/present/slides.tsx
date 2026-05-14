import {
  Briefcase,
  Building2,
  Calendar,
  Globe,
  Megaphone,
  PenLine,
  PenTool,
  Search,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import SlideMuleRun from "./SlideMuleRun";

export type Slide = {
  n: number;
  slug: string;
  title: string;
  Component: () => React.ReactElement;
};

export const SLIDES: Slide[] = [
  { n: 1, slug: "title", title: "Title", Component: SlideTitle },
  { n: 2, slug: "tonight", title: "Tonight", Component: SlideTonight },
  { n: 3, slug: "schedule", title: "Schedule", Component: SlideSchedule },
  { n: 4, slug: "mulerun", title: "MuleRun", Component: SlideMuleRun },
  { n: 5, slug: "good-for", title: "Good for", Component: SlideUseCases },
  { n: 6, slug: "teams", title: "Teams", Component: SlideTeams },
  { n: 7, slug: "prizes", title: "Prizes", Component: SlidePrizes },
  { n: 8, slug: "judging", title: "Judging", Component: SlideJudging },
  { n: 9, slug: "demos", title: "Demos", Component: SlideDemos },
  { n: 10, slug: "house-rules", title: "House rules", Component: SlideLogistics },
  { n: 11, slug: "partners", title: "Partners", Component: SlidePartners },
  { n: 12, slug: "build", title: "Build", Component: SlideBuild },
];

export const SLIDE_COUNT = SLIDES.length;

export function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

/* ---------- Slide chrome ---------- */

function Eyebrow({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-[clamp(1.5rem,4vh,3rem)] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-foreground">{pad2(n)}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </div>
  );
}

function StatRow({
  items,
}: {
  items: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="grid grid-cols-3 border-t border-border pt-5">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <span className="font-serif text-[clamp(1.75rem,4vw,4rem)] leading-none tracking-tight">
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

/* ---------- Slides ---------- */

function SlideTitle() {
  return (
    <div className="flex h-full flex-col">
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-foreground/95 py-1.5 pl-1.5 pr-3 shadow-[0_4px_20px_rgba(0,0,0,0.12)]">
        <div className="flex size-7 items-center justify-center rounded-full bg-background">
          <Image
            src="/logos/logo.svg"
            alt="MakersLounge"
            width={28}
            height={28}
            priority
            className="size-4 object-contain"
          />
        </div>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-background/70">
          ×
        </span>
        <div className="flex items-center gap-1.5">
          <Image
            src="/partners/mulerun-logo.png"
            alt="MuleRun"
            width={64}
            height={64}
            priority
            className="size-5 rounded-sm object-contain"
          />
          <span className="font-mono text-xs font-medium uppercase tracking-[0.14em] text-background">
            Mule Run
          </span>
        </div>
      </div>
      <div className="my-auto">
        <h1 className="font-serif text-[clamp(3rem,12vw,11rem)] leading-[0.92] tracking-tight">
          AI Hackathon
          <br />
          Night.
        </h1>
        <p className="mt-[clamp(1.25rem,3vh,2.25rem)] max-w-[42ch] text-[clamp(1rem,1.5vw,1.4rem)] text-muted-foreground">
          Build an AI agent. Demo it. Win cash.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-foreground">Thursday May 14, 2026</span>
          <span>510 Front St W, Suite 400, Toronto</span>
        </div>
        <span>6:00 — 9:00 PM</span>
      </div>
    </div>
  );
}

function SlideTonight() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={1} label="Tonight" />
      <div className="flex flex-col justify-center gap-[clamp(1rem,3vh,2.5rem)]">
        <h2 className="max-w-[18ch] font-serif text-[clamp(2.5rem,8.5vw,8rem)] leading-[0.95] tracking-tight">
          One night. One agent. One demo.
        </h2>
        <p className="max-w-[55ch] text-[clamp(1.05rem,1.6vw,1.6rem)] text-muted-foreground">
          This isn&apos;t a workshop — it&apos;s a competition. You have a couple of hours to design, build, and pitch your own AI agent using MuleRun. Best builds take home the prizes.
        </p>
      </div>
      <StatRow
        items={[
          { value: "2h", label: "To build" },
          { value: "$15", label: "MuleRun credits each" },
          { value: "Top 3", label: "Cash prizes" },
        ]}
      />
    </div>
  );
}

function SlideSchedule() {
  const rows = [
    { time: "6:00 PM", end: "6:15 PM", label: "Intro and kickoff" },
    { time: "6:15 PM", end: "8:15 PM", label: "Hack time" },
    { time: "8:15 PM", end: "9:00 PM", label: "Demos and judging" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={2} label="Schedule" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Tonight at a glance.
        </h2>
        <ul className="flex flex-col">
          {rows.map((row) => (
            <li
              key={row.time}
              className="grid grid-cols-[7rem_1fr_auto] items-baseline gap-4 border-t border-border py-[clamp(0.75rem,1.8vh,1.25rem)] sm:grid-cols-[10rem_1fr_auto]"
            >
              <span className="font-mono text-[clamp(0.85rem,1.4vw,1.1rem)] tabular-nums text-foreground">
                {row.time}
              </span>
              <span className="font-serif text-[clamp(1.25rem,2.5vw,2.25rem)] tracking-tight">
                {row.label}
              </span>
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                to {row.end}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}


function SlideUseCases() {
  const groups = [
    {
      Icon: Sparkles,
      name: "Entertainment",
      items: ["Image gen", "Video gen", "For fun"],
    },
    {
      Icon: Calendar,
      name: "Life assistant",
      items: ["Admin", "Planning", "Helpers"],
    },
    {
      Icon: PenTool,
      name: "Design",
      items: ["Image editing", "Ecommerce", "Marketing"],
    },
    {
      Icon: PenLine,
      name: "Content",
      items: ["Writing", "Video editing", "Slides"],
    },
    {
      Icon: Megaphone,
      name: "Marketing",
      items: ["Social media", "Influencer", "Growth"],
    },
    {
      Icon: Briefcase,
      name: "Jobs",
      items: ["Job seeking", "Recruiting"],
    },
    {
      Icon: Search,
      name: "Research & data",
      items: ["Discovery", "Analysis", "Dashboards"],
    },
    {
      Icon: Globe,
      name: "Web",
      items: ["Sites", "Landing pages", "Portfolios"],
    },
    {
      Icon: Building2,
      name: "Verticals",
      items: ["Investment", "Contracts", "Education"],
    },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-[clamp(1rem,3vh,2rem)]">
      <Eyebrow n={4} label="Good for" />
      <div className="flex flex-col justify-center gap-[clamp(1rem,2.5vh,2rem)]">
        <div className="flex flex-col gap-3">
          <h2 className="max-w-[22ch] font-serif text-[clamp(2.25rem,6vw,5.5rem)] leading-[0.95] tracking-tight">
            What you can build.
          </h2>
          <p className="max-w-[50ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
            Thousands of pre-made agents across these categories. Pick one. Remix it.
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <li
              key={g.name}
              className="flex flex-col gap-2.5 rounded-lg border border-border bg-card/30 p-3 transition-colors hover:border-foreground/40 hover:bg-card/60 sm:p-4"
            >
              <g.Icon className="size-5 text-foreground" strokeWidth={1.5} />
              <h3 className="font-serif text-[clamp(1.15rem,1.8vw,1.6rem)] leading-tight tracking-tight">
                {g.name}
              </h3>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {g.items.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-border bg-background/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SlideTeams() {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(
    "https://makerslounge.ca/hackathons/mulerun/signup"
  )}`;
  const steps = [
    { tag: "01", body: "Scan the code, no login needed." },
    { tag: "02", body: "Type your name, pick 1–3 interests." },
    { tag: "03", body: "We match you with 1–2 builders who picked similar things." },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-[clamp(1rem,3vh,2rem)]">
      <Eyebrow n={5} label="Team up" />
      <div className="grid items-center gap-[clamp(1.5rem,4vw,4rem)] lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-[clamp(1.25rem,3vh,2.5rem)]">
          <div className="flex flex-col gap-3">
            <h2 className="max-w-[18ch] font-serif text-[clamp(2.25rem,7vw,6rem)] leading-[0.95] tracking-tight">
              Scan to find your team.
            </h2>
            <p className="max-w-[40ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
              Point your camera at the QR. Pick what you want to build. We&apos;ll match teams of 2–3 by overlapping interests.
            </p>
          </div>
          <ol className="flex flex-col">
            {steps.map((s) => (
              <li
                key={s.tag}
                className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-3 border-t border-border py-[clamp(0.6rem,1.4vh,1rem)] last:border-b"
              >
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                  {s.tag}
                </span>
                <span className="font-serif text-[clamp(1.1rem,2vw,1.6rem)] leading-tight tracking-tight">
                  {s.body}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Or open
            </span>
            <span className="font-mono text-sm tracking-tight text-foreground">
              makerslounge.ca/hackathons/mulerun/signup
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="rounded-2xl border border-border bg-white p-[clamp(0.75rem,2vw,1.5rem)] shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Scan to join the Mulerun matching form"
              width={420}
              height={420}
              className="h-[clamp(13rem,28vw,22rem)] w-[clamp(13rem,28vw,22rem)] object-contain"
            />
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            iPhone camera works
          </span>
        </div>
      </div>
    </div>
  );
}

function SlidePrizes() {
  const prizes = [
    { place: "1st", detail: "Top cash prize" },
    { place: "2nd", detail: "Runner-up cash" },
    { place: "3rd", detail: "Third-place cash" },
    { place: "All", detail: "$15 MuleRun credits + food" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={6} label="Prizes" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.9] tracking-tight">
          What you can win.
        </h2>
        <ul className="flex flex-col gap-2">
          {prizes.map((p) => (
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
      </div>
    </div>
  );
}

function SlideJudging() {
  const criteria = [
    { tag: "Craft", body: "Does it actually work? Clean execution wins." },
    { tag: "Idea", body: "Is the use case real? Would someone use this?" },
    { tag: "Pitch", body: "Can you explain it in 2 minutes flat?" },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={7} label="Judging" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="max-w-[22ch] font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          What we&apos;re looking for.
        </h2>
        <ul className="grid gap-[clamp(1rem,3vh,2rem)] md:grid-cols-3">
          {criteria.map((c) => (
            <li key={c.tag} className="flex flex-col gap-3 border-t border-border pt-4">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                {c.tag}
              </span>
              <p className="max-w-[36ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SlideDemos() {
  const flow = [
    { time: "8:15 PM", label: "Demos kick off. We call teams up in order." },
    { time: "3 min", label: "Live on stage. Run the agent in front of the room." },
    { time: "Wave-off", label: "Hard three-minute cap — yes, even mid-sentence." },
    { time: "No Q&A", label: "Demo and step down. Keep the pace." },
    { time: "~8:45 PM", label: "Last team done. Judges step out to deliberate." },
    { time: "5–10 min", label: "Judges decide. The rest of us hang." },
    { time: "~9:00 PM", label: "Winners announced. Prizes paid out." },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-[clamp(1rem,3vh,2rem)]">
      <Eyebrow n={8} label="Demos" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <div className="flex flex-col gap-3">
          <h2 className="max-w-[18ch] font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.92] tracking-tight">
            Demo time.
          </h2>
          <p className="max-w-[55ch] text-[clamp(1rem,1.5vw,1.4rem)] text-muted-foreground">
            Up to 10 teams. Three minutes each. No questions.
          </p>
        </div>
        <ul className="flex flex-col">
          {flow.map((row) => (
            <li
              key={row.time}
              className="grid grid-cols-[6rem_1fr] items-baseline gap-4 border-t border-border py-[clamp(0.55rem,1.3vh,0.9rem)] last:border-b sm:grid-cols-[9rem_1fr]"
            >
              <span className="font-mono text-[clamp(0.85rem,1.3vw,1.05rem)] tabular-nums text-foreground">
                {row.time}
              </span>
              <span className="font-serif text-[clamp(1.1rem,2vw,1.6rem)] tracking-tight">
                {row.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SlideLogistics() {
  const rules = [
    {
      tag: "Stay in",
      body: "Stick to the event area. Please don't wander into workstations or private offices.",
    },
    {
      tag: "Stepping out",
      body: "Heading to the bathroom or leaving early? Let a host know.",
    },
    {
      tag: "Bathrooms",
      body: "By the elevators on the 4th floor.",
    },
    {
      tag: "Food",
      body: "Help yourselves — it's by the entry.",
    },
    {
      tag: "WiFi",
      body: "Network + password in the top-right of every slide.",
    },
    {
      tag: "Need anything",
      body: "Find Berto or anyone with a MakersLounge tee.",
    },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-[clamp(1rem,3vh,2rem)]">
      <Eyebrow n={9} label="House rules" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <div className="flex flex-col gap-3">
          <h2 className="max-w-[18ch] font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.92] tracking-tight">
            No photos in the office.
          </h2>
          <p className="max-w-[55ch] text-[clamp(0.95rem,1.3vw,1.2rem)] text-muted-foreground">
            This is an active office and we&apos;re guests here. Out of respect for the teams that work in this space, keep cameras down indoors.
          </p>
        </div>
        <ul className="grid gap-x-[clamp(1.5rem,4vw,3rem)] gap-y-0 sm:grid-cols-2">
          {rules.map((r) => (
            <li
              key={r.tag}
              className="grid grid-cols-[6.5rem_1fr] items-baseline gap-3 border-t border-border py-[clamp(0.5rem,1.3vh,0.9rem)] sm:grid-cols-[8rem_1fr] sm:gap-4"
            >
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
                {r.tag}
              </span>
              <span className="text-sm text-muted-foreground sm:text-base">
                {r.body}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SlidePartners() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={10} label="Thank you" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="max-w-[22ch] font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Tonight is made possible by our partners.
        </h2>
        <div className="grid gap-[clamp(1.5rem,4vh,3rem)] md:grid-cols-2">
          <div className="flex flex-col gap-3 border-t border-foreground pt-4">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
              Venue + WiFi
            </span>
            <h3 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-tight">
              Disruptive Edge
            </h3>
          </div>
          <div className="flex flex-col gap-3 border-t border-foreground pt-4">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
              Co-host
            </span>
            <h3 className="font-serif text-[clamp(1.75rem,4vw,3rem)] leading-tight tracking-tight">
              Aucctus AI
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideBuild() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={11} label="Go" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[14ch] font-serif text-[clamp(3.5rem,14vw,14rem)] leading-[0.9] tracking-tight">
          Let&apos;s build.
        </h2>
        <p className="max-w-[55ch] text-[clamp(1rem,1.6vw,1.5rem)] text-muted-foreground">
          The clock is on. Demos at 8:15. Win or learn — either way, you&apos;ll ship something tonight.
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-foreground">
          <span>#MuleRun</span>
          <span>#MakersLounge</span>
          <span>#BuildInPublic</span>
        </div>
        <span>makerslounge.ca / hackathons / mulerun</span>
      </div>
    </div>
  );
}
