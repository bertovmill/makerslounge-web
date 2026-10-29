"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPosts } from "@/lib/blog-list-client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, ArrowUp, Users, Sparkles, Calendar, Briefcase, ChevronRight, ArrowRight, ArrowUpRight, Instagram, Linkedin, Menu, X, Mic, Play, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import NewsletterPopup, { OPEN_NEWSLETTER_EVENT } from "@/components/NewsletterPopup";
import { HeroPhotos } from "@/components/landing/HeroPhotos";
import { NextEventCard } from "@/components/landing/NextEventCard";
import { MobileEventBar } from "@/components/landing/MobileEventBar";
import { PhotoMarquee } from "@/components/landing/PhotoMarquee";
import { LUMA_CALENDAR_URL, type LumaSummary } from "@/lib/luma-events";

const openNewsletterPopup = () => {
  window.dispatchEvent(new CustomEvent(OPEN_NEWSLETTER_EVENT));
};

interface ActionIdea {
  label: string;
  prompt: string;
}

interface ActionSub {
  label: string;
  ideas: ActionIdea[];
}

interface ActionCategory {
  label: string;
  icon: LucideIcon;
  question: string;
  subs: ActionSub[];
}

const VALUES = [
  { label: "Hustle", description: "We ship fast, iterate often, and never stop building." },
  { label: "Learning", description: "Every maker is a student. We grow by sharing knowledge." },
  { label: "Community", description: "We lift each other up. Your win is our win." },
  { label: "Fun", description: "Building should be exciting. We celebrate the joy of creating." },
];

// The three kinds of event on the Luma calendar, each with a real photo from one.
const WAYS = [
  {
    title: "Meetups",
    body: "Build and demo nights. Bring what you're working on, show the room, and leave with feedback and new friends.",
    photo: "lounge-working.jpeg",
    alt: "Makers working on laptops around the lounge",
    href: LUMA_CALENDAR_URL,
    cta: "See meetups",
  },
  {
    title: "Hackathons",
    body: "Sprints with partners and prizes, where strangers become teammates and ideas become demos.",
    photo: "hackathon-working.jpeg",
    alt: "Teams heads-down at a hackathon",
    href: "/hackathons",
    cta: "Explore hackathons",
  },
  {
    title: "Workshops",
    body: "Hands-on sessions on the tools we actually use, from Claude Code to building agents.",
    photo: "presenting-slides.jpeg",
    alt: "A presenter walking through slides",
    href: "/workshops",
    cta: "Browse workshops",
  },
];

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/hackathons", label: "Hackathons" },
  { href: "/podcasts", label: "Podcasts" },
];

