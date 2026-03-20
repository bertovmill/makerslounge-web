"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, ArrowUp, Users, Sparkles, Calendar, Briefcase, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";

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
    <div className="min-h-svh flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
          <Image src="/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
          <Image src="/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
          <span className="text-base sm:text-xl font-sans font-normal tracking-normal">makerslounge</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/auth"
            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-gradient-blue text-white hover:opacity-90 transition-opacity"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-border hover:bg-secondary transition-colors"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero — Manus-style centered layout */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-12 sm:pb-24">
        <h1 className="text-[1.75rem] sm:text-5xl md:text-[3.5rem] tracking-tight leading-[1.15] mb-6 sm:mb-10 text-center">
          How can the <span className="text-gradient-blue">community</span>
          <br />
          help you?
        </h1>

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
