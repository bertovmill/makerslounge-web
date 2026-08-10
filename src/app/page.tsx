import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";
import { CopyLine } from "@/components/copy-line";
import { SlideNav } from "@/components/slide-nav";
import { LeftSidebar } from "@/components/left-sidebar";
import { WorkshopHelperWidget } from "@/components/workshop-helper-widget";
import { DemoSlots } from "@/components/demo-slots";
import { CalendarDays, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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

function Checkpoint({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-3 rounded-r-xl border-l-4 border-brand-dark bg-[#eaf4fe] px-4 py-3 text-sm",
        className,
      )}
    >
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

// Deliberately title-only — these read from the back of the room, and the
// nuance gets said out loud rather than printed under each one.
const overarchingGoals = [
  "What are AI agents?",
  "How do you deploy one?",
  "What are the best use cases?",
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

const workshopTips = [
  "Ask lots of questions",
  "Try the hard things",
  "Share your work, wherever you get",
];

const presenters = [
  {
    name: "Matias Gonzalez",
    role: "Design Engineer, Vercel",
    image: "/images/presenters/matias-gonzalez.png",
    time: "6:30 PM",
    linkedin: "https://www.linkedin.com/in/mgonzalezf/",
  },
  {
    name: "Nazar Ponochevnyi",
    role: "AI Agent MCP",
    image: "/images/presenters/nazar-ponochevnyi.png",
    time: "6:45 PM",
    linkedin: "https://www.linkedin.com/in/nazar-ponochevnyi/",
  },
  {
    name: "Danial Hasan",
    role: "Key principles",
    image: "/images/presenters/danial-hasan.png",
    time: "7:00 PM",
    linkedin: "https://www.linkedin.com/in/dhasandev/",
  },
  {
    name: "Kelly Sun",
    role: "Founder, AI Infrastructure Startup",
    image: "/images/presenters/kelly-sun.png",
    time: "7:10 PM",
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

// Step 2 is a hands-on lab, so the slide stays deliberately sparse — one line
// per folder, and the talking happens out loud in the room.
const structure: { path: string; what: string }[] = [
  { path: "agent/instructions.md", what: "Its personality & job" },
  { path: "agent/tools/", what: "Functions it can call" },
  { path: "agent/skills/", what: "Procedures it loads when needed" },
  { path: "agent/channels/", what: "Slack, webhooks, HTTP" },
];

// Closing slide: everything we want people to scan before they leave the room.
const stayInTouch: {
  id: string;
  title: string;
  blurb: string;
  cta: string;
  href: string;
  qr: string;
  Icon: typeof CalendarDays;
}[] = [
  {
    id: "tmu-cyber-summit",
    title: "TMU Cyber Summit",
    blurb: "Register your interest for the summit at Toronto Metropolitan University.",
    cta: "Register",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSdTXJmwg4CDZouFuuRKnW73MgkD35Jf0kDWm0RCjySXCTE1IA/viewform",
    qr: "/images/qr-tmu-cyber-summit.svg",
    Icon: ShieldCheck,
  },
  {
    id: "makerslounge-calendar",
    title: "Makers Lounge calendar",
    blurb: "Every upcoming session at the lounge — come back and build with us.",
    cta: "See what's on",
    href: "https://luma.com/calendar/manage/cal-FGHayLJ6ZAmkYJi",
    qr: "/images/qr-makerslounge-calendar.svg",
    Icon: CalendarDays,
  },
];

export default function Home() {
  return (
    <main className="h-dvh snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <SlideNav />
      <LeftSidebar />
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

        <p className="absolute inset-x-0 bottom-6 z-10 text-center text-xs font-medium tracking-[0.2em] text-white/40">
          6:15&nbsp;PM
        </p>
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

        {/* Huge Makers Lounge mark bleeding off the bottom-left corner. Kept at
            a whisper of opacity so it reads as texture, never as content. */}
        <Image
          src="/images/logo-blue.svg"
          alt=""
          aria-hidden
          width={246}
          height={258}
          className="pointer-events-none absolute -bottom-40 -left-40 w-[1120px] max-w-none opacity-[0.04] md:w-[1520px]"
        />

        <div className="relative mx-auto w-full max-w-4xl">
          <div className="mb-8 text-center">
            <p className="mb-4 text-[13px] font-semibold tracking-[0.28em] text-brand-dark uppercase">
              What you&apos;ll leave with
            </p>
            <h2 className="mb-3 text-4xl leading-[0.98] font-semibold tracking-tight text-balance md:text-6xl">
              Objectives for This Session
            </h2>
            <p className="mx-auto max-w-[560px] text-base leading-relaxed text-ink-muted md:text-lg">
              Get everyone to a working AI agent use case they can take home and keep building on.
            </p>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-center text-[12px] font-semibold tracking-[0.24em] text-brand-dark uppercase">
              Three big questions
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {overarchingGoals.map((goal) => (
                <Card key={goal} className="border-brand/25 bg-white/70">
                  <CardContent className="flex min-h-[104px] items-center justify-center px-5 py-6">
                    <p className="text-center text-lg font-semibold text-balance text-brand-dark md:text-xl">
                      {goal}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <p className="mb-3 text-center text-[12px] font-semibold tracking-[0.24em] text-ink-muted uppercase">
            And hands-on, you&apos;ll
          </p>
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

          {/* Kept as a light inline row rather than cards — the slide is already
              at full height, and this is a closing note, not a fifth objective. */}
          <div className="mt-8">
            <p className="mb-3 text-center text-[12px] font-semibold tracking-[0.24em] text-ink-muted uppercase">
              How to make the most of tonight
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {workshopTips.map((tip, i) => (
                <div key={tip} className="flex items-center justify-center gap-2.5 text-center">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium text-balance text-ink md:text-base">{tip}</p>
                </div>
              ))}
            </div>
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
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-brand-light uppercase">
                  <Clock className="h-3.5 w-3.5" />
                  {presenter.time}
                </span>
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
            </div>
          </div>
        </div>
      </section>

      {/* Slide 5 — Step 0 */}
      <section
        data-slide
        id="install-cursor"
        className="relative flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <p className="absolute right-6 bottom-5 text-xs font-medium tracking-[0.2em] text-ink-muted/60">
          7:15&nbsp;PM
        </p>
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
        id="pick-your-ai-coding-agent"
        className="relative flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <p className="absolute right-6 bottom-5 text-xs font-medium tracking-[0.2em] text-ink-muted/60">
          7:20&nbsp;PM
        </p>
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-base font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              Prefer chat?
            </Badge>
            <h3 className="mb-1.5 text-4xl font-extrabold tracking-tight md:text-5xl">
              Pick your AI coding agent
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
        className="relative flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <p className="absolute right-6 bottom-5 text-xs font-medium tracking-[0.2em] text-ink-muted/60">
          7:25&nbsp;PM
        </p>
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
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-1.5 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              See it live
            </Badge>
            <h3 className="mb-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              Run the dev server
            </h3>
            <p className="mx-auto max-w-[720px] text-sm text-ink-muted md:text-base">
              <strong className="text-ink">1.</strong> Hit the <strong className="text-ink">+</strong>{" "}
              in the terminal panel to open a new terminal ·{" "}
              <strong className="text-ink">2.</strong> Run <Inline>npm run dev</Inline> and open{" "}
              <Inline>http://localhost:3000</Inline>.
            </p>
          </div>
          {/* Percentages are measured against the 1864×1174 screenshot so the
              callouts stay pinned to the + button and the typed command. */}
          {/* Sized so the box matches the screenshot exactly (no letterboxing),
              which keeps the percentage-positioned callouts aligned. */}
          <div
            className="relative my-2 aspect-[1864/1174]"
            style={{ width: "min(100%, calc(72vh * 1864 / 1174))" }}
          >
            <Image
              src="/images/run-dev-server.png"
              alt="An editor terminal in the eve-agent-workshop project running npm run dev"
              width={1864}
              height={1174}
              className="h-full w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
            />
            {/* 1 — the + that opens a new terminal */}
            <div
              className="absolute animate-pulse rounded-full ring-4 ring-amber-400 ring-offset-2 ring-offset-white/0"
              style={{ left: "79.9%", top: "8.4%", width: "2.4%", height: "3.8%" }}
            >
              <span className="absolute -top-2 -left-7 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-ink shadow">
                1
              </span>
            </div>
            {/* 2 — the npm run dev command */}
            <div
              className="absolute animate-pulse rounded-md ring-4 ring-amber-400 ring-offset-2 ring-offset-white/0"
              style={{ left: "67.5%", top: "16.8%", width: "10.7%", height: "3.5%" }}
            >
              <span className="absolute -top-3 -left-8 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-ink shadow">
                2
              </span>
            </div>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <CopyLine text="npm run dev" className="max-w-xs" />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> your app loads at{" "}
              <Inline>localhost:3000</Inline>.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8b — Open the local URL / what a dev server is */}
      <section
        data-slide
        id="open-localhost"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-1.5 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              It&apos;s alive
            </Badge>
            <h3 className="mb-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              Click the localhost link
            </h3>
            <p className="mx-auto max-w-[720px] text-sm text-ink-muted md:text-base">
              The terminal prints a <strong className="text-ink">Local:</strong> URL. Cmd-click it
              (Ctrl-click on Windows) to open your app in the browser.
            </p>
          </div>

          <div className="my-3 grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-[1.35fr_1fr]">
            {/* A recreation of the `npm run dev` output, so the port line can be
                called out precisely instead of buried in a screenshot. */}
            <div className="overflow-hidden rounded-xl bg-white ring-1 ring-[#e3ecf5]">
              <div className="flex items-center gap-1.5 border-b border-[#eef3f9] bg-[#f7f8fa] px-3 py-2">
                <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                <span className="size-2.5 rounded-full bg-[#febc2e]" />
                <span className="size-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-[11px] font-semibold text-ink-muted">
                  Terminal — node
                </span>
              </div>
              <pre className="overflow-x-auto px-4 py-3 font-mono text-[11px] leading-relaxed md:text-xs">
                <code>
                  <span className="text-ink-muted">
                    bertomill@Bertos-MacBook-Pro eve-agent-workshop %{" "}
                  </span>
                  npm run dev{"\n\n"}
                  <span className="text-ink-muted">{"> eve-agent-workshop@0.1.0 dev\n"}</span>
                  <span className="text-ink-muted">{"> next dev\n\n"}</span>
                  <span className="text-amber-600">
                    {"⚠ Port 3000 is in use, using available port 3002 instead.\n"}
                  </span>
                  <span className="font-semibold text-purple-700">{"▲ Next.js 16.3.0 "}</span>
                  <span className="text-ink-muted">{"(Turbopack)\n"}</span>
                  <span className="rounded bg-amber-100 px-1 font-bold text-ink ring-2 ring-amber-400">
                    {"- Local:    http://localhost:3002"}
                  </span>
                  {"\n"}
                  <span className="text-ink-muted">
                    {"- Network:  http://10.88.111.21:3002\n"}
                  </span>
                  <span className="text-emerald-600">{"✓ Ready in 355ms\n"}</span>
                  <span className="text-ink-muted">
                    {"[eve:dev] server listening at http://127.0.0.1:57889/\n"}
                  </span>
                  <span className="text-emerald-600">{"GET / 200 "}</span>
                  <span className="text-ink-muted">{"in 1138ms"}</span>
                </code>
              </pre>
            </div>

            <div className="space-y-3">
              <Card className="border-[#e3ecf5]">
                <CardContent className="px-5 py-4">
                  <p className="mb-1 text-xs font-bold tracking-[0.1em] text-brand-dark uppercase">
                    What&apos;s a dev server?
                  </p>
                  <p className="text-sm text-ink-muted">
                    It&apos;s a small web server running <strong className="text-ink">on your own
                    laptop</strong> that serves your app while you build it. Nothing is published
                    to the internet — <Inline>localhost</Inline> means &ldquo;this machine.&rdquo; Save a
                    file and it reloads the page instantly, so you see your changes as you type.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-[#e3ecf5]">
                <CardContent className="px-5 py-4">
                  <p className="mb-1 text-xs font-bold tracking-[0.1em] text-brand-dark uppercase">
                    Why 3002 and not 3000?
                  </p>
                  <p className="text-sm text-ink-muted">
                    The port is just the door number. <Inline>3000</Inline> was already taken by
                    another app, so Next.js grabbed the next free one. Always open the exact URL
                    your terminal prints. Stop the server anytime with{" "}
                    <Inline>Ctrl+C</Inline>.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> your app opens in the
              browser at the <Inline>localhost</Inline> URL from your terminal.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8b2 — Debugging: copy the error, paste it to your agent */}
      <section
        data-slide
        id="debug-copy-paste-error"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center justify-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-1.5 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              When it breaks
            </Badge>
            <h3 className="mb-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              Debugging: copy the error, paste it to your agent
            </h3>
            <p className="mx-auto max-w-[760px] text-sm text-ink-muted md:text-base">
              Red screen? Don&apos;t panic and don&apos;t retype it.{" "}
              <strong className="text-ink">1.</strong> Hit the copy icon on the error overlay ·{" "}
              <strong className="text-ink">2.</strong> Paste the whole thing into opencode and let it
              fix it.
            </p>
          </div>

          <div className="my-3 grid w-full grid-cols-1 items-start gap-5 lg:grid-cols-2">
            {/* 1 — the browser error overlay, with the copy button called out */}
            <div className="flex flex-col items-center">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink">
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-extrabold text-ink">
                  1
                </span>
                Copy the error from the browser
              </p>
              {/* Percentages are measured against the 2000×1286 screenshot so the
                  ring stays pinned to the copy icon in the error overlay. */}
              <div
                className="relative aspect-[2000/1286] w-full"
                style={{ maxWidth: "calc(52vh * 2000 / 1286)" }}
              >
                <Image
                  src="/images/debug-copy-error.png"
                  alt="A Next.js console error overlay in the browser, with the copy-to-clipboard icon in the top-right of the error card"
                  width={2000}
                  height={1286}
                  className="h-full w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
                />
                <div
                  className="absolute animate-pulse rounded-md ring-4 ring-amber-400 ring-offset-2 ring-offset-white/0"
                  style={{ left: "72.1%", top: "26.1%", width: "2.3%", height: "3.1%" }}
                >
                  <span className="absolute -top-3 -left-8 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-ink shadow">
                    1
                  </span>
                </div>
              </div>
            </div>

            {/* 2 — the same error pasted into opencode */}
            <div className="flex flex-col items-center">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-bold text-ink">
                <span className="flex size-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-extrabold text-ink">
                  2
                </span>
                Paste it straight into opencode
              </p>
              {/* Percentages are measured against the 2000×1328 screenshot so the
                  ring wraps the pasted error text in the terminal. */}
              <div
                className="relative aspect-[2000/1328] w-full"
                style={{ maxWidth: "calc(52vh * 2000 / 1328)" }}
              >
                <Image
                  src="/images/debug-paste-error.png"
                  alt="The editor terminal running opencode with the full error message pasted in as a prompt"
                  width={2000}
                  height={1328}
                  className="h-full w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
                />
                <div
                  className="absolute animate-pulse rounded-md ring-4 ring-amber-400 ring-offset-2 ring-offset-white/0"
                  style={{ left: "24.5%", top: "17.2%", width: "65.5%", height: "58.0%" }}
                >
                  <span className="absolute -top-3 -left-8 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-extrabold text-ink shadow">
                    2
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <CopyLine
              text="Here's the error I'm getting — please read it, find the root cause, and fix it:"
              className="max-w-lg"
            />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> your agent reads the error,
              fixes the file, and the page reloads clean.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8b3 — Where the API key goes: .env.local */}
      <section
        data-slide
        id="add-api-key-env-local"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-1.5 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              Plug in the brain
            </Badge>
            <h3 className="mb-1 text-2xl font-extrabold tracking-tight md:text-3xl">
              Add your API key{" "}
              <span className="text-base font-semibold text-ink-muted md:text-lg">
                (see next slide for where to get it)
              </span>
            </h3>
            <p className="mx-auto max-w-[760px] text-sm text-ink-muted md:text-base">
              Your agent needs a model to think with. The key lives in a file called{" "}
              <Inline>.env.local</Inline> at the root of your project — one line,{" "}
              <Inline>AI_GATEWAY_API_KEY=…</Inline>. It&apos;s gitignored, so it never leaves your
              laptop.
            </p>
          </div>

          {/* Percentages are measured against the 2000×1328 screenshot so the
              ring stays pinned to the .env.local row in the file sidebar. */}
          <div
            className="relative my-3 aspect-[2000/1328]"
            style={{ width: "min(100%, calc(64vh * 2000 / 1328))" }}
          >
            <Image
              src="/images/env-local-api-key.png"
              alt="The editor with .env.local open, showing the AI_GATEWAY_API_KEY line (key redacted)"
              width={2000}
              height={1328}
              className="h-full w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
            />
            <div
              className="absolute animate-pulse rounded-md ring-4 ring-amber-400 ring-offset-2 ring-offset-white/0"
              style={{ left: "4.2%", top: "35.2%", width: "17.8%", height: "2.8%" }}
            >
              <span className="absolute -top-8 left-0 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-ink shadow">
                create this file
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <CopyLine text="AI_GATEWAY_API_KEY=" className="max-w-xs" />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> you have a{" "}
              <Inline>.env.local</Inline> in your project root with your key on one line.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8c — Step 1: AI Gateway API key */}
      <section
        data-slide
        id="ai-gateway-api-key"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <StepBadge>Step 1</StepBadge>
          <h3 className="mb-2.5 text-3xl font-extrabold tracking-tight md:text-5xl">
            Add a Vercel API key
          </h3>
          <p className="max-w-[640px] text-lg text-ink-muted">
            Eve talks to AI models through the <strong>Vercel AI Gateway</strong>. Paste tonight&apos;s
            shared key into your agent&apos;s <Inline>.env.local</Inline> — it&apos;s capped at $100
            for the room.
          </p>
          {/* Read from the back of the room — the key is the whole point of this slide */}
          <CodeBlock
            lines={[
              "AI_GATEWAY_API_KEY=vck_2gBjXeEqEs7j0yDNVS5OXEaAtuNAxrK9zJPKbwaPzQotsmFAkj1y8x3p",
            ]}
            copyText="vck_2gBjXeEqEs7j0yDNVS5OXEaAtuNAxrK9zJPKbwaPzQotsmFAkj1y8x3p"
            className="p-6 pt-12 text-lg leading-relaxed break-all whitespace-pre-wrap md:text-2xl"
          />
          <Button
            asChild
            className="mt-4 rounded-full bg-brand px-6 text-base font-medium text-white shadow-lg shadow-brand/20 hover:bg-brand-dark"
          >
            <a
              href="https://vercel.com/docs/ai-gateway/getting-started"
              target="_blank"
              rel="noreferrer"
            >
              AI Gateway quickstart →
            </a>
          </Button>
          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> send your agent a message
            and get a real response back.
          </Checkpoint>
        </div>
      </section>

      {/* Slide 9 — While that's running: set up PAM */}
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

      {/* Slide 10 — Step 2 */}
      <section
        data-slide
        id="poke-around-the-repo"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <StepBadge>Step 2</StepBadge>
            <Badge className="mb-3 w-fit gap-1.5 bg-white text-xs font-bold tracking-[0.06em] text-brand-dark uppercase ring-1 ring-brand/25">
              <Clock className="size-3.5" />
              10 min · hands on
            </Badge>
          </div>
          <h3 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">
            Poke around the repo
          </h3>
          <p className="max-w-[760px] text-lg leading-snug text-ink md:text-2xl">
            Look through your project folders — what do you see? Can you adjust{" "}
            <Inline>instructions.md</Inline> manually?
          </p>
          <p className="mt-2 text-lg font-bold text-brand-dark md:text-2xl">
            Let&apos;s hear from the audience 🎤
          </p>

          <ul className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
            {structure.map(({ path, what }, i) => (
              <li
                key={path}
                className="rounded-xl border border-[#e3ecf5] bg-white px-4 py-3.5 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#e8f1fb] text-sm font-bold text-brand-dark">
                    {i + 1}
                  </span>
                  <code className="truncate font-mono text-base font-semibold text-brand-dark md:text-lg">
                    {path}
                  </code>
                </div>
                <p className="mt-1.5 text-base text-ink-muted md:text-lg">{what}</p>
              </li>
            ))}
          </ul>

          <Checkpoint className="mt-6 text-base md:text-xl">
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> you&apos;ve opened{" "}
            <Inline>instructions.md</Inline> and made your agent answer in a voice you gave it.
          </Checkpoint>
        </div>
      </section>

      {/* Slide 11 — Demo time */}
      <section
        data-slide
        id="demo-time"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-8 text-ink"
      >
        <p className="absolute right-6 bottom-5 text-xs font-medium tracking-[0.2em] text-ink-muted/60">
          8:15&nbsp;PM
        </p>
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <StepBadge>Demo time! 🎤</StepBadge>
            <Badge className="mb-3 w-fit gap-1.5 bg-white text-xs font-bold tracking-[0.06em] text-brand-dark uppercase ring-1 ring-brand/25">
              <Clock className="size-3.5" />
              2 min each
            </Badge>
          </div>
          <h3 className="mb-2.5 text-3xl font-extrabold tracking-tight md:text-4xl">
            Show us what you built
          </h3>
          <p className="max-w-[720px] text-base text-ink-muted md:text-lg">
            Eight slots, first come first serve — put your name down and take two minutes at the
            front. Half-working counts. Broken-but-interesting <em>really</em> counts.
          </p>

          <div className="mt-5">
            <DemoSlots />
          </div>
        </div>
      </section>

      {/* Slide 12 — Stay in touch */}
      <section
        data-slide
        id="stay-in-touch"
        className="flex h-dvh snap-start items-center overflow-hidden bg-white px-6 py-8 text-ink"
      >
        <div className="mx-auto w-full max-w-5xl">
          <StepBadge>Before you go 👋</StepBadge>
          <h3 className="mb-2.5 text-3xl font-extrabold tracking-tight md:text-4xl">
            Stay in touch
          </h3>
          <p className="max-w-[760px] text-base text-ink-muted md:text-lg">
            Point your phone camera at any of these — no typing required.
          </p>

          {/* Wide gaps between cards: phone cameras happily grab whichever QR is
              nearest, so the codes need real space between them. */}
          <ul className="mt-6 grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-16 lg:gap-24">
            {stayInTouch.map(({ id, title, blurb, cta, href, qr, Icon }) => (
              <li
                key={id}
                className="flex flex-col rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-sm"
              >
                {/* Fixed-height header keeps the QR codes — and the buttons
                    below them — on the same line across cards. */}
                <div className="min-h-[6.25rem]">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#e8f1fb] text-brand-dark">
                      <Icon className="size-4" />
                    </span>
                    <h4 className="text-base leading-tight font-bold text-ink md:text-lg">
                      {title}
                    </h4>
                  </div>
                  <p className="mt-2 text-[13px] leading-snug text-ink-muted md:text-sm">{blurb}</p>
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="mx-auto block w-full max-w-[260px] rounded-xl border border-[#e3ecf5] bg-white p-2 transition hover:border-brand/40"
                >
                  <Image
                    src={qr}
                    alt={`QR code — ${title}`}
                    width={512}
                    height={512}
                    className="h-auto w-full"
                    unoptimized
                  />
                </a>
                <Button
                  asChild
                  className="mt-4 h-11 w-full bg-gradient-to-br from-brand to-brand-dark text-base text-white hover:opacity-90"
                >
                  <a href={href} target="_blank" rel="noreferrer">
                    {cta} →
                  </a>
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
