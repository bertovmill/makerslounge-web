import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeBlock } from "@/components/code-block";

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-[#e8f1fb] px-1.5 py-0.5 font-mono text-[0.9em] text-brand-dark">
      {children}
    </code>
  );
}

function Checkpoint({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-r-xl border-l-4 border-brand-dark bg-[#eaf4fe] px-4 py-3.5 text-[15px]">
      {children}
    </div>
  );
}

const prereqs = [
  {
    title: "Node.js 24 or newer",
    detail: (
      <>
        Check with <Inline>node -v</Inline>. Need it? Install from{" "}
        <a href="https://nodejs.org" className="text-brand-dark underline">
          nodejs.org
        </a>{" "}
        or run <Inline>brew install node</Inline>.
      </>
    ),
  },
  {
    title: "A code editor (optional but nice)",
    detail: "VS Code or Cursor both work great — but a plain terminal is all you actually need.",
  },
  {
    title: "A free Vercel account",
    detail: (
      <>
        Sign up at{" "}
        <a href="https://vercel.com/signup" className="text-brand-dark underline">
          vercel.com/signup
        </a>
        . This gives you AI model access through the Vercel AI Gateway — no separate API keys
        needed.
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
      "Introduction to the Vercel Eve agent framework — Matias Gonzalez (15 min)",
      "AI Agent MCP — Nazar Ponochevnyi (15 min)",
      "Building AI agents: key principles — Danial Hasan (15 min)",
    ],
  },
  {
    time: "7:15 – 8:15 PM",
    title: "Agent-Building Session",
    items: [
      "Break out into groups of 4–6",
      "Instructors walking the room to help",
      "Everyone builds an agent",
    ],
  },
  {
    time: "8:15 – 8:45 PM",
    title: "Demos",
    items: [
      "Zoom link for everyone to join",
      "3-minute demos × 10",
      "Your use case, the friction in getting set up, your next steps",
    ],
  },
  {
    time: "8:45 – 9:00 PM",
    title: "Wrap Up",
    items: ["Connect with fellow builders"],
  },
];

export default function Home() {
  return (
    <main>
      <section className="relative flex min-h-screen items-end overflow-hidden">
        <Image
          src="/images/makers-lounge-group.jpg"
          alt="Makers Lounge community gathered at the space"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-brand-dark/40" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pb-20 pt-32 text-center text-white">
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

      {/* Itinerary */}
      <section className="bg-gradient-to-b from-ink to-[#141f30] px-6 py-24 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <Badge className="mb-5 border-brand/30 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-light uppercase">
              Monday, August 10 · 6–9 PM
            </Badge>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Tonight&apos;s Itinerary
            </h2>
            <p className="mx-auto max-w-[560px] text-white/70">
              An AI agent-building session — work with expert coaches to get your very own agent
              up and running, with tangible value for your work.
            </p>
          </div>

          <ol className="relative space-y-6 border-l border-white/10 pl-8">
            {schedule.map((block) => (
              <li key={block.title} className="relative">
                <span className="absolute top-2 -left-[calc(2rem+5px)] size-2.5 rounded-full bg-brand" />
                <Card className="border-white/10 bg-white/[0.04] ring-white/10">
                  <CardHeader>
                    <Badge
                      variant="outline"
                      className="mb-1 w-fit border-white/15 font-mono text-[11px] font-medium text-white/70"
                    >
                      {block.time}
                    </Badge>
                    <CardTitle className="text-lg text-white">{block.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 text-sm text-white/70">
                      {block.items.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-brand-light">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>

          <div className="mt-14 text-center">
            <p className="mb-6 text-white/70">
              Several expert AI agent-builders will be joining to facilitate. Food and drinks will
              be provided. See you there 🎉
            </p>
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-br from-brand to-brand-dark px-6 text-white hover:opacity-90"
            >
              <a href="https://luma.com/makers-vbwi" target="_blank" rel="noreferrer">
                RSVP on Luma
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Getting started */}
      <section className="bg-[#f7fafd] px-6 py-24 text-ink">
        <div className="mx-auto max-w-3xl">
          <div className="mb-14 text-center">
            <Badge className="mb-5 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
              Let&apos;s build
            </Badge>
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight md:text-5xl">
              Getting Started with Eve
            </h2>
            <p className="mx-auto max-w-[600px] text-ink-muted">
              Eve agents are TypeScript projects — you describe an agent with files under{" "}
              <Inline>agent/</Inline>, and Eve runs it as a durable service. Everything below works
              from a plain terminal — VS Code or Cursor just make it nicer to look at.
            </p>
          </div>

          {/* Prerequisites */}
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

          {/* Step 1 */}
          <div className="mt-12">
            <Badge className="mb-3 w-fit bg-gradient-to-br from-brand to-brand-dark text-xs font-bold tracking-[0.12em] text-white uppercase">
              Step 1
            </Badge>
            <h3 className="mb-2.5 text-2xl font-extrabold tracking-tight">
              Scaffold &amp; run your agent
            </h3>
            <p className="max-w-[640px] text-ink-muted">
              One command creates the project, installs dependencies, and starts Eve&apos;s
              development server. Open your terminal (or the one built into VS Code /
              Cursor — <Inline>Ctrl+`</Inline>) and run:
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

          {/* Step 2 */}
          <div className="mt-12">
            <Badge className="mb-3 w-fit bg-gradient-to-br from-brand to-brand-dark text-xs font-bold tracking-[0.12em] text-white uppercase">
              Step 2
            </Badge>
            <h3 className="mb-2.5 text-2xl font-extrabold tracking-tight">Connect a model</h3>
            <p className="max-w-[640px] text-ink-muted">
              Eve talks to AI models through the <strong>Vercel AI Gateway</strong> by default.
              The easiest path: link the project to your Vercel account and Eve authenticates
              automatically.
            </p>
            <CodeBlock
              lines={["# from inside your agent folder", "vercel link", "", "npm run dev"]}
            />
            <Checkpoint>
              ✅ <strong className="text-brand-dark">Checkpoint:</strong> send your agent a
              message and get a real response back.
            </Checkpoint>
          </div>

          {/* Step 3 */}
          <div className="mt-12">
            <Badge className="mb-3 w-fit bg-gradient-to-br from-brand to-brand-dark text-xs font-bold tracking-[0.12em] text-white uppercase">
              Step 3
            </Badge>
            <h3 className="mb-2.5 text-2xl font-extrabold tracking-tight">Know your way around</h3>
            <p className="max-w-[640px] text-ink-muted">
              Eve is <strong className="text-ink">filesystem-first</strong>: you teach your agent
              by adding files under <Inline>agent/</Inline>. Names come straight from file paths —
              a file at <Inline>agent/tools/get_weather.ts</Inline> automatically becomes the{" "}
              <Inline>get_weather</Inline> tool.
            </p>
            <Card className="overflow-x-auto ring-[#e3ecf5]">
              <CardContent>
                <table className="w-full border-collapse text-[15px]">
                  <thead>
                    <tr>
                      <th className="border-b border-[#e3ecf5] px-3 py-2.5 text-left text-xs tracking-[0.08em] text-ink-muted uppercase">
                        Path
                      </th>
                      <th className="border-b border-[#e3ecf5] px-3 py-2.5 text-left text-xs tracking-[0.08em] text-ink-muted uppercase">
                        What it does
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {structure.map(([path, desc]) => (
                      <tr key={path}>
                        <td className="border-b border-[#e3ecf5] px-3 py-2.5">
                          <code className="font-mono text-[13.5px] text-brand-dark">{path}</code>
                        </td>
                        <td className="border-b border-[#e3ecf5] px-3 py-2.5">{desc}</td>
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
          </div>

          <div className="mt-14 text-center">
            <Button
              asChild
              size="lg"
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
