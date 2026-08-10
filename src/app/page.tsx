import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";
import { CopyLine } from "@/components/copy-line";
import { SlideNav } from "@/components/slide-nav";
import { LeftSidebar } from "@/components/left-sidebar";
import { LearningWall } from "@/components/learning-wall";
import { LearningWallTrigger } from "@/components/learning-wall-trigger";
import { WorkshopHelperWidget } from "@/components/workshop-helper-widget";
import { DemoSlots } from "@/components/demo-slots";
import { Clock } from "lucide-react";

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-[#e8f1fb] px-1.5 py-0.5 font-mono text-[0.9em] text-brand-dark">
      {children}
    </code>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

function SlackIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 122.8 122.8" fill="none" className={className} aria-hidden="true">
      <path
        d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zM32.3 77.6c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z"
        fill="#E01E5A"
      />
      <path
        d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zM45.2 32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z"
        fill="#36C5F0"
      />
      <path
        d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zM90.5 45.2c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z"
        fill="#2EB67D"
      />
      <path
        d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zM77.6 90.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z"
        fill="#ECB22E"
      />
    </svg>
  );
}

function Checkpoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-r-xl border-l-4 border-brand-dark bg-[#eaf4fe] px-4 py-3 text-sm">
      {children}
    </div>
  );
}

function StepBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge className="mb-3 w-fit bg-gradient-to-br from-brand to-brand-dark text-xs font-bold tracking-[0.12em] text-white uppercase">
      {children}
    </Badge>
  );
}

const schedule = [
  {
    time: "6:00 – 6:30 PM",
    title: "Intros",
    items: ["Food, non-alcoholic beverages, mingling 🍕"],
  },
  {
    time: "6:30 – 7:15 PM",
    title: "The State of AI Agents",
    items: [
      "Vercel Eve framework — Matias Gonzalez",
      "AI Agent MCP — Nazar Ponochevnyi",
      "Key principles — Danial Hasan",
    ],
  },
  {
    time: "7:15 – 8:15 PM",
    title: "Agent-Building Session",
    items: ["Groups of 4–6", "Instructors walking the room", "Everyone builds an agent"],
  },
  {
    time: "8:15 – 8:45 PM",
    title: "Demos",
    items: ["Zoom link for everyone", "3-minute demos × 10", "Use case, friction, next steps"],
  },
  {
    time: "8:45 – 9:00 PM",
    title: "Wrap Up",
    items: ["Connect with fellow builders"],
  },
];

const objectives = [
  {
    title: "Get set up with Cursor",
    detail: "Install the editor and get comfortable running an AI agent from its terminal.",
  },
  {
    title: "Get set up with Next.js",
    detail: "Have a working Next.js project ready to build in, locally on your machine.",
  },
  {
    title: "Get set up with Eve Agents",
    detail: "Scaffold an Eve agent project and understand its filesystem-first structure.",
  },
  {
    title: "Develop a use case",
    detail: "Turn an idea into a working agent you can keep building on after tonight.",
  },
];

const presenters = [
  {
    name: "Matias Gonzalez",
    role: "Design Engineer, Vercel",
    image: "/images/presenters/matias-gonzalez.png",
    linkedin: "https://www.linkedin.com/in/mgonzalezf/",
  },
  {
    name: "Nazar Ponochevnyi",
    role: "AI Agent MCP",
    image: "/images/presenters/nazar-ponochevnyi.png",
    linkedin: "https://www.linkedin.com/in/nazar-ponochevnyi/",
  },
  {
    name: "Danial Hasan",
    role: "Key principles",
    image: "/images/presenters/danial-hasan.png",
    linkedin: "https://www.linkedin.com/in/dhasandev/",
  },
  {
    name: "Kelly Sun",
    role: "Founder, AI Infrastructure Startup",
    image: "/images/presenters/kelly-sun.png",
    linkedin: "https://www.linkedin.com/in/sunkelly/",
  },
];

// Aggregated from the approved-guest list for tonight's event
// (docs/reference/AI Agent-Building Workshop @ TMU - Approved Guests - 2026-08-10.csv)
const attendeeStats = [
  { value: "51", label: "Builders confirmed" },
  { value: "47", label: "Shared a use case" },
  { value: "12", label: "AI tools named" },
  { value: "6", label: "Recurring themes" },
];

