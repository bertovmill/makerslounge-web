"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search, FolderOpen, Users, MessageCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search",
    description: "Find makers by skills, interests, or project types with AI-powered search.",
  },
  {
    icon: FolderOpen,
    title: "Showcase",
    description: "Add your projects to your profile so others can discover your work.",
  },
  {
    icon: Users,
    title: "Match",
    description: "Get matched with makers who complement your skills and goals.",
  },
  {
    icon: MessageCircle,
    title: "Connect",
    description: "Message makers, find their socials, and start building together.",
  },
];

export default function LearnMorePage() {
  const { resolved, toggleTheme } = useTheme();

  return (
    <div className="h-svh flex flex-col">
      {/* Nav — same as landing page */}
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
            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-md bg-gradient-blue text-white hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Content — fits in remaining viewport */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <h1 className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-center mb-2 sm:mb-3">
          How it works
        </h1>
        <p className="text-xs sm:text-base text-foreground/60 dark:text-muted-foreground/80 text-center max-w-sm mb-6 sm:mb-10">
          Find your people, share your work, and build together.
        </p>

        <div className="w-full max-w-3xl grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="flex flex-col items-center text-center p-4 sm:p-5 rounded-xl border border-border bg-card/50"
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg bg-gradient-blue flex items-center justify-center text-white mb-2.5 sm:mb-3">
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground/60 mb-0.5">Step {i + 1}</span>
              <h2 className="text-sm sm:text-base font-semibold mb-1">{step.title}</h2>
              <p className="text-[11px] sm:text-sm text-muted-foreground leading-snug">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/auth?mode=signup"
          className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full bg-[linear-gradient(135deg,#1A6BC4_0%,#2B7DC9_50%,#3A8FDB_100%)] dark:bg-gradient-blue text-white text-sm sm:text-base font-medium hover:opacity-90 transition-opacity shadow-blue-glow"
        >
          Get Started
          <ArrowRight className="w-4 h-4" />
        </Link>
      </main>
    </div>
  );
}
