"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function MatcherFeaturePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Features", href: "/docs/features/people" },
        { label: "Matcher" },
      ]}
      title="Smart Matcher"
      description="AI-powered contact matching to find your best collaborators."
      prevPage={{ title: "People Directory", href: "/docs/features/people" }}
      nextPage={{ title: "Agent Architecture", href: "/docs/features/matcher/agent" }}
    >
      <h2 id="what-is-matcher" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        What is the Matcher?
      </h2>
      <p className="text-muted-foreground mb-4">
        The Matcher is an AI-powered tool that helps you identify the best potential collaborators
        from your existing contacts. Upload a list of contacts and our AI will analyze and rank them
        based on relevance to your goals.
      </p>

      <h2 id="how-it-works" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        How It Works
      </h2>
      <ol className="list-decimal list-inside space-y-3 text-muted-foreground mb-6">
        <li className="pl-2">
          <span className="font-medium text-foreground">Upload your contacts</span> — Paste or upload a CSV of your contacts
        </li>
        <li className="pl-2">
          <span className="font-medium text-foreground">AI analysis</span> — Our agent analyzes each contact&apos;s background
        </li>
        <li className="pl-2">
          <span className="font-medium text-foreground">Ranking</span> — Contacts are ranked by match potential
        </li>
        <li className="pl-2">
          <span className="font-medium text-foreground">Results</span> — Review your top matches with explanations
        </li>
      </ol>

      <h2 id="data-format" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Data Format
      </h2>
      <p className="text-muted-foreground mb-4">
        The Matcher accepts contact data in various formats:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>CSV files with name, title, company columns</li>
        <li>Plain text with one contact per line</li>
        <li>Pasted data from spreadsheets</li>
      </ul>

      <h2 id="privacy" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Privacy & Data Handling
      </h2>
      <p className="text-muted-foreground mb-4">
        Your contact data is processed securely and is not stored permanently. The matching
        results are generated in real-time and only you can see them.
      </p>

      <h2 id="technical-details" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Technical Details
      </h2>
      <p className="text-muted-foreground mb-4">
        Want to understand how the AI agent works under the hood?
      </p>
      <a
        href="/docs/features/matcher/agent"
        className="inline-flex items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group"
      >
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
        <div>
          <h4 className="font-medium group-hover:text-primary transition-colors">Agent Architecture →</h4>
          <p className="text-sm text-muted-foreground">Deep-dive into the agentic loop, tools, and API</p>
        </div>
      </a>
    </DocsPageWrapper>
  );
}
