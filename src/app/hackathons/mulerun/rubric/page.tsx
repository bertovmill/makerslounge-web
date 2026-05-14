import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Judging Rubric — MuleRun AI Hackathon Night",
  description:
    "How we'll judge MuleRun Hack Night demos: workflow, range, problem, and vision.",
};

const CRITERIA = [
  {
    image: "/hackathons/mulerun/judging/workflow.png",
    tag: "Workflow",
    title: "1 to 5 automations",
    body: "Don't ship one agent — show a set of agents that fit a real workflow.",
  },
  {
    image: "/hackathons/mulerun/judging/range.png",
    tag: "Range",
    title: "Breadth of features",
    body: "Use a wide range of what MuleRun can do, in a working live demo.",
  },
  {
    image: "/hackathons/mulerun/judging/problem.png",
    tag: "Problem",
    title: "Make it real",
    body: "Who is this for? What's their job? Why does this matter to them?",
  },
  {
    image: "/hackathons/mulerun/judging/vision.png",
    tag: "Vision",
    title: "Two more weeks",
    body: "If you had another two weeks on this, what would you build next?",
  },
];

export default function RubricPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/hackathons/mulerun"
          className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground transition-opacity hover:opacity-70"
        >
          <ArrowLeft className="size-3.5" />
          MuleRun Hack Night
        </Link>

        <div className="mt-8 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
          <span className="text-foreground">07</span>
          <span className="h-px w-8 bg-border" />
          <span>Judging</span>
        </div>

        <h1 className="mt-4 font-serif text-[clamp(2.5rem,9vw,4.5rem)] leading-[0.95] tracking-tight">
          Pitch a workflow.
        </h1>

        <p className="mt-4 max-w-[55ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          Step into the shoes of someone trying to automate parts of their job.
          Tell us their role, what they do, and how your set of agents fits
          together.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {CRITERIA.map((c) => (
            <li
              key={c.tag}
              className="flex flex-col gap-2.5 overflow-hidden rounded-lg border border-border bg-card/30 p-4"
            >
              <div className="-mx-4 -mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-b from-[#EAF6FF] to-[#F8FCFF]">
                <Image
                  src={c.image}
                  alt={`${c.tag} — ${c.title}`}
                  width={1024}
                  height={1024}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {c.tag}
              </span>
              <h3 className="font-serif text-xl leading-tight tracking-tight">
                {c.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
