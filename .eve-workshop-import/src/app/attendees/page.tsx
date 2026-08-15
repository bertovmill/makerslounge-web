"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LeftSidebar } from "@/components/left-sidebar";
import { WorkshopHelperWidget } from "@/components/workshop-helper-widget";

type Guest = {
  name: string;
  role?: string;
  bio?: string;
  tags?: string[];
  tools?: string;
  wish?: string;
  topic?: string;
  /** Headshot in /public/attendees — e.g. "/attendees/berto-mill.png" */
  photo?: string;
  /** Full LinkedIn profile URL */
  linkedin?: string;
};

const guests: Guest[] = [
  {
    name: "Berto Mill",
    role: "Host — Makers Lounge",
    bio: "Organizing tonight's session and building with Eve.",
    tags: ["Host"],
    photo: "/attendees/berto-mill.png",
    linkedin: "https://www.linkedin.com/in/bertomill/",
  },
  {
    name: `Hunter Wedgbury`,
    tools: `Claude`,
    wish: `Slide deck draft (storytelling, greyboxing...)`,
    topic: `Learning how to create and launch agents`,
    linkedin: "https://www.linkedin.com/in/hunterwedgbury/",
  },
  {
    name: `Ayame Ishii`,
    tools: `Gemini, Claude etc`,
    wish: `I want AI to handle these tedious copy-and-paste tasks for me.`,
    topic: `I’d like to learn how I can use AI to automate repetitive and tedious tasks, especially copy-and-paste work that I currently have to do manually.`,
    linkedin: "https://www.linkedin.com/in/ayame-ishii-a4a96231a/",
  },
  {
    name: `Aaron L Greenspan`,
    tools: `Vercel, Claude, Hermes, Openclaw, Google Vertex AI, Nvidia Omniverse etc`,
    wish: `Automated my creative production workflow`,
    topic: `Thoughts on buildouts on CrewAI etc`,
  },
  {
    name: `Minnah Hussain`,
    tools: `Claude, Gemini`,
    wish: `I'd love an agent that helps me actually finish things, not by doing the work for me, but by handling the friction of starting again. Remembering where I left off, breaking the next step into something small enough to just start, and gently keeping momentum going between sessions.`,
    topic: `Nothing specific.`,
  },
  {
    name: `Adyan Pasha`,
  },
  {
    name: `Fayaz Rafin`,
    tools: `Google Gemini, ChatGPT codex, Copilot CLI`,
    wish: `Do my laundry for me`,
    topic: `Agents on websites as web workers`,
  },
  {
    name: `Kelly Sun`,
    tools: `claude`,
    wish: `voice`,
    topic: `no`,
  },
  {
    name: `Chloe Guo`,
    tools: `Claude, ChatGPT`,
    wish: `run my social media & startup`,
    topic: `How to build an ai agent to make it actually work efficiently and effectively`,
  },
  {
    name: `Avi Franklin-Casseres`,
    tools: `Chat gpt`,
    wish: `Help with my start up Photobooth business`,
    topic: `How I can use ai agents to help start my business.`,
  },
  {
    name: `Marc MPSGC`,
    tools: `Claude Code, Grok Build, Hermes Agent, Video/Image Gen, STT, TTS, Routers, etc.`,
    wish: `Get really good at maintaining long-term memory architecture to develop a learning/evolving agent that gets better with time.`,
    topic: `Building custom harnesses with Pi`,
  },
  {
    name: `Peter Block`,
    tools: `Internal work AI tool (built on Anthropic Claude Sommer 4.6), AlphaSense`,
    wish: `The more I learn about agents, the more I realize what they can do for me. But I don’t know enough about them yet!`,
    topic: `How I can apply agents in my daily work`,
  },
  {
    name: `Hitesh Dundi`,
    tools: `Claude, Codex and many more. :)`,
    wish: `Take action on all my ideas simultaneously.`,
  },
  {
    name: `Barbara Donaldson`,
    tools: `Copilot. Chatgpt`,
    wish: `Help me manage my workload`,
    topic: `Not sure`,
  },
  {
    name: `Nicki Casseres`,
    tools: `Claude ChatGPT`,
    wish: `Support and training development`,
    topic: `Open to everything`,
  },
  {
    name: `Katy Rozanova`,
    tools: `Claude in excel, v0`,
    wish: `Help me organize my email inbox, help automate/do some of my routine financial tasks`,
    topic: `Learn how to successfully deploy a webapp with agentic features like drafting emails from the webapp. Learn how to connect an agent to Microsoft products like outlook and excel.`,
  },
  {
    name: `Razit Intisar`,
    tools: `Claude, Gemini, Chatgpt, and Manus for automating a lot of repetitive work.`,
    wish: `I would love if an AI agent could automate marketing for a brand like create unique instagram post designs, make it neat, and post it directly to a story or post to engage an audience.`,
    topic: `Meeting with others, sharing plans, making valuable connections.`,
  },
  {
    name: `Bilal Habbab`,
    tools: `Claude`,
    wish: `Do my work tasks, using an external device (you can say testing for giving advice to manager and showing them what is possible with AI)`,
    topic: `Not much, looking forward to learn more!`,
  },
  {
    name: `Charles Lamarre`,
    tools: `Claude, Gemini, NanoBanana`,
    wish: `Properly take care of leads and marketing`,
    topic: `Connect with others and learn more about how AI-Agents can help grow my business.`,
  },
  {
    name: `Olga Lysenko`,
    tools: `ChatGPT, Claude, Perplexity, Co-pilot`,
    wish: `Synthesize data from paid social media platforms to analyze performance. Create multiple agents at work for different tasks`,
    topic: `Learning to build an agent. What AI tools are good to use.`,
  },
  {
    name: `Peter Shi`,
    tools: `claude skills, perplexity`,
    wish: `A) source investments & write custom outreach emails. B) analyze investments. C) research industries`,
  },
  {
    name: `Saliha Naeem`,
    tools: `claude/chatgpt`,
    wish: `bridge the gap between "i have an idea" to "it exists"`,
    topic: `I'd love to dig into how to structure an agent that can pull from multiple data sources and take autonomous next steps. I'm currently doing lead-sourcing work for MightyIQ (finding mortgage broker prospects across Canadian cities) and built an AI-powered financial roadmap tool at a hackathon, so I'm especially interested in agent design patterns for research/lookup tasks, and how MCP fits into that.`,
  },
  {
    name: `Aahil Pasha`,
    tools: `Claude, chatgpt, Gemini, gemini`,
    wish: `Search for the cheapest available prices for certain products over different websites.`,
    topic: `nope`,
  },
  {
    name: `Zane Yee Fong`,
    tools: `LLMs like Claude/Gemini.`,
    wish: `Whatever I'm working on, give relevant advice with the given context.`,
    topic: `Advantages/disadvantages of ai agents.`,
  },
  {
    name: `Franco Bernal`,
    tools: `Claude code, Codex and Grok Build`,
    wish: `My agents already do pretty much everything for me.`,
    topic: `I want to learn about other people’s agents, learn what im doing right and what im doing wrong…`,
  },
  {
    name: `Kiana Karimi-shahri`,
    tools: `ChatGPT, Lovable`,
    wish: `I’d love an AI agent that acts like a true product copilot: conducting customer research, synthesizing interviews, prioritizing insights, creating product specs, building prototypes, and coordinating execution across tools, with minimal supervision.`,
    topic: `I’m interested in learning best practices for building production-ready AI agents, orchestrating multiple agents, integrating with external APIs and tools, and where agents create real value beyond simple chatbots. I’d also love to meet other founders and builders working on AI products.`,
  },
  {
    name: `Andrew Peake`,
    tools: `Codex, GPT, Cursor, Claude`,
    wish: `Complete understanding of who I am, how I operate, what I’m working on. Automate from there`,
    topic: `Curious to see what kind of tools other builders have been creating`,
  },
  {
    name: `Laboni Saha`,
    tools: `ChatGPT, Claude`,
    wish: `Give me correct solutions for my math problems`,
    topic: `Byte member`,
  },
  {
    name: `Aaron White`,
    tools: `Claude Code primarily, experience with Cursor, Codex, Replit, Loveable.`,
    wish: `Not sure yet... Automating life tasks probably, or product research.`,
    topic: `Agent accuracy/loops.`,
  },
  {
    name: `Anastasiia Konovalenko`,
    tools: `Codex`,
    wish: `automate emails`,
    topic: `nope`,
  },
  {
    name: `Davies Umoh`,
    tools: `Claude code, Antigravity, warp`,
    wish: `I need Jarvis from Iron man`,
    topic: `Voice AI!`,
  },
  {
    name: `Nazar Ponochevnyi`,
    tools: `Pam Memory MCP`,
    wish: `Everything`,
    topic: `Pam Memory MCP`,
  },
  {
    name: `Mohammed Ahmed Tariq Lakdawala`,
    tools: `Claude code, Codex, Cursor`,
    wish: `Plan out my schedule based on my emails detected`,
    topic: `Agent to agent communication`,
  },
  {
    name: `tam`,
    tools: `claude code, chatgpt codex`,
    wish: `do useful things non-stop for me, especially when my brain is fried.`,
    topic: `instructors’ choice`,
  },
  {
    name: `noor`,
    tools: `Copilot`,
    wish: `Update trackers and submit requests into various tools like service now or even apps`,
    topic: `Beginner to advanced, incl how to think about the workflow not just the basic clicking of buttons in copilot`,
  },
  {
    name: `Ronyth Buenaventura`,
    tools: `Claude, Gemini, ChatGPT, Copilot`,
    wish: `Explain things in more depth and with less complexity`,
  },
  {
    name: `Asar Qadir`,
  },
  {
    name: `Danial Hasan`,
    tools: `codex`,
    topic: `using agents to automate epistemic work`,
  },
  {
    name: `Hassan Abdi`,
    tools: `Claude, Clay, Origami and various more`,
    wish: `Streamline a lot of my internal business processes`,
    topic: `No nothing in particular`,
  },
  {
    name: `Jacob Mobin`,
    tools: `Claude code + Codex`,
    wish: `Make money`,
    topic: `I am a byte member`,
  },
  {
    name: `Daniel Garner`,
    tools: `Claude and chat and some AI options that companies provide`,
    wish: `Manage my inbox and auto reply to emails. Maybe use our CRM or make proposals`,
    topic: `How to run an open claw setup and leave the session with a working agent for a small task`,
  },
  {
    name: `Finn Eriksson`,
    tools: `Claude, ChatGPT, Gemini, Kimi, Figma`,
    wish: `Harvest fragmental data for exploratory meaning-concept creation.`,
    topic: `Building agentic loops to build products`,
  },
  {
    name: `Karam Sethi`,
    tools: `GPT tools`,
    wish: `Help me learn daily updates around the globe. How one factor may have a ripple effect on industries`,
    topic: `What tools can be leveraged for the above`,
  },
  {
    name: `Viyasan Ariyarathnam`,
    tools: `Claude`,
    wish: `Help me with workflows day to time, like an actual competent working peer/co-worker`,
    topic: `Building the agent`,
  },
  {
    name: `Mariia Milashenko`,
    tools: `Claude`,
    wish: `Product work: scraping Reddit threads and ingesting comments about our product, scraping competitors' features`,
    topic: `How to make an agent scrape from the internet (LinkedIn, etc.)`,
  },
  {
    name: `Azia Mery @ HerDailyInvest`,
    tools: `Claude, ChatGPT, Lovable`,
    wish: `Two types of agents: a Bookkeeper & Accountant that tracks weekly expenses/revenue and emails a summary, and an AI Ops Manager that reviews inbox, content calendar, and deal tracker every Sunday and reports the top three things to handle.`,
    topic: `How to build an agent from scratch as someone non-technical`,
  },
  {
    name: `Hunain Adhikari`,
    tools: `Claude code`,
    wish: `Help me automate my everyday tasks`,
    topic: `Building reliable agents, and harnesses`,
  },
  {
    name: `Berat Lutfi Mehmet Koc`,
  },
  {
    name: `Vimal kumar Parthasarathy`,
  },
  {
    name: `Trish Duno`,
  },
  {
    name: `Geethanjali Velusamy`,
  },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AttendeesPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter((guest) =>
      [guest.name, guest.role, guest.bio, guest.tools, guest.wish, guest.topic]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <main className="min-h-dvh bg-[#f7fafd] pl-16 text-ink">
      <LeftSidebar />
      <WorkshopHelperWidget contextId="attendees" />

      <div className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-8 text-center">
          <Badge className="mb-4 border-brand/20 bg-brand/10 text-xs font-bold tracking-[0.18em] text-brand-dark uppercase">
            Who&apos;s here tonight
          </Badge>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight md:text-5xl">
            Meet other people in the room
          </h1>
          <p className="mx-auto max-w-[560px] text-sm text-ink-muted md:text-base">
            Say hi — everyone here is building something. Find someone new and swap notes.
          </p>
        </div>

        <div className="mx-auto mb-10 max-w-md">
          <div className="relative">
            <svg
              className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ink-muted"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, tools, or interests…"
              className="w-full rounded-full border border-[#e3ecf5] bg-white py-2.5 pr-4 pl-10 text-sm text-ink placeholder:text-ink-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <p className="mt-2 text-center text-xs text-ink-muted">
            {filtered.length} of {guests.length} attendees
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-muted">
            No attendees match &quot;{query}&quot;.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((guest) => (
              <div
                key={guest.name}
                className="rounded-2xl border border-[#e3ecf5] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  {guest.photo ? (
                    <Image
                      src={guest.photo}
                      alt={guest.name}
                      width={44}
                      height={44}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-dark text-base font-bold text-white">
                      {initials(guest.name)}
                    </div>
                  )}
                  {guest.linkedin && (
                    <a
                      href={guest.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${guest.name} on LinkedIn`}
                      title={`${guest.name} on LinkedIn`}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0a66c2]/10 text-[#0a66c2] transition-colors hover:bg-[#0a66c2] hover:text-white"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
                      </svg>
                    </a>
                  )}
                </div>
                <h3 className="text-base font-bold tracking-tight">{guest.name}</h3>

                {guest.role && <p className="mb-2 text-sm text-brand-dark">{guest.role}</p>}
                {guest.bio && (
                  <p className="text-sm leading-relaxed text-ink-muted">{guest.bio}</p>
                )}
                {guest.tags && guest.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {guest.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-dark uppercase"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {guest.tools && (
                  <p className="mt-2 text-xs text-ink-muted">
                    <span className="font-semibold text-ink">Uses:</span> {guest.tools}
                  </p>
                )}
                {guest.wish && (
                  <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-ink-muted">
                    <span className="font-semibold text-ink">Wants AI to:</span> {guest.wish}
                  </p>
                )}
                {guest.topic && (
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-muted">
                    <span className="font-semibold text-ink">Hoping to cover:</span> {guest.topic}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
