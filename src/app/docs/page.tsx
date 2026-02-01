"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import OnThisPage from "@/components/docs/OnThisPage";

function OnThisPagePortal() {
  useEffect(() => {
    // Force re-render after mount to detect headings
  }, []);

  const container = typeof document !== "undefined"
    ? document.getElementById("on-this-page-container")
    : null;

  if (!container) return null;
  return createPortal(<OnThisPage />, container);
}

export default function DocsPage() {
  return (
    <>
      <OnThisPagePortal />

      <div className="max-w-3xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <span>Docs</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-foreground">Introduction</span>
        </div>

        {/* Page Header */}
        <h1 className="text-4xl font-bold mb-4">Introduction</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Welcome to MakersLounge! Learn how to use the platform and connect with other makers.
        </p>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h2 id="what-is-makerslounge" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
            What is MakersLounge?
          </h2>
          <p className="text-muted-foreground mb-4">
            MakersLounge is a platform designed to connect makers, builders, and creators. Whether you&apos;re
            a software developer, designer, hardware enthusiast, or any type of creator, MakersLounge helps
            you find collaborators, showcase your work, and grow your network.
          </p>

          <h2 id="key-features" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
            Key Features
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div className="p-4 rounded-xl border border-border bg-accent/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-medium">People Directory</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Browse and discover makers in the community. Filter by skills and interests.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-accent/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium">Smart Matcher</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered matching to find the best collaborators from your contacts.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-accent/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-medium">Maker Profiles</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Showcase your projects, skills, and connect your social profiles.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-accent/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium">AI Agents</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Powerful AI tools to help you with various maker tasks.
              </p>
            </div>
          </div>

          <h2 id="getting-started" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
            Getting Started
          </h2>
          <p className="text-muted-foreground mb-4">
            Getting started with MakersLounge is simple. Follow these steps:
          </p>
          <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
            <li className="pl-2">
              <span className="font-medium text-foreground">Create an account</span> — Sign up using your email or social login
            </li>
            <li className="pl-2">
              <span className="font-medium text-foreground">Complete your profile</span> — Add your skills, bio, and projects
            </li>
            <li className="pl-2">
              <span className="font-medium text-foreground">Explore the community</span> — Browse makers in the People directory
            </li>
            <li className="pl-2">
              <span className="font-medium text-foreground">Connect with others</span> — Use the Matcher to find collaborators
            </li>
          </ol>

          <h2 id="platform-overview" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
            Platform Overview
          </h2>

          <h3 id="navigation" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
            Navigation
          </h3>
          <p className="text-muted-foreground mb-4">
            The main navigation is located in the left sidebar on desktop and in a hamburger menu on mobile.
            From there you can access:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li><span className="text-foreground">Home</span> — Your personalized feed</li>
            <li><span className="text-foreground">People</span> — Browse all makers</li>
            <li><span className="text-foreground">Matcher</span> — AI-powered contact matching</li>
            <li><span className="text-foreground">Agents</span> — AI tools for makers</li>
            <li><span className="text-foreground">Profile</span> — Manage your profile</li>
            <li><span className="text-foreground">Connections</span> — Your network</li>
          </ul>

          <h3 id="your-profile" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
            Your Profile
          </h3>
          <p className="text-muted-foreground mb-4">
            Your profile is your presence on MakersLounge. It includes your bio, skills, projects,
            and social links. You can also get a custom public URL like <code className="px-1.5 py-0.5 bg-accent rounded text-sm">makerslounge.com/p/username</code>.
          </p>

          <h2 id="next-steps" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
            Next Steps
          </h2>
          <p className="text-muted-foreground mb-4">
            Ready to dive deeper? Check out these guides:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <a href="/docs/guides/profile-setup" className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group">
              <h4 className="font-medium group-hover:text-primary transition-colors">Setting Up Your Profile →</h4>
              <p className="text-sm text-muted-foreground mt-1">Learn how to create an effective maker profile</p>
            </a>
            <a href="/docs/guides/matcher" className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group">
              <h4 className="font-medium group-hover:text-primary transition-colors">Using the Matcher →</h4>
              <p className="text-sm text-muted-foreground mt-1">Find the best collaborators from your contacts</p>
            </a>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex justify-between items-center mt-12 pt-6 border-t border-border">
          <div />
          <a href="/docs/quick-start" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
            Quick Start
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
}