const ACTION_TREE: ActionCategory[] = [
  {
    label: "Find makers",
    icon: Users,
    question: "What kind of maker?",
    subs: [
      {
        label: "Designer",
        ideas: [
          { label: "UI/UX designer for a mobile app", prompt: "I'm looking for a UI/UX designer who can help me design a mobile app. I need someone with experience in user research, wireframing, and high-fidelity prototypes." },
          { label: "Brand designer for a startup", prompt: "I need a brand designer to help create a visual identity for my startup — logo, color palette, typography, and brand guidelines." },
          { label: "3D / motion designer", prompt: "I'm looking for a 3D or motion designer who can create animations and visual assets for product marketing." },
        ],
      },
      {
        label: "Developer",
        ideas: [
          { label: "Full-stack web developer", prompt: "I'm looking for a full-stack web developer to help build a web application. Experience with React, Node.js, or similar modern stacks preferred." },
          { label: "Mobile app developer", prompt: "I need a mobile app developer with experience in React Native or Flutter to build a cross-platform app." },
          { label: "AI / ML engineer", prompt: "I'm looking for an AI/ML engineer who can help build intelligent features — recommendations, NLP, or computer vision." },
        ],
      },
      {
        label: "Marketer",
        ideas: [
          { label: "Growth marketer", prompt: "I'm looking for a growth marketer who can help with user acquisition, A/B testing, and funnel optimization for my product." },
          { label: "Content creator", prompt: "I need a content creator who can produce engaging written and visual content for social media and blogs." },
          { label: "SEO specialist", prompt: "I'm looking for an SEO specialist to help improve organic search rankings and drive traffic to my site." },
        ],
      },
      {
        label: "Co-founder",
        ideas: [
          { label: "Technical co-founder", prompt: "I'm looking for a technical co-founder to join my startup. I have the business vision and need someone who can lead engineering and product development." },
          { label: "Business co-founder", prompt: "I'm a technical founder looking for a business co-founder who can handle go-to-market strategy, fundraising, and partnerships." },
        ],
      },
    ],
  },
  {
    label: "AI match",
    icon: Sparkles,
    question: "What do you need help with?",
    subs: [
      {
        label: "Build a team",
        ideas: [
          { label: "Startup founding team", prompt: "Help me find people to form a startup founding team. I need complementary skills — someone technical, someone in design, and someone in business development." },
          { label: "Hackathon squad", prompt: "I'm looking for a hackathon team — ideally a developer, designer, and someone who can pitch. We'd be building an AI project." },
        ],
      },
      {
        label: "Get feedback",
        ideas: [
          { label: "Product feedback on my MVP", prompt: "I have an MVP and I'm looking for makers in the community who can give honest product feedback — UX, features, and overall value proposition." },
          { label: "Code review partner", prompt: "I'm looking for an experienced developer who can review my code and architecture decisions. I'm building with Next.js and Supabase." },
        ],
      },
      {
        label: "Learn a skill",
        ideas: [
          { label: "Find a mentor in design", prompt: "I want to learn design and I'm looking for a mentor in the community who can guide me through the fundamentals of UI/UX." },
          { label: "Find a mentor in coding", prompt: "I'm learning to code and would love to find a mentor who can help me with web development — HTML, CSS, JavaScript, and React." },
        ],
      },
    ],
  },
  {
    label: "Upcoming events",
    icon: Calendar,
    question: "What kind of event?",
    subs: [
      {
        label: "Hackathon",
        ideas: [
          { label: "AI hackathon this month", prompt: "Are there any AI hackathons happening this month? I'm looking to join one and meet other builders." },
          { label: "Weekend build sprint", prompt: "I'm looking for a weekend build sprint or hackathon where I can ship a side project with other makers." },
        ],
      },
      {
        label: "Meetup",
        ideas: [
          { label: "Local maker meetup", prompt: "Are there any local maker or builder meetups coming up? I want to network with people in my area." },
          { label: "Online community hangout", prompt: "When is the next online community hangout or casual networking event?" },
        ],
      },
      {
        label: "Workshop",
        ideas: [
          { label: "Design workshop", prompt: "Are there any upcoming design workshops? I want to improve my UI/UX skills with hands-on practice." },
          { label: "Coding workshop", prompt: "I'm looking for coding workshops — anything from beginner web dev to advanced topics like AI/ML." },
        ],
      },
    ],
  },
  {
    label: "Post a project",
    icon: Briefcase,
    question: "What type of project?",
    subs: [
      {
        label: "Side project",
        ideas: [
          { label: "Open source tool", prompt: "I want to post an open source side project I'm working on. It's a developer tool and I'm looking for contributors who are interested in the space." },
          { label: "Creative project", prompt: "I have a creative side project — a mix of design and code — and I'm looking for collaborators who want to build something fun together." },
        ],
      },
      {
        label: "Startup",
        ideas: [
          { label: "Early-stage startup looking for help", prompt: "I'm building an early-stage startup and want to post it to find co-builders. We're pre-launch and need help with development and design." },
          { label: "Startup looking for beta testers", prompt: "My startup is ready for beta testing. I want to share it with the community and find early adopters who can give feedback." },
        ],
      },
      {
        label: "Freelance gig",
        ideas: [
          { label: "Design contract", prompt: "I have a freelance design project available — brand identity work for a small business. Looking for a skilled designer in the community." },
          { label: "Development contract", prompt: "I have a freelance development project — building a web app MVP. Looking for a developer who can take it from design to deployment." },
        ],
      },
    ],
  },
];

