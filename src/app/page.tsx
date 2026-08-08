import { CodeBlock } from "@/components/code-block";

function StepLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-3.5 inline-block rounded-full bg-gradient-to-br from-brand to-brand-dark px-3.5 py-1 text-xs font-extrabold tracking-[0.12em] text-white uppercase">
      {children}
    </span>
  );
}

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

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-4 rounded-xl border border-[#e3ecf5] bg-white px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}

const structure = [
  ["agent/instructions.md", "Your agent's always-on system prompt — its personality & job"],
  ["agent/tools/", "Typed functions the model can call"],
  ["agent/skills/", "Procedures loaded contextually when needed"],
  ["agent/channels/", "HTTP & messaging entry points (Slack, webhooks, …)"],
  ["agent/connections/", "MCP and OpenAPI service integrations"],
  ["agent/schedules/", "Recurring tasks & automation"],
  ["agent/subagents/", "Specialist agents it can delegate to"],
  ["evals/", "Checks that measure whether your agent actually works"],
];

const ideas = [
  {
    emoji: "📅",
    title: "Event Concierge",
    desc: "Answers questions about Maker Mondays and drafts RSVP reminders for your community.",
  },
  {
    emoji: "📣",
    title: "Social Media Sidekick",
    desc: "Drafts launch posts in your voice — give it a tool that knows your past posts.",
  },
  {
    emoji: "🔎",
    title: "Research Scout",
    desc: "Watches a topic you care about and compiles findings into a daily brief on a schedule.",
  },
  {
    emoji: "🛠️",
    title: "Your Own Idea",
    desc: "The best demos come from real problems. What do you keep doing by hand?",
  },
];

const resources = [
  ["https://eve.dev/docs/getting-started", "Eve docs — Getting Started →"],
  ["https://eve.dev/docs", "Eve docs — everything else →"],
  ["https://luma.com/makermonday3", "RSVP to Maker Mondays on Luma →"],
  ["https://www.makerslounge.ca", "Makerslounge — makerslounge.ca →"],
];

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <header className="bg-gradient-to-br from-brand-light via-brand to-brand-dark px-6 pt-18 pb-22 text-center text-white">
        <div className="mb-5 text-sm font-bold tracking-[0.18em] uppercase opacity-90">
          Makerslounge presents
        </div>
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl">
          Eve Agent Workshop
        </h1>
        <p className="mx-auto mb-3 max-w-[620px] text-lg opacity-95 md:text-xl">
          Build your first durable AI agent with the <strong>Eve framework</strong> — scaffold
          it, run it, make it yours.
        </p>
        <p className="text-[15px] font-bold tracking-[0.08em] opacity-85">
          BUILD&nbsp;·&nbsp;CONNECT&nbsp;·&nbsp;CREATE
        </p>
      </header>

      {/* WiFi card */}
      <div className="mx-auto max-w-[860px] px-6">
        <div className="mx-auto -mt-11 flex max-w-[640px] flex-wrap justify-center gap-10 rounded-2xl border border-[#e3ecf5] bg-white px-7 py-6 shadow-[0_10px_30px_rgba(26,125,232,0.10)]">
          <div className="text-center">
            <div className="text-xs font-bold tracking-[0.1em] text-ink-muted uppercase">
              WiFi Network
            </div>
            <div className="text-[22px] font-bold">Ask a host</div>
          </div>
          <div className="text-center">
            <div className="text-xs font-bold tracking-[0.1em] text-ink-muted uppercase">
              Password
            </div>
            <div className="text-[22px] font-bold">Ask a host</div>
          </div>
        </div>
      </div>

      {/* Prerequisites */}
      <section id="prereqs" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Before you start</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">Prerequisites</h2>
          <p className="max-w-[640px] text-ink-muted">
            Get these four things ready and the rest of the night is smooth sailing. Flag a host
            if you get stuck — that&apos;s what we&apos;re here for.
          </p>
          <Card>
            <ul>
              {[
                <span key="node">
                  <strong>Node.js 24 or newer</strong> — check with <Inline>node -v</Inline>.{" "}
                  <span className="text-[15px] text-ink-muted">
                    Need it? Install from{" "}
                    <a href="https://nodejs.org" className="text-brand-dark underline">
                      nodejs.org
                    </a>{" "}
                    or run <Inline>brew install node</Inline>.
                  </span>
                </span>,
                <span key="editor">
                  <strong>A code editor</strong> —{" "}
                  <span className="text-[15px] text-ink-muted">
                    VS Code, Cursor, whatever you love.
                  </span>
                </span>,
                <span key="vercel">
                  <strong>A free Vercel account</strong> —{" "}
                  <span className="text-[15px] text-ink-muted">
                    sign up at{" "}
                    <a href="https://vercel.com/signup" className="text-brand-dark underline">
                      vercel.com/signup
                    </a>
                    . This gives you AI model access through Vercel AI Gateway — no separate API
                    keys needed.
                  </span>
                </span>,
                <span key="cli">
                  <strong>The Vercel CLI</strong> —{" "}
                  <span className="text-[15px] text-ink-muted">
                    <Inline>npm i -g vercel</Inline>, then <Inline>vercel login</Inline>.
                  </span>
                </span>,
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex gap-3 border-b border-[#e3ecf5] py-2.5 last:border-b-0"
                >
                  <span className="font-extrabold text-brand-dark">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Step 1 */}
      <section id="step1" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Step 1</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">
            Scaffold &amp; run your agent
          </h2>
          <p className="max-w-[640px] text-ink-muted">
            One command creates the project, installs dependencies, initializes Git, and starts
            Eve&apos;s development server.
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

      {/* Step 2 */}
      <section id="step2" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Step 2</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">Connect a model</h2>
          <p className="max-w-[640px] text-ink-muted">
            Eve talks to AI models through <strong>Vercel AI Gateway</strong> by default. The
            easiest path: link the project to your Vercel account and Eve authenticates
            automatically.
          </p>
          <CodeBlock
            lines={[
              "# from inside your agent folder",
              "vercel link",
              "",
              "# then restart the dev server",
              "npm run dev",
            ]}
          />
          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> send your agent a message
            and get a real response back.
          </Checkpoint>
          <details className="mt-3 rounded-xl border border-[#e3ecf5] bg-white px-4 py-3.5">
            <summary className="cursor-pointer font-bold">
              Alternative: use an API key instead
            </summary>
            <p className="mt-2.5 text-[15px] text-ink-muted">
              Grab an AI Gateway key from your Vercel dashboard (
              <strong>AI Gateway → API Keys</strong>) and set it as{" "}
              <Inline>AI_GATEWAY_API_KEY</Inline> in your project&apos;s{" "}
              <Inline>.env.local</Inline>. Or bring your own provider key (Anthropic, OpenAI, …)
              by installing that provider&apos;s AI SDK package.
            </p>
          </details>
        </div>
      </section>

      {/* Step 3 */}
      <section id="step3" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Step 3</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">
            Know your way around
          </h2>
          <p className="max-w-[640px] text-ink-muted">
            Eve is <strong className="text-ink">filesystem-first</strong>: you teach your agent by
            adding files under <Inline>agent/</Inline>. Names come straight from file paths — a
            file at <Inline>agent/tools/get_weather.ts</Inline> automatically becomes the{" "}
            <Inline>get_weather</Inline> tool.
          </p>
          <Card className="overflow-x-auto">
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
          </Card>
          <Checkpoint>
            ✅ <strong className="text-brand-dark">Checkpoint:</strong> open{" "}
            <Inline>agent/instructions.md</Inline>, change the personality, and watch your agent
            become someone new.
          </Checkpoint>
        </div>
      </section>

      {/* Step 4 */}
      <section id="step4" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Step 4</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">
            Build something that&apos;s yours
          </h2>
          <p className="max-w-[640px] text-ink-muted">
            The rest of the session is free-build. Give your agent a real job — add a tool, a
            skill, maybe a schedule. Hosts are floating around; grab one anytime. Need
            inspiration?
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {ideas.map((idea) => (
              <div
                key={idea.title}
                className="rounded-xl border border-[#e3ecf5] bg-white p-5"
              >
                <div className="text-[26px]">{idea.emoji}</div>
                <h3 className="mt-2 mb-1.5 text-[17px] font-bold">{idea.title}</h3>
                <p className="text-[14.5px] text-ink-muted">{idea.desc}</p>
              </div>
            ))}
          </div>
          <Checkpoint>
            🎤 <strong className="text-brand-dark">End of night:</strong> we&apos;ll go around the
            room — show what you built, even if it&apos;s half-broken. Especially if it&apos;s
            half-broken.
          </Checkpoint>
        </div>
      </section>

      {/* Troubleshooting */}
      <section id="troubleshooting" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Stuck?</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">Troubleshooting</h2>
          {[
            {
              q: "“command not found” or Node version errors",
              a: (
                <>
                  Run <Inline>node -v</Inline> — you need v24+. Install the latest from{" "}
                  <a href="https://nodejs.org" className="text-brand-dark underline">
                    nodejs.org
                  </a>
                  , then open a fresh terminal and try again.
                </>
              ),
            },
            {
              q: "Agent won’t respond / model credential errors",
              a: (
                <>
                  Make sure you ran <Inline>vercel link</Inline> inside the agent folder (Step
                  2), then restart <Inline>npm run dev</Inline>. Check you&apos;re logged in with{" "}
                  <Inline>vercel whoami</Inline>.
                </>
              ),
            },
            {
              q: "Slow install on venue WiFi",
              a: (
                <>
                  It happens with the whole room installing at once. Sit tight, or tether your
                  phone for the initial <Inline>npx eve@latest init</Inline> — everything after
                  that is local.
                </>
              ),
            },
            {
              q: "Something else entirely",
              a: (
                <>
                  That&apos;s what the hosts are for. Wave one down — debugging together is the
                  whole point of Makerslounge.
                </>
              ),
            },
          ].map((item) => (
            <details
              key={item.q}
              className="mt-3 rounded-xl border border-[#e3ecf5] bg-white px-4 py-3.5"
            >
              <summary className="cursor-pointer font-bold">{item.q}</summary>
              <p className="mt-2.5 text-[15px] text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section id="resources" className="pt-14 pb-2">
        <div className="mx-auto max-w-[860px] px-6">
          <StepLabel>Keep going</StepLabel>
          <h2 className="mb-2.5 text-[28px] font-extrabold tracking-tight">Resources</h2>
          <Card>
            {resources.map(([href, label]) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block border-b border-[#e3ecf5] py-3 font-semibold text-brand-dark last:border-b-0 hover:underline"
              >
                {label}
              </a>
            ))}
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-18 bg-gradient-to-br from-brand to-brand-dark px-6 py-10 text-center text-white">
        <div className="mb-1.5 font-extrabold tracking-[0.1em]">BUILD · CONNECT · CREATE</div>
        <div>
          Made with ☕ by{" "}
          <a href="https://www.makerslounge.ca" className="underline">
            Makerslounge
          </a>
          , Toronto
        </div>
      </footer>
    </main>
  );
}
