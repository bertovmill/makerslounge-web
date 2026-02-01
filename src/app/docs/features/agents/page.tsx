"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function AgentsFeaturePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Features", href: "/docs/features/people" },
        { label: "Agents" },
      ]}
      title="AI Agents"
      description="Powerful AI tools designed to help makers work more efficiently."
      prevPage={{ title: "Profile", href: "/docs/features/profile" }}
      nextPage={{ title: "Connections", href: "/docs/features/connections" }}
    >
      <h2 id="overview" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Overview
      </h2>
      <p className="text-muted-foreground mb-4">
        MakersLounge provides AI-powered agents that help you with various tasks as a maker.
        These agents are designed to save you time and help you work more effectively.
      </p>

      <h2 id="available-agents" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Available Agents
      </h2>

      <h3 id="matcher-agent" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Matcher Agent
      </h3>
      <p className="text-muted-foreground mb-4">
        The Matcher Agent analyzes your contacts and identifies the best potential collaborators.
        It uses AI to understand each contact&apos;s background and relevance to your work.
      </p>

      <h3 id="future-agents" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Coming Soon
      </h3>
      <p className="text-muted-foreground mb-4">
        We&apos;re working on additional agents to help makers:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Project idea generator</li>
        <li>Portfolio optimizer</li>
        <li>Networking assistant</li>
        <li>Content creation helper</li>
      </ul>

      <h2 id="how-agents-work" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        How Agents Work
      </h2>
      <p className="text-muted-foreground mb-4">
        Our agents are built on advanced AI models and follow a multi-step workflow:
      </p>
      <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
        <li className="pl-2">You provide input data or a request</li>
        <li className="pl-2">The agent processes your input using AI</li>
        <li className="pl-2">Results are generated and displayed in real-time</li>
        <li className="pl-2">You can review, refine, or act on the results</li>
      </ol>
    </DocsPageWrapper>
  );
}
