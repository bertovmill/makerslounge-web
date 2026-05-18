"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import Countdown from "./Countdown";
import SubmissionForm from "./SubmissionForm";

// Edit these as information firms up. Live updates push to everyone on next load.
const LUMA_URL = "https://luma.com/makerslounge-hackathon";
const DISCORD_URL = "https://discord.gg/6MPXG5kQ";
const TRACKS: string[] = [];
const JUDGES: Array<{ name: string; role?: string }> = [];
const PRIZES: Array<{ place: string; detail: string }> = [];
const WINNERS: Array<{ track: string; project: string; team: string }> = [];

// Used by the live schedule highlight on demo night.
const SCHEDULE: Array<{ start: string; end: string; label: string; startUtc: string; endUtc: string }> = [
  { start: "5:30", end: "6:00", label: "Arrival", startUtc: "2026-05-26T21:30:00Z", endUtc: "2026-05-26T22:00:00Z" },
  { start: "6:00", end: "6:30", label: "Food, meet your team", startUtc: "2026-05-26T22:00:00Z", endUtc: "2026-05-26T22:30:00Z" },
  { start: "6:30", end: "7:30", label: "Live demos", startUtc: "2026-05-26T22:30:00Z", endUtc: "2026-05-26T23:30:00Z" },
  { start: "7:30", end: "8:00", label: "Judges deliberate", startUtc: "2026-05-26T23:30:00Z", endUtc: "2026-05-27T00:00:00Z" },
  { start: "8:00", end: "8:30", label: "Winners + connect", startUtc: "2026-05-27T00:00:00Z", endUtc: "2026-05-27T00:30:00Z" },
];

const SLIDE_COUNT = 14;

export default function HackathonDeck() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(1);

  const scrollToSlide = useCallback((n: number) => {
    const target = Math.max(1, Math.min(SLIDE_COUNT, n));
    const el = document.getElementById(`slide-${target}`);
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  // Keyboard navigation.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        scrollToSlide(currentSlide + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        scrollToSlide(currentSlide - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        scrollToSlide(1);
      } else if (e.key === "End") {
        e.preventDefault();
        scrollToSlide(SLIDE_COUNT);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlide, scrollToSlide]);

  // Track which slide is in view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slides = el.querySelectorAll<HTMLElement>("[data-slide]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = Number(entry.target.getAttribute("data-slide"));
            if (n) setCurrentSlide(n);
          }
        });
      },
      { threshold: 0.55, root: el }
    );
    slides.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background text-foreground">
      {/* fixed scroll indicator — top left */}
      <div className="pointer-events-none fixed left-[max(1.25rem,env(safe-area-inset-left))] top-[max(1.25rem,env(safe-area-inset-top))] z-40 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">{pad2(currentSlide)}</span>
        <span className="text-foreground/30"> / </span>
        <span>{pad2(SLIDE_COUNT)}</span>
      </div>

      {/* persistent submit CTA — top right, hides on the form slide */}
      <button
        onClick={() => scrollToSlide(13)}
        className={
          "fixed right-[max(1.25rem,env(safe-area-inset-right))] top-[max(1.1rem,env(safe-area-inset-top))] z-40 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.18em] transition-opacity " +
          (currentSlide === 13
            ? "pointer-events-none opacity-0"
            : "opacity-90 hover:opacity-100")
        }
        aria-label="Jump to submit project"
      >
        <span>Submit project</span>
        <ArrowDown className="size-3.5" />
      </button>

      <div
        ref={containerRef}
        className="h-full w-full snap-y snap-mandatory overflow-y-auto overscroll-y-contain scroll-smooth"
      >
        <Slide n={1} title="Title">
          <SlideTitle />
        </Slide>
        <Slide n={2} title="What">
          <SlideWhat />
        </Slide>
        <Slide n={3} title="How">
          <SlideHow />
        </Slide>
        <Slide n={4} title="Countdown">
          <SlideCountdown />
        </Slide>
        <Slide n={5} title="Demo night">
          <SlideSchedule />
        </Slide>
        <Slide n={6} title="Tracks">
          <SlideTracks />
        </Slide>
        <Slide n={7} title="Judges">
          <SlideJudges />
        </Slide>
        <Slide n={8} title="Prizes">
          <SlidePrizes />
        </Slide>
        <Slide n={9} title="Who should apply">
          <SlideWho />
        </Slide>
        <Slide n={10} title="Community">
          <SlideCommunity />
        </Slide>
        <Slide n={11} title="Code of conduct">
          <SlideConduct />
        </Slide>
        <Slide n={12} title="Find a team">
          <SlideFindTeam />
        </Slide>
        <Slide n={13} title="Submit">
          <SlideSubmit />
        </Slide>
        <Slide n={14} title="Lock in your spot">
          <SlideRsvp />
        </Slide>
      </div>
    </div>
  );
}

