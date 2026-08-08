import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";
import { SlideNav } from "@/components/slide-nav";

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-[#e8f1fb] px-1.5 py-0.5 font-mono text-[0.9em] text-brand-dark">
      {children}
    </code>
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

      {/* Slide 1 — Hero */}
      <section
        data-slide
        className="relative flex h-dvh snap-start items-end overflow-hidden"
      >
        <Image
          src="/images/makers-lounge-group.jpg"
          alt="Makers Lounge community gathered at the space"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-brand-dark/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-16 pt-32 text-center text-white">
          <Badge className="mb-5 border-white/20 bg-white/10 text-xs font-bold tracking-[0.18em] text-white uppercase backdrop-blur-sm">
            Welcome to
          </Badge>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
            Makers Lounge
          </h1>
          <p className="mx-auto mb-8 max-w-[560px] text-lg text-white/90 md:text-xl">
            A community of builders, founders, and makers — coming together to learn, ship, and
            grow together.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              Explore the workshop
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/5 px-6 text-white hover:bg-white/15"
            >
              Visit makerslounge.ca
            </Button>
          </div>
          <p className="mt-10 text-sm font-bold tracking-[0.1em] text-white/80">
            BUILD&nbsp;·&nbsp;CONNECT&nbsp;·&nbsp;CREATE
          </p>
        </div>
      </section>

      {/* Slide 2 — Itinerary */}
      <section
        data-slide
        className="flex h-dvh snap-start items-center overflow-hidden bg-gradient-to-b from-ink to-[#141f30] px-6 py-10 text-white"
      >
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-6 text-center">
            <Badge className="mb-4 border-brand/30 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-light uppercase">
              Monday, August 10 · 6–9 PM
            </Badge>
            <h2 className="mb-2 text-2xl font-extrabold tracking-tight md:text-4xl">
              Tonight&apos;s Itinerary
            </h2>
            <p className="mx-auto max-w-[560px] text-sm text-white/70 md:text-base">
              Work with expert coaches to get your very own agent up and running.
            </p>
          </div>

          <div className="space-y-2">
            {schedule.map((block) => (
              <div
                key={block.title}
                className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 sm:flex-row sm:items-baseline sm:gap-4"
              >
                <Badge
                  variant="outline"
                  className="w-fit shrink-0 border-white/15 font-mono text-[10px] font-medium text-white/70"
                >
                  {block.time}
                </Badge>
                <div className="min-w-0">
                  <span className="mr-2 text-sm font-bold">{block.title}</span>
                  <span className="text-xs leading-snug text-white/60">
                    {block.items.join(" · ")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button
              asChild
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              <a href="https://luma.com/makers-vbwi" target="_blank" rel="noreferrer">
                RSVP on Luma
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Slide 3 — Getting started intro + prerequisites */}
      <section
        data-slide
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

      {/* Slide 4 — Step 0 */}
      <section
        data-slide
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
            className="my-3 h-auto max-h-[58vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
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

      {/* Slide 5 — Or just ask Cursor */}
      <section
        data-slide
        className="flex h-dvh snap-start flex-col items-center justify-center overflow-hidden bg-[#f7fafd] px-6 py-6 text-ink"
      >
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center">
          <div className="w-full shrink-0 text-center">
            <Badge
              variant="outline"
              className="mb-2 w-fit border-brand/30 text-xs font-bold tracking-[0.12em] text-brand-dark uppercase"
            >
              Prefer chat?
            </Badge>
            <h3 className="mb-1.5 text-2xl font-extrabold tracking-tight md:text-3xl">
              Just ask Cursor
            </h3>
            <p className="mx-auto max-w-[600px] text-sm text-ink-muted md:text-base">
              Open the chat panel (<Inline>Cmd+L</Inline>) and just type what you want — it can
              run the same setup steps for you.
            </p>
          </div>
          <Image
            src="/images/cursor-ask-eve.png"
            alt="Cursor's chat panel with the prompt 'I want to install the vercel eve agent framework to this project'"
            width={2000}
            height={1307}
            className="my-3 h-auto max-h-[52vh] w-auto max-w-full rounded-xl object-contain ring-1 ring-[#e3ecf5]"
          />
          <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-4">
            <div className="rounded-xl border border-[#e3ecf5] bg-white px-4 py-2.5 text-sm text-ink-muted italic">
              &ldquo;I want to install the Vercel Eve agent framework to this project&rdquo;
            </div>
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> click{" "}
              <strong className="text-ink">Add Vercel</strong> when it shows up.
            </Checkpoint>
          </div>
        </div>
      </section>

      {/* Slide 6 — Step 1 */}
      <section
        data-slide
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

      {/* Slide 7 — Step 2 */}
      <section
        data-slide
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

      {/* Slide 8 — Step 3 */}
      <section
        data-slide
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