export default function Home() {
  const { user: authUser, loading: authLoading } = useAuth();
  // Signed-in visitors go straight to the feed. AuthContext tracks the session,
  // so the extra auth listener this used to keep is gone — and `authUser` in
  // the deps is what makes it fire once Clerk has actually resolved, rather
  // than on the first render when it is still null.
  useEffect(() => {
    if (authLoading || !authUser) return;
    window.location.href = "/home";
  }, [authLoading, authUser]);

  const { resolved, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [latestPost, setLatestPost] = useState<{
    slug: string;
    title: string;
    excerpt: string;
  } | null>(null);
  // undefined while loading, null if Luma couldn't be read
  const [events, setEvents] = useState<LumaSummary | null | undefined>(undefined);
  const [heroActionsVisible, setHeroActionsVisible] = useState(true);
  const [joinVisible, setJoinVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const heroActionsRef = useRef<HTMLDivElement>(null);
  const joinRef = useRef<HTMLElement>(null);

  useEffect(() => {
    fetchPosts()
      .then((posts) => {
        // `/api/blog` already returns only posts published in the past, newest first.
        const latest = posts[0];
        if (latest) setLatestPost({
          slug: latest.slug,
          title: latest.title,
          excerpt: latest.excerpt,
        });
      });
  }, []);

  useEffect(() => {
    fetch("/api/event-summary")
      .then((res) => (res.ok ? res.json() : null))
      .then((summary: LumaSummary | null) => setEvents(summary))
      .catch(() => setEvents(null));
  }, []);

  // The phone action bar shows only between the hero's buttons and the closing call to action.
  useEffect(() => {
    const watch = (el: Element | null, set: (v: boolean) => void) => {
      if (!el) return null;
      const io = new IntersectionObserver(([entry]) => set(entry.isIntersecting));
      io.observe(el);
      return io;
    };
    const observers = [
      watch(heroActionsRef.current, setHeroActionsVisible),
      watch(joinRef.current, setJoinVisible),
    ];
    return () => observers.forEach((io) => io?.disconnect());
  }, []);

  const category = ACTION_TREE.find((c) => c.label === activeCategory);
  const sub = category?.subs.find((s) => s.label === activeSub);

  function selectCategory(label: string) {
    if (activeCategory === label) {
      setActiveCategory(null);
      setActiveSub(null);
    } else {
      setActiveCategory(label);
      setActiveSub(null);
    }
  }

  function selectSub(label: string) {
    if (activeSub === label) {
      setActiveSub(null);
    } else {
      setActiveSub(label);
    }
  }

  function selectIdea(prompt: string) {
    setQuery(prompt);
    textareaRef.current?.focus();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullQuery = query.trim();
    if (!fullQuery) return;
    router.push(`/auth?q=${encodeURIComponent(fullQuery)}`);
  }

  return (
    <div className="flex min-h-svh flex-col">
      {/* Hero: real event photos, full bleed, with the next event from Luma */}
      {/* Phones get a shorter hero so the next-event card shows on the first screen. */}
      <section id="hero" className="relative isolate flex min-h-[64svh] flex-col text-white sm:min-h-[88svh] lg:min-h-[92svh]">
        <HeroPhotos />

        <header className="relative z-20 mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image src="/logos/logo-light.svg" alt="MakersLounge" width={20} height={21} />
            <span className="text-lg font-medium tracking-tight">makerslounge</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={openNewsletterPopup}
              className="rounded-full px-3.5 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Newsletter
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Toggle theme"
            >
              {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link
              href="/auth"
              className="rounded-full px-3.5 py-2 text-sm text-white/75 transition-colors hover:bg-white/10 hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="ml-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90"
            >
              Join
            </Link>
          </nav>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-full p-2 text-white/85 transition-colors hover:bg-white/10 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <div className="relative z-10 mx-auto mt-auto grid w-full max-w-[1200px] gap-10 px-5 pb-8 pt-16 sm:px-8 sm:pt-24 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <span className="allow-blur inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/85 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F9BFF]" />
              Toronto&apos;s AI builder community
            </span>
            <h1 className="mt-5 max-w-3xl text-[2.75rem] font-semibold leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-[5.25rem]">
              Where makers build together
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
              A Toronto community of builders who ship, learn, and back each other in the age of AI.
            </p>
            <div ref={heroActionsRef} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90 sm:text-base"
              >
                Join MakersLounge
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={LUMA_CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="allow-blur inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:text-base"
              >
                <Calendar className="h-4 w-4" />
                Upcoming events
              </a>
            </div>
          </div>

          <NextEventCard summary={events} tone="glass" className="hidden lg:block" />
        </div>
      </section>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex items-center justify-between px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
            <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Image src="/logos/logo.svg" alt="MakersLounge" width={20} height={21} className="dark:hidden" />
              <Image src="/logos/logo-light.svg" alt="MakersLounge" width={20} height={21} className="hidden dark:block" />
              <span className="text-lg font-medium tracking-tight">makerslounge</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-full p-2 text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col px-5 pt-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-border py-4 text-2xl font-semibold tracking-tight"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileMenuOpen(false); openNewsletterPopup(); }}
              className="border-b border-border py-4 text-left text-2xl font-semibold tracking-tight"
            >
              Newsletter
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 py-4 text-left text-base text-muted-foreground"
            >
              {resolved === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </nav>
          <div className="flex flex-col gap-3 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            <Link
              href="/auth?mode=signup"
              className="rounded-full bg-foreground py-3.5 text-center text-base font-medium text-background"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join MakersLounge
            </Link>
            <Link
              href="/auth"
              className="rounded-full border border-border py-3.5 text-center text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">
        {/* On phones and tablets the event card sits just under the photo */}
        <section id="next-event" className="px-5 pt-6 sm:px-8 lg:hidden">
          <NextEventCard summary={events} tone="surface" className="mx-auto max-w-xl" />
        </section>

        {/* What happens here, shown with photos from each kind of event */}
        <section id="what-we-do" className="py-16 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <p className="text-sm font-medium text-[var(--blue-core)]">What we do</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
              Three ways to build with us
            </h2>
          </div>
          <div className="mx-auto mt-8 flex max-w-[1200px] snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] sm:mt-12 sm:grid sm:snap-none sm:grid-cols-3 sm:gap-6 sm:overflow-visible sm:px-8 sm:pb-0 [&::-webkit-scrollbar]:hidden">
            {WAYS.map((way) => {
              const external = way.href.startsWith("http");
              return (
                <Link
                  key={way.title}
                  href={way.href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex w-[82%] shrink-0 snap-start flex-col sm:w-auto"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                    <Image
                      src={`/makerslounge-photos/${way.photo}`}
                      alt={way.alt}
                      fill
                      sizes="(min-width: 1200px) 380px, (min-width: 640px) 33vw, 82vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{way.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{way.body}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--blue-core)]">
                    {way.cta}
                    {external ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Real photos from our events, drifting past */}
        <section id="community-photos" aria-label="Photos from MakersLounge events" className="pb-16 sm:pb-24">
          <PhotoMarquee />
        </section>

        {/* Ask the ML agent — the community matcher, and the site's actual product */}
        <section id="ask-ml-agent" className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-[1200px] rounded-[2rem] bg-[var(--sand)] px-5 py-12 sm:px-12 sm:py-20">
            <div className="mx-auto w-full max-w-[680px]">
              <div className="mb-8 flex flex-col items-center text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-medium text-[var(--blue-core)]">
                  <Sparkles className="h-3.5 w-3.5" />
                  ML agent · community matcher
                </span>
                <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">
                  Tell the ML agent what you&apos;re building
                </h2>
                <p className="mt-3 max-w-md text-base text-muted-foreground">
                  It knows every member, event, and project here, and points you at the right ones.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mb-5">
                <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-[var(--shadow-card-hover)] focus-within:ring-2 focus-within:ring-[var(--blue-core)]/25">
                  <textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                    onFocus={() => {
                      // On iOS, the keyboard can cover the textarea — scroll it into view (mobile only)
                      if (window.innerWidth < 768) {
                        setTimeout(() => {
                          textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 300);
                      }
                    }}
                    placeholder="I'm looking for a designer to help ship my app…"
                    rows={3}
                    className="w-full resize-none bg-transparent px-5 pb-14 pt-4 text-base placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                  <div className="absolute bottom-3 right-3">
                    <button
                      type="submit"
                      aria-label="Ask the ML agent"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--blue-core)] text-white transition-opacity hover:opacity-85 disabled:opacity-30"
                      disabled={!query.trim()}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Drill-down quick actions */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {ACTION_TREE.map((action) => {
                    const isActive = activeCategory === action.label;
                    return (
                      <button
                        key={action.label}
                        type="button"
                        onClick={() => selectCategory(action.label)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                          isActive
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <action.icon className="h-4 w-4" />
                        {action.label}
                      </button>
                    );
                  })}
                </div>

                {category && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="mb-2 text-center text-sm font-medium text-foreground">
                      {category.question}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {category.subs.map((s) => {
                        const isActive = activeSub === s.label;
                        return (
                          <button
                            key={s.label}
                            type="button"
                            onClick={() => selectSub(s.label)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                              isActive
                                ? "border-foreground/50 bg-foreground/10 text-foreground"
                                : "border-border bg-card text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sub && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="mb-2 text-center text-sm font-medium text-foreground">
                      Explore ideas
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {sub.ideas.map((idea) => (
                        <button
                          key={idea.label}
                          type="button"
                          onClick={() => selectIdea(idea.prompt)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {idea.label}
                          <ChevronRight className="h-3 w-3 opacity-50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section id="values" className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-10 flex flex-col gap-4 sm:mb-14 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--blue-core)]">What we&apos;re about</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-5xl">Four things we hold onto</h2>
              </div>
              <Link href="/about" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                About the community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((value, i) => (
                <div key={value.label} className="border-t border-border pt-5">
                  <span className="text-sm tabular-nums text-muted-foreground">0{i + 1}</span>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight">{value.label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Listen and read */}
        <section id="listen-and-read" className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="mx-auto grid max-w-[1200px] gap-4 md:grid-cols-2 md:gap-6">
            {/* Podcast */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--blue-core)] text-white">
                  <Mic className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-[var(--blue-core)]">Podcast</span>
                <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">New</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">The MakersLounge Podcast</h3>
              <p className="mb-8 mt-2 text-muted-foreground">Stories from builders, creators, and makers shaping the future.</p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-5">
                <Link href="/podcasts" className="min-w-0 truncate text-sm text-muted-foreground transition-colors hover:text-foreground">
                  Latest: <span className="text-foreground">A Chat with Fayaz</span>
                </Link>
                <Link
                  href="/podcasts"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Listen
                </Link>
              </div>
            </div>

            {/* Blog */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--blue-core)] text-white">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-[var(--blue-core)]">Blog</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight">Stories from the maker community</h3>
              <p className="mb-8 mt-2 text-muted-foreground">Insights, lessons, and recaps from Toronto&apos;s makers.</p>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-5">
                {latestPost ? (
                  <Link href={`/blog/${latestPost.slug}`} className="min-w-0 truncate text-sm text-muted-foreground transition-colors hover:text-foreground">
                    Latest: <span className="text-foreground">{latestPost.title}</span>
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">Recaps, lessons, and interviews.</span>
                )}
                <Link
                  href="/blog"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-85"
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Read
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Closing call to action, back on a photo */}
        <section id="join" ref={joinRef} className="px-5 pb-16 sm:px-8 sm:pb-24">
          <div className="relative isolate mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white sm:px-12 sm:py-28">
            <Image
              src="/makerslounge-photos/team-photo.jpeg"
              alt=""
              fill
              sizes="(min-width: 1200px) 1200px, 100vw"
              className="-z-10 object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-black/60" />
            <h2 className="mx-auto max-w-2xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">Come build with us</h2>
            <p className="mx-auto mt-4 max-w-md text-base text-white/75 sm:text-lg">
              Free to join. Bring a project, or come find one.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-neutral-950 transition-opacity hover:opacity-90 sm:text-base"
              >
                Join MakersLounge
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={LUMA_CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="allow-blur inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:text-base"
              >
                <Calendar className="h-4 w-4" />
                Upcoming events
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 pb-28 pt-10 sm:px-8 md:pb-10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 transition-opacity hover:opacity-70">
              <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
              <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
              <span className="font-medium tracking-tight">makerslounge</span>
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">Build. Connect. Create.</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
            <Link href="/hackathons" className="transition-colors hover:text-foreground">Hackathons</Link>
            <Link href="/blog" className="transition-colors hover:text-foreground">Blog</Link>
            <a href={LUMA_CALENDAR_URL} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">Luma</a>
            <a href="https://instagram.com/makersloungeto" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="transition-colors hover:text-foreground">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://linkedin.com/company/makerslounge" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="transition-colors hover:text-foreground">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-[1200px] text-xs text-muted-foreground/70">
          &copy; {new Date().getFullYear()} MakersLounge. All rights reserved.
        </p>
      </footer>

      <MobileEventBar summary={events} visible={!heroActionsVisible && !joinVisible} />
      <NewsletterPopup />
    </div>
  );
}