function Slide({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`slide-${n}`}
      data-slide={n}
      aria-label={`Slide ${n}: ${title}`}
      className="relative flex h-svh w-full snap-start flex-col justify-center overflow-y-auto px-[clamp(1.25rem,5vw,5rem)] py-[clamp(4.5rem,8vh,7rem)]"
    >
      {children}
    </section>
  );
}

function Eyebrow({ n, label }: { n: number; label: string }) {
  return (
    <div className="mb-[clamp(1.5rem,4vh,3rem)] flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <span className="text-foreground">{pad2(n)}</span>
      <span className="h-px w-8 bg-border" />
      <span>{label}</span>
    </div>
  );
}

/* ---------- Slides ---------- */

function SlideTitle() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">No. 11</span>
        <span className="h-px w-8 bg-border" />
        <span>Toronto Tech Week</span>
      </div>
      <div className="my-auto">
        <h1 className="font-serif text-[clamp(3.5rem,13vw,12rem)] leading-[0.92] tracking-tight">
          Innovation
          <br />
          Hackathon.
        </h1>
        <p className="mt-[clamp(1.25rem,3vh,2.25rem)] max-w-[40ch] text-[clamp(1rem,1.5vw,1.4rem)] text-muted-foreground">
          One hundred builders. One week. Live demos at the end of it.
        </p>
      </div>
      <div className="mt-auto flex flex-col gap-3 font-mono text-sm uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div className="flex flex-col gap-1">
          <span className="text-foreground">May 19 to May 26, 2026</span>
          <span>510 Front St W, Suite 400, Toronto</span>
        </div>
        <a
          href={LUMA_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-foreground hover:opacity-80"
        >
          RSVP on Luma <ArrowUpRight className="size-4" />
        </a>
      </div>
    </div>
  );
}

function SlideWhat() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={1} label="What" />
      <div className="flex flex-col justify-center gap-[clamp(1rem,3vh,2.5rem)]">
        <h2 className="max-w-[18ch] font-serif text-[clamp(2.5rem,8.5vw,8rem)] leading-[0.95] tracking-tight">
          Toronto's biggest innovation hackathon.
        </h2>
        <p className="max-w-[55ch] text-[clamp(1.05rem,1.6vw,1.6rem)] text-muted-foreground">
          We're bringing 100 of the best AI builders in the city together to compete across multiple challenge tracks, with industry leaders judging live.
        </p>
      </div>
      <StatRow
        items={[
          { value: "100", label: "Builders" },
          { value: "01", label: "Week" },
          { value: "Live", label: "Demos" },
        ]}
      />
    </div>
  );
}

