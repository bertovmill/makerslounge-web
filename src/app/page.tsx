"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchPosts } from "@/lib/blog-list-client";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, ArrowUp, Users, Sparkles, Calendar, Briefcase, ChevronRight, ArrowRight, Instagram, Linkedin, Menu, X, Mic, Play, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import NewsletterPopup, { OPEN_NEWSLETTER_EVENT } from "@/components/NewsletterPopup";
import { Constellation, Eyebrow } from "@/components/Motif";
import { HeroField } from "@/components/landing/HeroField";
import { LogoDots } from "@/components/landing/LogoDots";
import { MayField, type MayFieldRef } from "@/components/landing/MayField";
import { LiveValueArt } from "@/components/landing/LiveValueArt";
import { GlassCard } from "@/components/landing/GlassCard";
import type { ValueKey } from "@/components/landing/ValueArt";

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

const VALUES: { key: ValueKey; label: string; description: string }[] = [
  { key: "hustle", label: "Hustle", description: "We ship fast, iterate often, and never stop building." },
  { key: "learning", label: "Learning", description: "Every maker is a student. We grow by sharing knowledge." },
  { key: "community", label: "Community", description: "We lift each other up. Your win is our win." },
  { key: "fun", label: "Fun", description: "Building should be exciting. We celebrate the joy of creating." },
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mayFieldRef = useRef<MayFieldRef>(null);

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
    mayFieldRef.current?.pulseFrom(textareaRef.current);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullQuery = query.trim();
    if (!fullQuery) return;
    router.push(`/auth?q=${encodeURIComponent(fullQuery)}`);
  }

  return (
    <div className="min-h-svh flex flex-col relative overflow-hidden">
      {/* Background: flat colour blocks and arcs — no blur, no gradients.
          Grain comes from the global body overlay. */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Constellation tone="core" className="opacity-35 dark:opacity-55" />
      </div>

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
          <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
          <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
          <span className="text-base sm:text-xl font-sans font-normal tracking-normal">makerslounge</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/about"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            About Us
          </Link>
          <Link
            href="/hackathons"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Hackathons
          </Link>
          <Link
            href="/podcasts"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Podcasts
          </Link>
          <button
            onClick={openNewsletterPopup}
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Newsletter
          </button>
          <Link
            href="/auth"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm font-medium px-4 py-2 rounded-md bg-gradient-blue text-white hover:opacity-90 transition-opacity"
          >
            Join Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link href="/" className="flex items-center gap-1.5" onClick={() => setMobileMenuOpen(false)}>
              <Image src="/logos/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
              <Image src="/logos/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
              <span className="text-base font-sans font-normal tracking-normal">makerslounge</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 flex flex-col items-center justify-center gap-6">
            <Link
              href="/about"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/hackathons"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hackathons
            </Link>
            <Link
              href="/podcasts"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Podcasts
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); openNewsletterPopup(); }}
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Newsletter
            </button>
            <Link
              href="/auth"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="text-lg font-medium px-8 py-3 rounded-full bg-gradient-blue text-white hover:opacity-90 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Now
            </Link>
            <button
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors flex items-center gap-2"
            >
              {resolved === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </nav>
        </div>
      )}

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col">
        <section id="hero" className="relative flex min-h-[72svh] flex-col items-center justify-center px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-12">
          {/* The sun: a WebGPU field when the browser can, a flat arc when it can't. */}
          <HeroField className="-top-[12%] -bottom-[6%]" />

          <div className="relative flex flex-col items-center">
            <LogoDots className="relative mb-5 h-14 w-14 sm:mb-6 sm:h-20 sm:w-20" />

            <Eyebrow className="relative mb-4">Build · Connect · Create</Eyebrow>

            <h1 className="relative mb-4 text-center text-5xl tracking-[-0.03em] text-foreground sm:mb-6 sm:text-7xl md:text-8xl">
              Where <span className="text-gradient-blue">makers</span> build
              <br />
              together
            </h1>

            <p className="relative mb-8 max-w-md text-center text-base leading-relaxed text-muted-foreground sm:mb-10 sm:text-lg">
              A Toronto community of builders who ship, learn, and back each other in the age of AI.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center gap-2 border-[1.5px] border-[var(--ink)] bg-[var(--ink)] px-6 py-2.5 text-sm font-medium text-[var(--paper)] shadow-[var(--shadow-card)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:px-8 sm:py-3 sm:text-base"
              >
                Join Now
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://lu.ma/makerslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-[1.5px] border-[var(--ink)] bg-[var(--paper)] px-6 py-2.5 text-sm font-medium text-foreground shadow-[var(--shadow-card)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] sm:px-8 sm:py-3 sm:text-base"
              >
                <Calendar className="h-4 w-4" />
                Next event
              </a>
            </div>

            <div className="mt-8 flex items-center gap-1 sm:mt-10">
              <span className="mr-2 text-xs text-foreground/60 sm:text-sm dark:text-muted-foreground/60">Follow us</span>
              <a
                href="https://lu.ma/makerslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-foreground/60 transition-colors hover:bg-secondary/50 hover:text-foreground sm:text-sm dark:text-muted-foreground"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C12 2 14 8.5 12 12C10 8.5 12 2 12 2ZM12 22C12 22 10 15.5 12 12C14 15.5 12 22 12 22ZM2 12C2 12 8.5 10 12 12C8.5 14 2 12 2 12ZM22 12C22 12 15.5 14 12 12C15.5 10 22 12 22 12Z" />
                </svg>
                Luma
              </a>
              <a
                href="https://instagram.com/makersloungeto"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-foreground/60 transition-colors hover:bg-secondary/50 hover:text-foreground sm:text-sm dark:text-muted-foreground"
              >
                <Instagram className="h-3.5 w-3.5" />
                Instagram
              </a>
              <a
                href="https://linkedin.com/company/makerslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-foreground/60 transition-colors hover:bg-secondary/50 hover:text-foreground sm:text-sm dark:text-muted-foreground"
              >
                <Linkedin className="h-3.5 w-3.5" />
                LinkedIn
              </a>
            </div>
          </div>
        </section>

        {/* Ask May — the community matcher, and the site's actual product */}
        <section id="ask-may" className="relative px-4 pb-16 sm:px-6 sm:pb-24">
          <MayField ref={mayFieldRef} className="-top-16 -bottom-8" />
          <div className="relative mx-auto w-full max-w-[720px]">
            <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
              <Eyebrow className="mb-3">May · community matcher</Eyebrow>
              <h2 className="text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">
                Tell May what you&apos;re building
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground sm:text-base">
                She knows every member, event, and project here, and points you at the right ones.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-4">
              <div className="relative overflow-hidden border-[1.5px] border-[var(--ink)] bg-card shadow-[var(--shadow-card)] transition-shadow focus-within:shadow-[var(--shadow-card-hover)]">
                <textarea
                  ref={textareaRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    mayFieldRef.current?.pulseFrom(e.currentTarget);
                  }}
                  onBlur={() => mayFieldRef.current?.setEnergy(0)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  onFocus={() => {
                    mayFieldRef.current?.setEnergy(1);
                    // On iOS, the keyboard can cover the textarea — scroll it into view (mobile only)
                    if (window.innerWidth < 768) {
                      setTimeout(() => {
                        textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }, 300);
                    }
                  }}
                  placeholder="I'm looking for a designer to help ship my app…"
                  rows={2}
                  className="w-full resize-none bg-transparent px-4 pb-12 pt-3.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none sm:px-5 sm:pt-4 sm:text-[15px]"
                />
                <div className="absolute bottom-3 right-3">
                  <button
                    type="submit"
                    aria-label="Ask May"
                    className="flex h-9 w-9 items-center justify-center bg-[var(--blue-core)] text-white transition-opacity hover:opacity-85 disabled:opacity-30"
                    disabled={!query.trim()}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </form>

            {/* Drill-down quick actions */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {ACTION_TREE.map((action) => {
                  const isActive = activeCategory === action.label;
                  return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => selectCategory(action.label)}
                      className={`inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs transition-colors sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
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
                          className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 text-sm transition-colors ${
                            isActive
                              ? "border-foreground/50 bg-foreground/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
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
                        className="inline-flex items-center gap-1.5 border border-border px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground"
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
        </section>

        {/* Values */}
        <section id="values" className="relative px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto w-full max-w-[1040px]">
            <div className="mb-6 flex flex-col items-start gap-2 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Eyebrow className="mb-2">What we&apos;re about</Eyebrow>
                <h2 className="text-2xl tracking-[-0.02em] text-foreground sm:text-3xl">Four things we hold onto</h2>
              </div>
              <Link href="/about" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
                About the community
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {VALUES.map((value) => (
                <div key={value.key} className="flat-card halftone-wipe flex flex-col overflow-hidden">
                  <LiveValueArt value={value.key} />
                  <div className="p-4 sm:p-5">
                    <h3 className="mb-1 font-display text-lg text-foreground sm:text-xl">{value.label}</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground/90 sm:text-sm">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Listen and read */}
        <section id="listen-and-read" className="relative px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto grid w-full max-w-[1040px] gap-4 md:grid-cols-2">
            {/* Podcast */}
            <GlassCard seed={[0.9, 2.3]} className="flex flex-col overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="field-blue flex h-12 w-12 flex-shrink-0 items-center justify-center">
                  <Mic className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="label-caps text-[var(--blue-core)]">Podcast</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 sm:text-xs dark:text-green-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      New
                    </span>
                  </div>
                  <h3 className="font-display text-xl text-foreground">The MakersLounge Podcast</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Stories from builders, creators, and makers shaping the future.</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                <Link href="/auth" className="flex min-w-0 items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-foreground">
                  <span className="label-caps flex-shrink-0">Latest</span>
                  <span className="truncate">A Chat with Fayaz</span>
                </Link>
                <Link
                  href="/auth"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80 sm:text-sm"
                >
                  <Play className="h-3 w-3 fill-current" />
                  Listen
                </Link>
              </div>
            </GlassCard>

            {/* Blog */}
            <GlassCard seed={[4.1, 0.6]} className="flex flex-col overflow-hidden">
              <div className="flex items-start gap-4 p-5">
                <div className="field-blue flex h-12 w-12 flex-shrink-0 items-center justify-center">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="label-caps text-[var(--blue-core)]">Blog</span>
                    {latestPost && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-600 sm:text-xs dark:text-green-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        New
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-xl text-foreground">Stories from the maker community</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Insights, lessons, and recaps from Toronto&apos;s makers.</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-border px-5 py-3">
                {latestPost ? (
                  <Link href={`/blog/${latestPost.slug}`} className="flex min-w-0 items-center gap-2 text-sm text-foreground/80 transition-colors hover:text-foreground">
                    <span className="label-caps flex-shrink-0">Latest</span>
                    <span className="truncate">{latestPost.title}</span>
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground">Recaps, lessons, and interviews.</span>
                )}
                <Link
                  href="/blog"
                  className="inline-flex flex-shrink-0 items-center gap-1.5 bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-80 sm:text-sm"
                >
                  <BookOpen className="h-3 w-3" />
                  Read
                </Link>
              </div>
            </GlassCard>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border field-sand">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            {/* Brand */}
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Link href="/" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
                <Image src="/logos/logo.svg" alt="MakersLounge" width={16} height={17} className="dark:hidden" />
                <Image src="/logos/logo-light.svg" alt="MakersLounge" width={16} height={17} className="hidden dark:block" />
                <span className="text-sm font-sans font-normal">makerslounge</span>
              </Link>
              <p className="text-xs text-muted-foreground/60">Build. Connect. Create.</p>
            </div>

            {/* Links */}
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground/60">
              <Link href="/hackathons" className="hover:text-foreground transition-colors">Hackathons</Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <a href="https://lu.ma/makerslounge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Luma</a>
              <a href="https://instagram.com/makersloungeto" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
              <a href="https://linkedin.com/company/makerslounge" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground/40">&copy; {new Date().getFullYear()} MakersLounge. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <NewsletterPopup />
    </div>
  );
}
