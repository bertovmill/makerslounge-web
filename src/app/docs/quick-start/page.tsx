"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function QuickStartPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Quick Start" },
      ]}
      title="Quick Start"
      description="Get up and running with MakersLounge in under 5 minutes."
      prevPage={{ title: "Introduction", href: "/docs" }}
      nextPage={{ title: "People Directory", href: "/docs/features/people" }}
    >
      <h2 id="step-1" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 1: Create Your Account
      </h2>
      <p className="text-muted-foreground mb-4">
        Visit the <a href="/auth" className="text-primary hover:underline">sign up page</a> and create your account using your email or a social login provider.
      </p>

      <h2 id="step-2" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 2: Complete Your Profile
      </h2>
      <p className="text-muted-foreground mb-4">
        After signing in, you&apos;ll be taken to your profile page. Fill in your:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><span className="text-foreground">Display name</span> — How you want to be known</li>
        <li><span className="text-foreground">Username</span> — For your public profile URL</li>
        <li><span className="text-foreground">Bio</span> — Tell others what you&apos;re working on</li>
        <li><span className="text-foreground">Skills</span> — Your areas of expertise</li>
      </ul>

      <h2 id="step-3" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 3: Explore the Community
      </h2>
      <p className="text-muted-foreground mb-4">
        Head to the <a href="/people" className="text-primary hover:underline">People</a> page to discover other makers.
        You can browse profiles, see what others are building, and find potential collaborators.
      </p>

      <h2 id="step-4" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 4: Use the Matcher
      </h2>
      <p className="text-muted-foreground mb-4">
        Have a list of contacts you want to prioritize? Use the <a href="/matcher" className="text-primary hover:underline">Matcher</a> to
        upload your contacts and let our AI help you find the best matches for collaboration.
      </p>

      <h2 id="whats-next" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        What&apos;s Next?
      </h2>
      <p className="text-muted-foreground mb-4">
        Now that you&apos;re set up, explore these resources:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <a href="/docs/guides/profile-setup" className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group">
          <h4 className="font-medium group-hover:text-primary transition-colors">Profile Setup Guide →</h4>
          <p className="text-sm text-muted-foreground mt-1">Optimize your profile for visibility</p>
        </a>
        <a href="/docs/features/matcher" className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group">
          <h4 className="font-medium group-hover:text-primary transition-colors">Matcher Features →</h4>
          <p className="text-sm text-muted-foreground mt-1">Learn advanced matching options</p>
        </a>
      </div>
    </DocsPageWrapper>
  );
}
