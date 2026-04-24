"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, ArrowUp, Users, Sparkles, Calendar, Briefcase, ChevronRight, ArrowRight, Instagram, Linkedin, Menu, X, Mic, Play, ExternalLink, Zap, BookOpen, Heart, PartyPopper } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";

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
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      window.location.href = "/home";
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { resolved, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    <div className="min-h-svh flex flex-col relative overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2a4a]/30 via-transparent to-[#1a1a2e]/20 dark:from-[#1a2a4a]/60 dark:via-transparent dark:to-[#1a1a2e]/40" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#3A9FF3]/10 dark:bg-[#3A9FF3]/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#6AC4F7]/8 dark:bg-[#6AC4F7]/10 blur-[100px]" />
        <div className="absolute inset-0 grain-overlay h-full w-full" />
      </div>

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
          <Image src="/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
          <Image src="/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
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
          <a
            href="/learn-more"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Learn More
          </a>
          <Link
            href="/auth"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=apply"
            className="text-sm font-medium px-4 py-2 rounded-md bg-gradient-blue text-white hover:opacity-90 transition-opacity"
          >
            Apply to Join
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
        <div className="sm:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link href="/" className="flex items-center gap-1.5" onClick={() => setMobileMenuOpen(false)}>
              <Image src="/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
              <Image src="/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
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
            <a
              href="/learn-more"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Learn More
            </a>
            <Link
              href="/auth"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=apply"
              className="text-lg font-medium px-8 py-3 rounded-full bg-gradient-blue text-white hover:opacity-90 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Apply to Join
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-12 sm:pb-24">
        {/* Light glow behind title */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[75%] w-[500px] h-[400px] sm:w-[700px] sm:h-[500px] rounded-full bg-white/60 dark:bg-white/[0.04] blur-[100px] pointer-events-none" />

        {/* Animated logo above title */}
        <AnimatedLogo className="relative w-14 h-14 sm:w-20 sm:h-20 mb-5 sm:mb-6" />

        <h1 className="relative text-3xl sm:text-5xl md:text-[3.5rem] font-semibold tracking-tight leading-[1.15] mb-3 sm:mb-5 text-center text-foreground">
          Where <span className="text-gradient-blue">makers</span> build
          <br />
          together
        </h1>

        <p className="text-base sm:text-lg text-foreground/80 dark:text-foreground/60 text-center max-w-md mb-6 sm:mb-10 leading-relaxed">
          Our mission is to empower makers to build, connect, and thrive in the age of AI.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col items-center gap-3 mb-6 sm:mb-8">
          <Link href="/auth?mode=apply">
            <HoverBorderGradient
              containerClassName="rounded-full"
              as="div"
              className="dark:bg-black bg-white text-foreground dark:text-white flex items-center gap-2 px-6 sm:px-8 py-2 sm:py-2.5 text-sm sm:text-base font-medium"
            >
              Apply to Join
              <ArrowRight className="w-4 h-4" />
            </HoverBorderGradient>
          </Link>
        </div>

        {/* Social links */}
        <div className="flex items-center gap-1 mb-8 sm:mb-12">
          <span className="text-xs sm:text-sm text-foreground/60 dark:text-muted-foreground/60 mr-2">Follow us</span>
          <a
            href="https://lu.ma/makerslounge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm text-foreground/60 dark:text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C12 2 14 8.5 12 12C10 8.5 12 2 12 2ZM12 22C12 22 10 15.5 12 12C14 15.5 12 22 12 22ZM2 12C2 12 8.5 10 12 12C8.5 14 2 12 2 12ZM22 12C22 12 15.5 14 12 12C15.5 10 22 12 22 12Z" />
            </svg>
            Luma
          </a>
          <a
            href="https://instagram.com/makersloungeto"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm text-foreground/60 dark:text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Instagram className="w-3.5 h-3.5" />
            Instagram
          </a>
          <a
            href="https://linkedin.com/company/makerslounge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs sm:text-sm text-foreground/60 dark:text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Linkedin className="w-3.5 h-3.5" />
            LinkedIn
          </a>
        </div>

        {/* Values Section */}
        <div className="w-full max-w-[640px] mb-8 sm:mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Zap, label: "Hustle", description: "We ship fast, iterate often, and never stop building." },
              { icon: BookOpen, label: "Learning", description: "Every maker is a student. We grow by sharing knowledge." },
              { icon: Heart, label: "Community", description: "We lift each other up. Your win is our win." },
              { icon: PartyPopper, label: "Fun", description: "Building should be exciting. We celebrate the joy of creating." },
            ].map((value) => (
              <div
                key={value.label}
                className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#6AC4F7] to-[#1A7DE8] flex items-center justify-center mb-3">
                  <value.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1">{value.label}</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground/80 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Podcast Section */}
        <div className="w-full max-w-[640px] mb-8 sm:mb-12">
          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-4 p-4 sm:p-5">
              {/* Podcast icon */}
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#6AC4F7] to-[#1A7DE8] flex items-center justify-center">
                <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-[#3A9FF3]">Podcast</span>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs text-green-500 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    New
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">The MakersLounge Podcast</h3>
                <p className="text-xs sm:text-sm text-muted-foreground/80 line-clamp-1">Stories from builders, creators, and makers shaping the future.</p>
              </div>

              {/* Listen button */}
              <Link
                href="/auth"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-foreground text-background text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Play className="w-3 h-3 fill-current" />
                Listen
              </Link>
            </div>

            {/* Latest episode preview */}
            <Link href="/auth" className="border-t border-border px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
              <span className="text-[10px] sm:text-xs text-muted-foreground/60 uppercase tracking-wide flex-shrink-0">Latest</span>
              <p className="text-xs sm:text-sm text-foreground/80 truncate">A Chat with Fayaz</p>
              <ExternalLink className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full max-w-[640px] flex items-center gap-3 mb-6 sm:mb-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground/60">or tell us what you need</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Input box */}
        <form onSubmit={handleSubmit} className="w-full max-w-[640px] mb-4 sm:mb-6">
          <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden focus-within:shadow-blue-glow focus-within:border-[var(--blue-start)]/30 transition-all duration-300">
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
              placeholder="Describe what you're looking for..."
              rows={2}
              className="w-full resize-none bg-transparent px-4 sm:px-5 pt-3 sm:pt-4 pb-10 sm:pb-12 text-sm sm:text-[15px] placeholder:text-muted-foreground/60 focus:outline-none"
            />
            <div className="absolute bottom-3 right-3">
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-gradient-blue text-white flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30"
                disabled={!query.trim()}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Drill-down quick actions */}
        <div className="w-full max-w-[640px] space-y-3">
          {/* Level 1: Categories */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ACTION_TREE.map((action) => {
              const isActive = activeCategory === action.label;
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => selectCategory(action.label)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border text-xs sm:text-sm transition-colors ${
                    isActive
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </button>
              );
            })}
          </div>

          {/* Level 2: Sub-options */}
          {category && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-sm font-medium text-foreground mb-2 text-center">
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
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-sm transition-colors ${
                        isActive
                          ? "border-foreground/50 bg-foreground/10 text-foreground"
                          : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Level 3: Ideas that populate the prompt */}
          {sub && (
            <div className="animate-in fade-in slide-in-from-top-1 duration-200">
              <p className="text-sm font-medium text-foreground mb-2 text-center">
                Explore ideas
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {sub.ideas.map((idea) => (
                  <button
                    key={idea.label}
                    type="button"
                    onClick={() => selectIdea(idea.prompt)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    {idea.label}
                    <ChevronRight className="w-3 h-3 opacity-50" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