const attendeeTools = [
  { name: "Claude", count: 37 },
  { name: "ChatGPT", count: 29 },
  { name: "Gemini", count: 10 },
  { name: "Codex", count: 10 },
  { name: "Copilot", count: 4 },
  { name: "Cursor", count: 3 },
];

const attendeeThemes = [
  { label: "Build & ship ideas", count: 17 },
  { label: "Personal productivity", count: 15 },
  { label: "Business ops", count: 10 },
  { label: "Research & analysis", count: 8 },
  { label: "Marketing & social", count: 6 },
  { label: "Email & inbox", count: 6 },
];

// Anonymized — quotes are verbatim, attribution is intentionally omitted
const attendeeQuotes = [
  "Bridge the gap between ‘I have an idea’ and ‘it exists.’",
  "I need Jarvis from Iron Man.",
  "Do useful things non-stop for me, especially when my brain is fried.",
  "Help me with workflows day to day — like an actual competent co-worker.",
  "Take action on all my ideas simultaneously.",
  "Handle these tedious copy-and-paste tasks for me.",
];

// Step 2 is a hands-on 10-minute lab: each folder comes with something to
// actually open and change, not just a description to read.
const structure: { path: string; what: string; task: string }[] = [
  {
    path: "agent/instructions.md",
    what: "Your agent's always-on system prompt — its personality & job",
    task: "Open it and rewrite the personality. Ask your agent something and watch it answer differently.",
  },
  {
    path: "agent/tools/",
    what: "Typed functions the model can call",
    task: "Read a tool file, then add your own — a new file here becomes a new tool.",
  },
  {
    path: "agent/skills/",
    what: "Procedures loaded contextually when needed",
    task: "Skim a skill and notice when the agent decides to load it.",
  },
  {
    path: "agent/channels/",
    what: "HTTP & messaging entry points (Slack, webhooks, …)",
    task: "Peek at a channel and try wiring one up — Slack, a webhook, whatever you use.",
  },
];