function SlideHow() {
  const parts = [
    {
      tag: "Part 1",
      title: "Kickoff Night",
      when: "Mon May 19, 8:00 PM",
      where: "Online",
      body: "Challenge tracks are revealed, teams form, the clock starts. Solo builders are welcome.",
    },
    {
      tag: "Part 2",
      title: "Build week",
      when: "May 19 to May 24",
      where: "Anywhere",
      body: "Six days to build something real. Submit by Sunday May 24, 11:59 PM.",
    },
    {
      tag: "Part 3",
      title: "Demo night",
      when: "Tue May 26, 5:30 PM",
      where: "510 Front St W, Suite 400",
      body: "Come back and present what you built. Judges evaluate live. Winners announced on the night.",
    },
  ];
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={2} label="How it works" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Three parts.
        </h2>
        <ol className="grid gap-[clamp(1.25rem,3vh,2rem)] lg:grid-cols-3 lg:gap-[clamp(2rem,3vw,3rem)]">
          {parts.map((p) => (
            <li key={p.title} className="flex flex-col gap-3 border-t border-border pt-4">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {p.tag}
              </span>
              <h3 className="font-serif text-[clamp(1.5rem,3vw,2.75rem)] leading-tight tracking-tight">
                {p.title}
              </h3>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                {p.when} · {p.where}
              </p>
              <p className="max-w-[36ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
                {p.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function SlideCountdown() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={3} label="Countdown" />
      <div className="flex flex-col justify-center">
        <Countdown />
      </div>
      <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        All times Eastern.
      </div>
    </div>
  );
}

function SlideSchedule() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={4} label="Demo night" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Tuesday <span className="text-muted-foreground">May 26.</span>
        </h2>
        <ul className="flex flex-col">
          {SCHEDULE.map((row) => {
            const start = new Date(row.startUtc).getTime();
            const end = new Date(row.endUtc).getTime();
            const live = now >= start && now < end;
            return (
              <li
                key={row.start}
                className={
                  "grid grid-cols-[7rem_1fr_auto] items-baseline gap-4 border-t border-border py-[clamp(0.65rem,1.6vh,1.1rem)] sm:grid-cols-[10rem_1fr_auto] " +
                  (live ? "text-foreground" : "")
                }
              >
                <span className="font-mono text-[clamp(0.85rem,1.4vw,1.1rem)] tabular-nums text-foreground">
                  {row.start} PM
                </span>
                <span className="font-serif text-[clamp(1.25rem,2.5vw,2.25rem)] tracking-tight">
                  {row.label}
                </span>
                <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {live ? (
                    <span className="inline-flex items-center gap-2 text-primary">
                      <span className="relative inline-flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      Now
                    </span>
                  ) : (
                    `to ${row.end} PM`
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function SlideTracks() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={5} label="Challenge tracks" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
          Pick a track.
          <br />
          Ship in a week.
        </h2>
        {TRACKS.length === 0 ? (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Revealed at kickoff, Monday May 19.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {TRACKS.map((t, i) => (
              <li key={t} className="flex items-baseline gap-4 border-t border-border pt-3">
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {pad2(i + 1)}
                </span>
                <span className="font-serif text-[clamp(1.25rem,2.5vw,2rem)] tracking-tight">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SlideJudges() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={6} label="Judges" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="max-w-[20ch] font-serif text-[clamp(2.5rem,7.5vw,6.5rem)] leading-[0.95] tracking-tight">
          People who ship, judging live.
        </h2>
        {JUDGES.length === 0 ? (
          <p className="font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Announced in the weeks before May 26.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {JUDGES.map((j) => (
              <li key={j.name} className="flex flex-col gap-1 border-t border-border pt-3">
                <span className="font-serif text-[clamp(1.25rem,2vw,1.75rem)] tracking-tight">
                  {j.name}
                </span>
                {j.role && (
                  <span className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    {j.role}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SlidePrizes() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={7} label="Prizes" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.9] tracking-tight">
          Prizes.
        </h2>
        {PRIZES.length === 0 ? (
          <p className="max-w-[40ch] font-mono text-sm uppercase tracking-[0.18em] text-muted-foreground">
            Announced in the weeks before May 26. Bragging rights are guaranteed.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {PRIZES.map((p) => (
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
        )}
      </div>
    </div>
  );
}

function SlideWho() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={8} label="Who should apply" />
      <div className="grid items-center gap-[clamp(2rem,5vw,5rem)] md:grid-cols-2">
        <div className="flex flex-col gap-4 border-t border-foreground pt-5">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-foreground">
            Builders
          </span>
          <h3 className="font-serif text-[clamp(2rem,5vw,4rem)] leading-tight tracking-tight">
            Founders, engineers, designers, makers.
          </h3>
          <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            Hands-on AI experience. Able to ship something real in a week. Solo or in a team. Spots are strictly limited to 100.
          </p>
        </div>
        <div className="flex flex-col gap-4 border-t border-border pt-5">
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Judges
          </span>
          <h3 className="font-serif text-[clamp(2rem,5vw,4rem)] leading-tight tracking-tight text-muted-foreground">
            Industry leaders and innovators.
          </h3>
          <p className="max-w-[42ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
            We reach out directly. If you'd like to nominate someone, message us in the Discord.
          </p>
        </div>
      </div>
    </div>
  );
}

function SlideCommunity() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={9} label="Community" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[20ch] font-serif text-[clamp(2.5rem,7vw,6rem)] leading-[0.95] tracking-tight">
          Find your team in the Discord.
        </h2>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2 border-b border-foreground pb-1 font-mono text-sm uppercase tracking-[0.18em] text-foreground hover:opacity-80"
        >
          {DISCORD_URL.replace("https://", "")} <ArrowUpRight className="size-4" />
        </a>
        <div className="mt-[clamp(1.5rem,4vh,2.5rem)] grid gap-6 border-t border-border pt-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Community partner
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              The AI Collective is a global non-profit uniting 150,000+ leaders, builders, and stakeholders. Participating as a community partner only.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Featured in
            </span>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Toronto Tech Week 2026, May 25 to 29. A citywide celebration of the people building what's next, with hundreds of community-led events.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideConduct() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr]">
      <Eyebrow n={10} label="Code of conduct" />
      <div className="flex flex-col justify-center gap-[clamp(1.25rem,3vh,2.5rem)]">
        <h2 className="max-w-[22ch] font-serif text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.95] tracking-tight">
          Build kindly. Ship boldly. Credit fully.
        </h2>
        <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          Attendees and organizers at events affiliated with The AI Collective agree to its code of conduct. Be the room you want to be in.
        </p>
      </div>
    </div>
  );
}

function SlideFindTeam() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={11} label="Find a team" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[16ch] font-serif text-[clamp(3rem,10vw,9rem)] leading-[0.92] tracking-tight">
          Solo? Find a team.
        </h2>
        <p className="max-w-[55ch] text-base text-muted-foreground sm:text-lg">
          Drop your name, your background, and what you want in a teammate. We&apos;ll match you with other solo builders before kickoff.
        </p>
        <Link
          href="/hackathon/signup"
          className="inline-flex w-fit items-center gap-2.5 bg-foreground px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background hover:opacity-90"
        >
          Get matched <ArrowUpRight className="size-4" />
        </Link>
      </div>
      <div className="border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-foreground">makerslounge.ca / hackathon / signup</span>
      </div>
    </div>
  );
}

function SlideSubmit() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr] overflow-y-auto">
      <Eyebrow n={12} label="Submit" />
      <div className="flex flex-col gap-[clamp(1.25rem,3vh,2.25rem)] pb-[clamp(2rem,6vh,4rem)]">
        <h2 className="font-serif text-[clamp(2.5rem,8vw,7rem)] leading-[0.95] tracking-tight">
          Submit your project.
        </h2>
        <p className="max-w-[60ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
          One link is all that's required. Add a title, a description, a video, files, your team, whatever helps judges understand what you built.
        </p>
        <div className="mt-[clamp(1rem,2vh,1.5rem)]">
          <SubmissionForm />
        </div>
      </div>
    </div>
  );
}

function SlideRsvp() {
  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto]">
      <Eyebrow n={13} label="Join us" />
      <div className="flex flex-col justify-center gap-[clamp(1.5rem,4vh,3rem)]">
        <h2 className="max-w-[18ch] font-serif text-[clamp(3rem,11vw,10rem)] leading-[0.92] tracking-tight">
          Lock in your spot.
        </h2>
        <a
          href={LUMA_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-2.5 bg-foreground px-7 py-4 font-mono text-sm uppercase tracking-[0.18em] text-background hover:opacity-90"
        >
          RSVP on Luma <ArrowUpRight className="size-4" />
        </a>
        <p className="max-w-[55ch] text-base text-muted-foreground sm:text-lg">
          100 spots. First come, host approval required. If you don't get in this time, keep applying.
        </p>
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-foreground">
          <span>#MakerMondays</span>
          <span>#MakersLounge</span>
          <span>#TorontoTechWeek</span>
          <span>#BuildInPublic</span>
        </div>
        <span>makerslounge.ca / hackathon</span>
      </div>
    </div>
  );
}

/* ---------- Helpers ---------- */

function StatRow({ items }: { items: Array<{ value: string; label: string }> }) {
  return (
    <div className="grid grid-cols-3 border-t border-border pt-5">
      {items.map((s) => (
        <div key={s.label} className="flex flex-col gap-1.5">
          <span className="font-serif text-[clamp(2rem,5vw,4.5rem)] leading-none tracking-tight">
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

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
