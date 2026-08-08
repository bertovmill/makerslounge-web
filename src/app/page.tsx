import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    </main>
  );
}