export default function Home() {
  return (
    <main className="h-dvh snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <SlideNav />
      <LeftSidebar />
      <LearningWall />
      <WorkshopHelperWidget stacked />

      {/* Slide 1 — Hero */}
      <section
        data-slide
        id="hero"
        className="relative flex h-dvh snap-start items-end overflow-hidden"
      >
        <Image
          src="/images/makers-lounge-group.jpg"
          alt="Makers Lounge community gathered at the space"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink from-5% via-ink/85 via-50% to-ink/25" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/20 via-transparent to-transparent" />

        <div className="absolute top-8 right-8 z-10 flex items-center gap-5 md:top-10 md:right-10">
          <Image
            src="/vercel.svg"
            alt="Vercel logo"
            width={100}
            height={21}
            className="h-auto w-20 opacity-90 md:w-24"
          />
          <Image
            src="/byte_white-logo_s26.png"
            alt="Byte logo"
            width={140}
            height={140}
            className="h-auto w-16 opacity-90 md:w-20"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-20 pt-32 text-center text-white">
          <Image
            src="/icon.png"
            alt="Makers Lounge logo"
            width={88}
            height={88}
            className="mx-auto mb-6 h-[88px] w-[88px] rounded-2xl shadow-lg shadow-black/20"
          />
          <p className="mb-6 text-[13px] font-semibold tracking-[0.28em] text-brand-light uppercase">
            Welcome to
          </p>
          <h1 className="mb-6 text-7xl leading-[0.95] font-semibold tracking-tight text-balance md:text-9xl">
            Makers Lounge
          </h1>
          <p className="mx-auto mb-10 max-w-[600px] text-xl leading-relaxed text-white/80 md:text-2xl">
            A community of builders, founders, and makers — coming together to learn, ship, and
            grow together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="rounded-full bg-brand px-7 text-base font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark"
            >
              Explore the workshop
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="rounded-full px-7 text-base font-medium text-white hover:bg-white/10"
            >
              Visit makerslounge.ca ›
            </Button>
          </div>
          <p className="mt-14 text-xs font-medium tracking-[0.2em] text-white/50">
            BUILD&nbsp;·&nbsp;CONNECT&nbsp;·&nbsp;CREATE
          </p>
        </div>
      </section>

      {/* Slide 2 — Join Slack */}
      <section
        data-slide
        id="join-slack"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-gradient-to-b from-ink to-[#141f30] px-6 py-10 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.16),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-2xl text-center">
          <SlackIcon className="mx-auto mb-6 h-16 w-16" />
          <p className="mb-5 text-[13px] font-semibold tracking-[0.28em] text-brand-light uppercase">
            Stay connected
          </p>
          <h2 className="mb-4 text-5xl leading-[0.98] font-semibold tracking-tight text-balance md:text-7xl">
            Join Us on Slack
          </h2>
          <p className="mx-auto mb-8 max-w-[520px] text-lg leading-relaxed text-white/60 md:text-xl">
            Get help, share what you&apos;re building, and keep the conversation going after
            tonight.
          </p>
          <a
            href="https://join.slack.com/t/makerslounge/shared_invite/zt-43ly03o4m-Uz5arHN0w98OBU50_cPhsA"
            target="_blank"
            rel="noreferrer"
            className="mx-auto mb-4 block w-fit rounded-3xl bg-white p-5 shadow-2xl shadow-black/30 ring-1 ring-white/20 transition hover:scale-[1.02]"
          >
            <Image
              src="/images/slack-invite-qr.svg"
              alt="QR code linking to the Makers Lounge Slack invite"
              width={320}
              height={320}
              unoptimized
              className="h-[240px] w-[240px] md:h-[300px] md:w-[300px]"
            />
          </a>
          <p className="mb-6 text-sm font-medium tracking-wide text-white/50">
            Scan with your phone camera to join
          </p>
          <Button
            asChild
            size="lg"
            className="rounded-full bg-brand px-7 text-base font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark"
          >
            <a
              href="https://join.slack.com/t/makerslounge/shared_invite/zt-43ly03o4m-Uz5arHN0w98OBU50_cPhsA"
              target="_blank"
              rel="noreferrer"
            >
              Join the Slack
            </a>
          </Button>
        </div>
      </section>

      {/* Slide 3 — Itinerary */}
      <section
        data-slide
        id="itinerary"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-gradient-to-b from-ink to-[#141f30] px-6 py-10 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.16),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-5 text-[13px] font-semibold tracking-[0.28em] text-brand-light uppercase">
              Monday, August 10 · 6–9 PM
            </p>
            <h2 className="mb-4 text-5xl leading-[0.98] font-semibold tracking-tight text-balance md:text-7xl">
              Tonight&apos;s Itinerary
            </h2>
            <p className="mx-auto max-w-[520px] text-lg leading-relaxed text-white/60 md:text-xl">
              Work with expert coaches to get your very own agent up and running.
            </p>
          </div>

          <div className="space-y-6">
            {schedule.map((block) => (
              <div key={block.title} className="flex flex-col gap-1 text-left sm:flex-row sm:items-baseline sm:gap-6">
                <span className="w-fit shrink-0 font-mono text-sm font-medium tracking-wide text-brand-light/80 sm:w-[132px]">
                  {block.time}
                </span>
                <div className="min-w-0">
                  <div className="text-xl font-semibold md:text-2xl">{block.title}</div>
                  <div className="pl-4 text-base leading-snug text-white/50 md:text-lg">
                    {block.items.join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-brand px-7 text-base font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark"
            >
              <a href="https://luma.com/makers-vbwi" target="_blank" rel="noreferrer">
                RSVP on Luma
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Slide 2.5 — Objectives for this session */}
      <section
        data-slide
        id="objectives"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.10),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-4xl">
          <div className="mb-10 text-center">
            <p className="mb-5 text-[13px] font-semibold tracking-[0.28em] text-brand-dark uppercase">
              What you&apos;ll leave with
            </p>
            <h2 className="mb-4 text-5xl leading-[0.98] font-semibold tracking-tight text-balance md:text-7xl">
              Objectives for This Session
            </h2>
            <p className="mx-auto max-w-[560px] text-lg leading-relaxed text-ink-muted md:text-xl">
              Get everyone to a working AI agent use case they can take home and keep building on.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {objectives.map((objective, i) => (
              <Card key={objective.title} className="border-[#e3ecf5]">
                <CardContent className="flex items-start gap-4 px-6 py-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-base font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <span>
                    <p className="text-lg font-semibold">{objective.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">
                      {objective.detail}
                    </p>
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 3.5 — Thank you, TMU Byte (event host) */}
      <section
        data-slide
        id="thank-you-host"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.10),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-3xl text-center">
          <p className="mb-5 text-[13px] font-semibold tracking-[0.28em] text-brand-dark uppercase">
            Our event host
          </p>
          <h2 className="mb-4 text-5xl leading-[0.98] font-semibold tracking-tight text-balance md:text-7xl">
            Thank You, TMU Byte
          </h2>
          <p className="mx-auto max-w-[560px] text-lg leading-relaxed text-ink-muted md:text-xl">
            For hosting us and offering the space tonight.
          </p>

          <div className="mt-12">
            <Image
              src="/images/tmu-byte-logo-black.png"
              alt="TMU Byte"
              width={1600}
              height={568}
              className="mx-auto h-auto w-[280px] md:w-[400px]"
              priority={false}
            />
            <p className="mt-10 text-2xl font-semibold md:text-3xl">
              Build Your Technical Experience
            </p>
            <p className="mt-2 text-lg text-ink-muted md:text-xl">
              TMU&apos;s first project-based AI Lab.
            </p>
          </div>

          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-brand px-7 text-base font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark"
            >
              <a href="https://tmubyte.com" target="_blank" rel="noreferrer">
                Visit tmubyte.com
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Slide 4 — Thank you, presenters */}
      <section
        data-slide
        id="presenters"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-gradient-to-b from-ink to-[#141f30] px-6 py-10 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.16),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-5 text-[13px] font-semibold tracking-[0.28em] text-brand-light uppercase">
              With gratitude
            </p>
            <h2 className="mb-4 text-5xl leading-[0.98] font-semibold tracking-tight text-balance md:text-7xl">
              Thank You, Presenters
            </h2>
            <p className="mx-auto max-w-[520px] text-lg leading-relaxed text-white/60 md:text-xl">
              Tonight&apos;s session wouldn&apos;t happen without them.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {presenters.map((presenter) => (
              <div
                key={presenter.name}
                className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/[0.04] px-8 py-10 text-center backdrop-blur-sm"
              >
                {presenter.image ? (
                  <Image
                    src={presenter.image}
                    alt={presenter.name}
                    width={160}
                    height={160}
                    className="mb-6 h-36 w-36 rounded-full object-cover shadow-lg shadow-black/20"
                  />
                ) : (
                  <div className="mb-6 flex h-36 w-36 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold text-white/70">
                    {presenter.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                )}
                <span className="text-xl font-semibold">{presenter.name}</span>
                <span className="mt-1 text-base text-white/50">{presenter.role}</span>
                {presenter.linkedin && (
                  <a
                    href={presenter.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <LinkedInIcon className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 4.5 — Who's in the room tonight */}
      <section
        data-slide
        id="attendees"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-gradient-to-b from-[#141f30] to-ink px-6 py-10 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.16),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="mb-6 text-center">
            <p className="mb-4 text-[13px] font-semibold tracking-[0.28em] text-brand-light uppercase">
              In the room tonight
            </p>
            <h2 className="mb-3 text-5xl leading-[0.98] font-semibold tracking-tight text-balance md:text-7xl">
              51 Builders in the Room
            </h2>
            <p className="mx-auto max-w-[600px] text-lg leading-relaxed text-white/60 md:text-xl">
              Here&apos;s what you told us on the way in.
            </p>
            <p className="mt-3 text-sm font-medium text-brand-light/80 md:text-base">
              Let&apos;s hear from you! 👋
            </p>
          </div>

          <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {attendeeStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-4 text-center backdrop-blur-sm"
              >
                <div className="text-5xl font-semibold tracking-tight text-brand-light md:text-6xl">
                  {stat.value}
                </div>
                <div className="mt-1.5 text-sm text-white/50 md:text-base">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-brand-light uppercase">
                Tools you already use
              </p>
              <div className="space-y-2">
                {attendeeTools.map((tool) => (
                  <div key={tool.name} className="flex items-center gap-3">
                    <span className="w-[92px] shrink-0 text-base text-white/70 md:text-lg">{tool.name}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand to-brand-light"
                        style={{ width: `${Math.round((tool.count / 51) * 100)}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-base text-white/50 md:text-lg">
                      {tool.count}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-6 mb-3 text-sm font-semibold tracking-[0.2em] text-brand-light uppercase">
                What you want agents to do
              </p>
              <div className="flex flex-wrap gap-2">
                {attendeeThemes.map((theme) => (
                  <span
                    key={theme.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-1.5 text-base text-white/75 md:text-lg"
                  >
                    {theme.label}
                    <span className="font-mono text-sm text-brand-light">{theme.count}</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold tracking-[0.2em] text-brand-light uppercase">
                In your own words
              </p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {attendeeQuotes.map((quote) => (
                  <blockquote
                    key={quote}
                    className="flex items-center rounded-xl border border-white/8 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
                  >
                    <p className="text-base leading-snug text-white/85 md:text-lg">
                      &ldquo;{quote}&rdquo;
                    </p>
                  </blockquote>
                ))}
              </div>

              <div className="mt-5 border-t border-white/8 pt-5">
                <LearningWallTrigger />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Slide 5 — Step 0 */}
      <section
        data-slide
        id="install-cursor"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <StepBadge>Step 0</StepBadge>
            <h3 className="mb-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              Install Cursor
            </h3>
            <p className="mx-auto max-w-[560px] text-sm text-ink-muted md:text-base">
              Download it, open it, then click <strong className="text-ink">Open project</strong>.
            </p>
          </div>
          <Image
            src="/images/cursor-download-page.png"
            alt="Cursor's download page with the Download for macOS button highlighted"
            width={2000}
            height={1424}
            className="my-3 h-auto max-h-[68vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              <a href="https://cursor.com/lp/agent-workflow" target="_blank" rel="noreferrer">
                Download Cursor →
              </a>
            </Button>
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> Cursor is installed,
              open, and its built-in terminal is ready (<Inline>Ctrl+`</Inline>).
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 7 — Pick your AI agent */}
      <section
        data-slide
        id="ask-cursor"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-base font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              Prefer chat?
            </Badge>
            <h3 className="mb-1.5 text-4xl font-extrabold tracking-tight md:text-5xl">
              Pick your AI agent
            </h3>
            <p className="mx-auto max-w-[640px] text-lg text-ink-muted md:text-xl">
              Open Cursor&apos;s built-in terminal (<Inline>Ctrl+`</Inline>) and run whichever
              agent matches your subscription — it can run the same setup steps for you.
            </p>
          </div>
          <div className="my-6 grid w-full max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
            <Card className="border-[#e3ecf5]">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <Image
                  src="/images/claude-logo.png"
                  alt="Claude logo"
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
                <span className="text-base font-bold tracking-[0.1em] text-brand-dark uppercase">
                  Have a Claude subscription
                </span>
                <p className="text-2xl font-extrabold">Claude Code</p>
                <Badge
                  variant="outline"
                  className="w-fit border-amber-300 bg-amber-50 text-xs font-bold tracking-[0.08em] text-amber-700 uppercase"
                >
                  Subscription Required
                </Badge>
                <Inline>claude</Inline>
                <a
                  href="https://code.claude.com/docs/en/quickstart"
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold text-brand-dark hover:underline"
                >
                  Quickstart docs →
                </a>
              </CardContent>
            </Card>
            <Card className="border-[#e3ecf5]">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <Image
                  src="/images/codex-logo.png"
                  alt="Codex logo"
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
                <span className="text-base font-bold tracking-[0.1em] text-brand-dark uppercase">
                  Have a Codex subscription
                </span>
                <p className="text-2xl font-extrabold">Codex</p>
                <Badge
                  variant="outline"
                  className="w-fit border-amber-300 bg-amber-50 text-xs font-bold tracking-[0.08em] text-amber-700 uppercase"
                >
                  Subscription Required
                </Badge>
                <Inline>codex</Inline>
                <a
                  href="https://learn.chatgpt.com/docs/codex/cli"
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold text-brand-dark hover:underline"
                >
                  CLI docs →
                </a>
              </CardContent>
            </Card>
            <Card className="border-[#e3ecf5]">
              <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
                <Image
                  src="/images/opencode-logo.png"
                  alt="OpenCode logo"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-md"
                />
                <span className="text-base font-bold tracking-[0.1em] text-brand-dark uppercase">
                  Have neither
                </span>
                <p className="text-2xl font-extrabold">OpenCode</p>
                <Badge
                  variant="outline"
                  className="w-fit border-emerald-300 bg-emerald-50 text-xs font-bold tracking-[0.08em] text-emerald-700 uppercase"
                >
                  Open Source - Free
                </Badge>
                <Inline>opencode</Inline>
                <a
                  href="https://opencode.ai/docs/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-base font-semibold text-brand-dark hover:underline"
                >
                  Docs →
                </a>
              </CardContent>
            </Card>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> click{" "}
              <strong className="text-ink">Add Vercel</strong> when it shows up.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8 — Build a UI for it */}
      <section
        data-slide
        id="build-ui"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              Level up
            </Badge>
            <h3 className="mb-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              Build a UI for your agent
            </h3>
            <p className="mx-auto max-w-[600px] text-sm text-ink-muted md:text-base">
              Once Eve is installed, keep chatting with opencode — ask it to build a showcase app
              with a chat interface using shadcn and Vercel&apos;s AI Elements kit.
            </p>
          </div>
          <Image
            src="/images/opencode-ask-ui.png"
            alt="opencode's terminal with a prompt asking it to build a Next.js and shadcn app with a chat interface using Vercel AI Elements"
            width={2000}
            height={1310}
            className="my-3 h-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <CopyLine
              text="I want to explore Vercel's eve agent framework. I want to build out a Next JS application where I can visualize everything the Eve framework can do, and be able to customize it to my specific use case. First, build a next js app using Shadcn components, and Vercel AI elements components to build out this simple app for this workshop. Next, install the eve agent framwork into this application. Then, tell me what is needed from me to get the app up and running"
              className="max-w-xl"
            />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> a chat UI opens where you
              can talk to your agent — no terminal required.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8a — Run the dev server */}
      <section
        data-slide
        id="run-dev-server"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              See it live
            </Badge>
            <h3 className="mb-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              Run the dev server
            </h3>
            <p className="mx-auto max-w-[600px] text-sm text-ink-muted md:text-base">
              Once the app is scaffolded, open a terminal in your project folder and start it up.
              Then visit <Inline>http://localhost:3000</Inline> to see your agent&apos;s UI.
            </p>
          </div>
          <Image
            src="/images/run-dev-server.png"
            alt="An editor terminal in the eve-agent-workshop project running npm run dev"
            width={2000}
            height={1310}
            className="my-3 h-auto max-h-[72vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <CopyLine text="npm run dev" className="max-w-xs" />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> your app loads at{" "}
              <Inline>localhost:3000</Inline>.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8b — While that's running: set up PAM */}
      <section
        data-slide
        id="setup-pam"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              While that&apos;s running
            </Badge>
            <h3 className="mb-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              Setting up PAM
            </h3>
            <p className="mx-auto max-w-[640px] text-sm text-ink-muted md:text-base">
              Your agent doesn&apos;t know your company. PAM Memory gives it persistent
              organizational context — no ingestion pipelines, no schema mapping. Grab a key at{" "}
              <a
                href="https://pam.harmix.ai"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-brand-dark hover:underline"
              >
                pam.harmix.ai
              </a>{" "}
              while opencode builds.
            </p>
          </div>
          <Image
            src="/images/pam-landing.png"
            alt="PAM landing page showing the MCP server config for pam_memory"
            width={2000}
            height={1302}
            className="my-3 h-auto max-h-[62vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> you have a{" "}
              <Inline>pam_mkey_…</Inline> key and the <Inline>pam_memory</Inline> MCP server added
              to Claude Code or Cursor.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 9 — Step 1 */}
      <section
        data-slide
        id="step-1"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <StepBadge>Step 1</StepBadge>
          <h3 className="mb-2.5 text-2xl font-extrabold tracking-tight md:text-3xl">
            Connect a model
          </h3>
          <p className="max-w-[640px] text-ink-muted">
            Eve talks to AI models through the <strong>Vercel AI Gateway</strong> by default. The
            easiest path: link the project to your Vercel account and Eve authenticates
            automatically.
          </p>
          <CodeBlock lines={["# from inside your agent folder", "vercel link", "", "npm run dev"]} />
          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> send your agent a message
            and get a real response back.
          </Checkpoint>

          <div className="mt-3 rounded-xl border border-dashed border-brand/30 bg-brand/5 px-4 py-3">
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">No Vercel account tonight?</strong> Paste this into
              your agent&apos;s <Inline>.env.local</Inline> instead — a shared key for the room,
              capped at $20 for the night, so be kind to it.
            </p>
            <CodeBlock
              lines={[
                "# tonight's shared workshop key — capped at $20, be kind!",
                "AI_GATEWAY_API_KEY=vck_2gBjXeEqEs7j0yDNVS5OXEaAtuNAxrK9zJPKbwaPzQotsmFAkj1y8x3p",
              ]}
              copyText="vck_2gBjXeEqEs7j0yDNVS5OXEaAtuNAxrK9zJPKbwaPzQotsmFAkj1y8x3p"
            />
          </div>
        </div>
      </section>

      {/* Slide 10 — Step 2 */}
      <section
        data-slide
        id="step-2"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <StepBadge>Step 2</StepBadge>
            <Badge className="mb-3 w-fit gap-1.5 bg-white text-xs font-bold tracking-[0.06em] text-brand-dark uppercase ring-1 ring-brand/25">
              <Clock className="size-3.5" />
              10 min · hands on
            </Badge>
          </div>
          <h3 className="mb-2 text-2xl font-extrabold tracking-tight md:text-3xl">
            Poke around your agent
          </h3>
          <p className="max-w-[660px] text-sm text-ink-muted md:text-base">
            Eve is <strong className="text-ink">filesystem-first</strong>: you teach your agent by
            adding files under <Inline>agent/</Inline>. A file at{" "}
            <Inline>agent/tools/get_weather.ts</Inline> becomes the <Inline>get_weather</Inline>{" "}
            tool. Spend the next 10 minutes <strong className="text-ink">opening these files</strong>{" "}
            and changing things — you can&apos;t break anything that <Inline>git checkout</Inline>{" "}
            won&apos;t fix.
          </p>

          <ul className="mt-4 grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {structure.map(({ path, what, task }, i) => (
              <li
                key={path}
                className="rounded-xl border border-[#e3ecf5] bg-white px-3.5 py-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e8f1fb] text-[11px] font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <code className="truncate font-mono text-[13px] font-semibold text-brand-dark">
                    {path}
                  </code>
                </div>
                <p className="mt-1.5 text-xs text-ink-muted">{what}</p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink">
                  <span className="font-semibold text-brand-dark">Try it: </span>
                  {task}
                </p>
              </li>
            ))}
          </ul>

          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> you&apos;ve read at least
            one file in every folder, edited <Inline>instructions.md</Inline>, and got your agent to
            answer in a voice you gave it. Stuck? Ask a neighbour, or ask the helper agent in the
            corner. 💬
          </Checkpoint>

          <div className="mt-4 text-center">
            <Button
              asChild
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              <a href="https://eve.dev/docs/getting-started" target="_blank" rel="noreferrer">
                Full docs at eve.dev →
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Slide 11 — Demo time */}
      <section
        data-slide
        id="demo-time"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <StepBadge>Demo time! 🎤</StepBadge>
            <Badge className="mb-3 w-fit gap-1.5 bg-white text-xs font-bold tracking-[0.06em] text-brand-dark uppercase ring-1 ring-brand/25">
              <Clock className="size-3.5" />
              2 min each
            </Badge>
          </div>
          <h3 className="mb-2 text-2xl font-extrabold tracking-tight md:text-3xl">
            Show us what you built
          </h3>
          <p className="max-w-[660px] text-sm text-ink-muted md:text-base">
            Eight slots, first come first serve — put your name down and take two minutes at the
            front. Half-working counts. Broken-but-interesting <em>really</em> counts.
          </p>

          <div className="mt-4">
            <DemoSlots />
          </div>
        </div>
      </section>
    </main>
  );
}
