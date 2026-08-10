import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";
import { CopyLine } from "@/components/copy-line";
import { SlideNav } from "@/components/slide-nav";
import { LeftSidebar } from "@/components/left-sidebar";
import { QAWidget } from "@/components/qa-widget";

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

const presenters = [
  {
    name: "Matias Gonzalez",
    role: "Design Engineer, Vercel",
    image: "/images/presenters/matias-gonzalez.png",
    linkedin: null,
  },
  {
    name: "Nazar Ponochevnyi",
    role: "AI Agent MCP",
    image: "/images/presenters/nazar-ponochevnyi.png",
    linkedin: null,
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

const prereqs = [
  {
    title: "Node.js 24 or newer",
    detail: (
      <>
        Check with <Inline>node -v</Inline>. Install from{" "}
        <a href="https://nodejs.org" className="text-brand-dark underline">
          nodejs.org
        </a>{" "}
        or <Inline>brew install node</Inline>.
      </>
    ),
  },
  {
    title: "A free Vercel account",
    detail: (
      <>
        Sign up at{" "}
        <a href="https://vercel.com/signup" className="text-brand-dark underline">
          vercel.com/signup
        </a>{" "}
        for AI model access via the Vercel AI Gateway — no separate API keys.
      </>
    ),
  },
];

const structure = [
  ["agent/instructions.md", "Your agent's always-on system prompt — its personality & job"],
  ["agent/tools/", "Typed functions the model can call"],
  ["agent/skills/", "Procedures loaded contextually when needed"],
  ["agent/channels/", "HTTP & messaging entry points (Slack, webhooks, …)"],
];

export default function Home() {
  return (
    <main className="h-dvh snap-y snap-mandatory overflow-y-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <SlideNav />
      <LeftSidebar />
      <QAWidget />

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

      {/* Slide 2 — Itinerary */}
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

      {/* Slide 3 — Thank you, presenters */}
      <section
        data-slide
        id="presenters"
        className="relative flex h-dvh snap-start items-center overflow-hidden bg-gradient-to-b from-ink to-[#141f30] px-6 py-10 text-white"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(58,159,243,0.16),transparent_55%)]" />

        <div className="relative mx-auto w-full max-w-4xl">
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

          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {presenters.map((presenter) => (
              <div
                key={presenter.name}
                className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/[0.04] px-6 py-8 text-center backdrop-blur-sm"
              >
                {presenter.image ? (
                  <Image
                    src={presenter.image}
                    alt={presenter.name}
                    width={128}
                    height={128}
                    className="mb-5 h-28 w-28 rounded-full object-cover shadow-lg shadow-black/20"
                  />
                ) : (
                  <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-2xl font-semibold text-white/70">
                    {presenter.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                )}
                <span className="text-lg font-semibold">{presenter.name}</span>
                <span className="mt-1 text-sm text-white/50">{presenter.role}</span>
                {presenter.linkedin && (
                  <a
                    href={presenter.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                  >
                    <LinkedInIcon className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Slide 4 — Getting started intro + prerequisites */}
      <section
        data-slide
        id="getting-started"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8 text-center">
            <Badge className="mb-4 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
              Let&apos;s build
            </Badge>
            <h2 className="mb-3 text-2xl font-extrabold tracking-tight md:text-4xl">
              Getting Started with Eve
            </h2>
            <p className="mx-auto max-w-[600px] text-sm text-ink-muted md:text-base">
              Eve agents are TypeScript projects — you describe an agent with files under{" "}
              <Inline>agent/</Inline>, and Eve runs it as a durable service. Everything below
              works from a plain terminal.
            </p>
          </div>

          <Badge
            variant="outline"
            className="mb-3 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
          >
            Before you start
          </Badge>
          <Card className="ring-[#e3ecf5]">
            <CardContent>
              <ul>
                {prereqs.map((item, i) => (
                  <li
                    key={item.title}
                    className={`flex gap-3 py-2.5 ${i < prereqs.length - 1 ? "border-b border-[#e3ecf5]" : ""}`}
                  >
                    <span className="font-extrabold text-brand-dark">✓</span>
                    <span>
                      <strong>{item.title}</strong> —{" "}
                      <span className="text-[15px] text-ink-muted">{item.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
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
            src="/images/cursor-open-project.png"
            alt="Cursor's start screen with the Open project box highlighted"
            width={2000}
            height={1307}
            className="my-3 h-auto max-h-[68vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              <a href="https://cursor.com/download" target="_blank" rel="noreferrer">
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

      {/* Slide 6 — Pick your AI agent */}
      <section
        data-slide
        id="ask-cursor"
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-sm font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              Prefer chat?
            </Badge>
            <h3 className="mb-1.5 text-3xl font-extrabold tracking-tight md:text-4xl">
              Pick your AI agent
            </h3>
            <p className="mx-auto max-w-[640px] text-base text-ink-muted md:text-lg">
              Open Cursor&apos;s built-in terminal (<Inline>Ctrl+`</Inline>) and run whichever
              agent matches your subscription — it can run the same setup steps for you.
            </p>
          </div>
          <div className="my-4 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-[#e3ecf5]">
              <CardContent className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                <Image
                  src="/images/claude-logo.png"
                  alt="Claude logo"
                  width={48}
                  height={48}
                  className="h-12 w-12"
                />
                <span className="text-sm font-bold tracking-[0.1em] text-brand-dark uppercase">
                  Have a Claude subscription
                </span>
                <p className="text-xl font-extrabold">Claude Code</p>
                <Inline>claude</Inline>
                <a
                  href="https://code.claude.com/docs/en/quickstart"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand-dark hover:underline"
                >
                  Quickstart docs →
                </a>
              </CardContent>
            </Card>
            <Card className="border-[#e3ecf5]">
              <CardContent className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                <Image
                  src="/images/codex-logo.png"
                  alt="Codex logo"
                  width={48}
                  height={48}
                  className="h-12 w-12"
                />
                <span className="text-sm font-bold tracking-[0.1em] text-brand-dark uppercase">
                  Have a Codex subscription
                </span>
                <p className="text-xl font-extrabold">Codex</p>
                <Inline>codex</Inline>
                <a
                  href="https://learn.chatgpt.com/docs/codex/cli"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand-dark hover:underline"
                >
                  CLI docs →
                </a>
              </CardContent>
            </Card>
            <Card className="border-[#e3ecf5]">
              <CardContent className="flex flex-col items-center gap-2 px-4 py-5 text-center">
                <Image
                  src="/images/opencode-logo.png"
                  alt="OpenCode logo"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-md"
                />
                <span className="text-sm font-bold tracking-[0.1em] text-brand-dark uppercase">
                  Have neither
                </span>
                <p className="text-xl font-extrabold">OpenCode</p>
                <Inline>opencode</Inline>
                <a
                  href="https://opencode.ai/docs/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-brand-dark hover:underline"
                >
                  Docs →
                </a>
              </CardContent>
            </Card>
          </div>
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <CopyLine
              text="I want to install the Vercel Eve agent framework to this project"
              className="max-w-xl"
            />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> click{" "}
              <strong className="text-ink">Add Vercel</strong> when it shows up.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 7 — Build a UI for it */}
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
            className="my-3 h-auto max-h-[62vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <div className="max-w-xl rounded-xl border border-[#e3ecf5] bg-white px-4 py-2.5 text-sm text-ink-muted italic">
              &ldquo;Build me a simple Next.js and shadcn application that showcases all the
              features of my Eve agent, and a chat interface for me to chat to it. Use the Vercel
              AI Elements kit to build it.&rdquo;
            </div>
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> a chat UI opens where you
              can talk to your agent — no terminal required.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 8 — Step 1 */}
      <section
        data-slide
        id="step-1"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <StepBadge>Step 1</StepBadge>
          <h3 className="mb-2.5 text-2xl font-extrabold tracking-tight md:text-3xl">
            Scaffold &amp; run your agent
          </h3>
          <p className="max-w-[640px] text-ink-muted">
            One command creates the project, installs dependencies, and starts Eve&apos;s
            development server. Open Cursor&apos;s built-in terminal (<Inline>Ctrl+`</Inline>)
            and run:
          </p>
          <CodeBlock
            lines={[
              "# create your agent (name it anything you like)",
              "npx eve@latest init my-agent",
              "",
              "# jump in and start the dev server",
              "cd my-agent",
              "npm run dev",
            ]}
          />
          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> a terminal UI opens and
            your agent is running locally. Say hi to it!
          </Checkpoint>
        </div>
      </section>

      {/* Slide 9 — Step 2 */}
      <section
        data-slide
        id="step-2"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <StepBadge>Step 2</StepBadge>
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

      {/* Slide 10 — Step 3 */}
      <section
        data-slide
        id="step-3"
        className="flex h-dvh snap-start items-center overflow-hidden bg-[#f7fafd] px-6 py-10 text-ink"
      >
        <div className="mx-auto w-full max-w-3xl">
          <StepBadge>Step 3</StepBadge>
          <h3 className="mb-2.5 text-2xl font-extrabold tracking-tight md:text-3xl">
            Know your way around
          </h3>
          <p className="max-w-[640px] text-ink-muted">
            Eve is <strong className="text-ink">filesystem-first</strong>: you teach your agent by
            adding files under <Inline>agent/</Inline>. A file at{" "}
            <Inline>agent/tools/get_weather.ts</Inline> automatically becomes the{" "}
            <Inline>get_weather</Inline> tool.
          </p>
          <Card className="overflow-x-auto ring-[#e3ecf5]">
            <CardContent>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#e3ecf5] px-3 py-2 text-left text-xs tracking-[0.08em] text-ink-muted uppercase">
                      Path
                    </th>
                    <th className="border-b border-[#e3ecf5] px-3 py-2 text-left text-xs tracking-[0.08em] text-ink-muted uppercase">
                      What it does
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {structure.map(([path, desc]) => (
                    <tr key={path}>
                      <td className="border-b border-[#e3ecf5] px-3 py-2">
                        <code className="font-mono text-[13px] text-brand-dark">{path}</code>
                      </td>
                      <td className="border-b border-[#e3ecf5] px-3 py-2">{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> open{" "}
            <Inline>agent/instructions.md</Inline>, change the personality, and watch your agent
            become someone new.
          </Checkpoint>
          <div className="mt-6 text-center">
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
    </main>
  );
}
