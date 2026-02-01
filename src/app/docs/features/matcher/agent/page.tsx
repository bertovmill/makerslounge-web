"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function MatcherAgentPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Features", href: "/docs/features/people" },
        { label: "Matcher", href: "/docs/features/matcher" },
        { label: "Agent Architecture" },
      ]}
      title="Matcher Agent Architecture"
      description="Technical deep-dive into how the AI-powered matcher agent works."
      prevPage={{ title: "Matcher Overview", href: "/docs/features/matcher" }}
      nextPage={{ title: "Profile", href: "/docs/features/profile" }}
    >
      <h2 id="overview" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Overview
      </h2>
      <p className="text-muted-foreground mb-4">
        The Matcher Agent is an AI-powered system that intelligently groups contacts for networking events.
        It uses Claude (via the Anthropic API) in an <strong>agentic loop</strong> — meaning the AI can
        call tools, analyze results, and iterate until it produces optimal groups.
      </p>

      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 mb-6">
        <p className="text-sm">
          <strong>Key insight:</strong> Unlike a simple prompt→response flow, the agent makes multiple
          turns, using tools to explore data, propose solutions, verify results, and self-correct if needed.
        </p>
      </div>

      <h2 id="how-it-works" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        How It Works
      </h2>
      <p className="text-muted-foreground mb-4">
        The agent follows a structured workflow:
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">1</div>
          <div>
            <h4 className="font-medium">Explore Data</h4>
            <p className="text-sm text-muted-foreground">Agent calls <code className="px-1 py-0.5 bg-accent rounded text-xs">get_all_contacts</code> to see all attendees with their skills, needs, and interests.</p>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">2</div>
          <div>
            <h4 className="font-medium">Analyze Patterns</h4>
            <p className="text-sm text-muted-foreground">Optionally searches for specific skills or needs using <code className="px-1 py-0.5 bg-accent rounded text-xs">search_contacts</code>.</p>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">3</div>
          <div>
            <h4 className="font-medium">Propose Groups</h4>
            <p className="text-sm text-muted-foreground">Creates groups with themes, reasoning, and specific member connections using <code className="px-1 py-0.5 bg-accent rounded text-xs">propose_groups</code>.</p>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">4</div>
          <div>
            <h4 className="font-medium">Verify</h4>
            <p className="text-sm text-muted-foreground">Calls <code className="px-1 py-0.5 bg-accent rounded text-xs">verify_groups</code> to check that everyone is placed exactly once.</p>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">5</div>
          <div>
            <h4 className="font-medium">Submit or Fix</h4>
            <p className="text-sm text-muted-foreground">If valid, submits final groups. If issues found, the agent self-corrects and re-proposes.</p>
          </div>
        </div>
      </div>

      <h2 id="tools" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Available Tools
      </h2>
      <p className="text-muted-foreground mb-4">
        The agent has access to 6 tools that it can call during execution:
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium">Tool</th>
              <th className="text-left py-3 px-4 font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 px-4"><code className="px-1.5 py-0.5 bg-accent rounded text-xs">get_all_contacts</code></td>
              <td className="py-3 px-4 text-muted-foreground">Retrieves all contacts with their data (names, skills, needs, etc.)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4"><code className="px-1.5 py-0.5 bg-accent rounded text-xs">search_contacts</code></td>
              <td className="py-3 px-4 text-muted-foreground">Searches contacts by field value (e.g., find all designers)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4"><code className="px-1.5 py-0.5 bg-accent rounded text-xs">get_contact_by_name</code></td>
              <td className="py-3 px-4 text-muted-foreground">Gets full details for a specific contact</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4"><code className="px-1.5 py-0.5 bg-accent rounded text-xs">propose_groups</code></td>
              <td className="py-3 px-4 text-muted-foreground">Submits proposed grouping with members, themes, and connections</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4"><code className="px-1.5 py-0.5 bg-accent rounded text-xs">verify_groups</code></td>
              <td className="py-3 px-4 text-muted-foreground">Validates that all contacts are placed exactly once</td>
            </tr>
            <tr>
              <td className="py-3 px-4"><code className="px-1.5 py-0.5 bg-accent rounded text-xs">submit_final_groups</code></td>
              <td className="py-3 px-4 text-muted-foreground">Finalizes and returns the verified groups</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="matching-logic" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Matching Logic
      </h2>
      <p className="text-muted-foreground mb-4">
        The agent follows these principles when creating groups:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><strong className="text-foreground">Skill-Need Matching:</strong> Pairs people who HAVE skills with those who NEED them</li>
        <li><strong className="text-foreground">Diversity:</strong> Creates groups with complementary perspectives</li>
        <li><strong className="text-foreground">Even Distribution:</strong> Distributes people evenly across requested groups</li>
        <li><strong className="text-foreground">Connection Mapping:</strong> Identifies 5-8 specific connections per group (who should talk to whom)</li>
        <li><strong className="text-foreground">Theme Generation:</strong> Creates a short theme for each group</li>
      </ul>

      <h2 id="group-output" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Group Output Structure
      </h2>
      <p className="text-muted-foreground mb-4">
        Each group returned by the agent contains:
      </p>
      <pre className="p-4 rounded-xl bg-accent/30 border border-border overflow-x-auto text-sm mb-6">
{`{
  "members": ["Alice Chen", "Bob Smith", "Carol Davis"],
  "theme": "AI Product Builders",
  "reason": "This group combines AI expertise with product
    experience. Alice's ML background complements Bob's
    product skills, while Carol brings design thinking.",
  "connections": [
    {
      "from": "Alice Chen",
      "to": "Bob Smith",
      "reason": "Alice can help Bob with ML integration",
      "strength": 3
    },
    {
      "from": "Bob Smith",
      "to": "Carol Davis",
      "reason": "Bob needs design feedback on his product",
      "strength": 2
    }
    // ... more connections
  ]
}`}
      </pre>

      <h3 id="connection-strength" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Connection Strength
      </h3>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><strong className="text-foreground">Strength 3:</strong> Strong match — highly complementary skills/needs</li>
        <li><strong className="text-foreground">Strength 2:</strong> Moderate match — useful conversation potential</li>
        <li><strong className="text-foreground">Strength 1:</strong> Light match — possible shared interests</li>
      </ul>

      <h2 id="streaming" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Real-Time Streaming
      </h2>
      <p className="text-muted-foreground mb-4">
        The agent uses <strong>Server-Sent Events (SSE)</strong> to stream progress in real-time:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">step</code> — Phase changes (exploring, analyzing, proposing, etc.)</li>
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">thinking</code> — Agent&apos;s reasoning as it works</li>
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">tool_call</code> — When a tool is invoked</li>
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">tool_result</code> — Result of tool execution</li>
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">group</code> — A completed group</li>
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">tokens</code> — Token usage updates</li>
        <li><code className="px-1.5 py-0.5 bg-accent rounded text-xs">complete</code> — Final results</li>
      </ul>

      <h2 id="rate-limiting" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Rate Limit Handling
      </h2>
      <p className="text-muted-foreground mb-4">
        The agent includes automatic retry logic with exponential backoff:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Up to 3 retry attempts on rate limit errors</li>
        <li>Base delay of 5 seconds, doubling each retry (5s → 10s → 20s)</li>
        <li>User is notified of retries via streaming events</li>
        <li>1 second delay between turns to avoid hitting limits</li>
      </ul>

      <h2 id="api-reference" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        API Reference
      </h2>

      <h3 id="endpoint" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Endpoint
      </h3>
      <code className="block px-4 py-3 bg-accent rounded-lg text-sm mb-4">
        POST /api/agents/matcher
      </code>

      <h3 id="request-body" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Request Body
      </h3>
      <pre className="p-4 rounded-xl bg-accent/30 border border-border overflow-x-auto text-sm mb-6">
{`{
  "contacts": [
    { "name": "Alice", "skills": "ML, Python", "needs": "Design help" },
    { "name": "Bob", "skills": "Product", "needs": "Technical cofounder" }
    // ... more contacts
  ],
  "groupSize": 4,    // Number of groups to create
  "stream": true     // Enable SSE streaming (default: true)
}`}
      </pre>

      <h3 id="response" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Response (Non-streaming)
      </h3>
      <pre className="p-4 rounded-xl bg-accent/30 border border-border overflow-x-auto text-sm mb-6">
{`{
  "groups": [
    {
      "members": ["Alice", "Bob", "Carol"],
      "theme": "AI Product Team",
      "reason": "Complementary skills for building AI products",
      "connections": [...]
    }
    // ... more groups
  ]
}`}
      </pre>

      <h2 id="configuration" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Configuration
      </h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><strong className="text-foreground">Max Duration:</strong> 180 seconds (3 minutes)</li>
        <li><strong className="text-foreground">Max Turns:</strong> 20 agentic turns</li>
        <li><strong className="text-foreground">Model:</strong> claude-sonnet-4-20250514</li>
        <li><strong className="text-foreground">Max Tokens:</strong> 4096 per turn</li>
      </ul>

      <h2 id="best-practices" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Best Practices
      </h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Include <strong className="text-foreground">skills</strong> and <strong className="text-foreground">needs</strong> fields in your contact data for best results</li>
        <li>Use descriptive text in contact fields (not just keywords)</li>
        <li>Request fewer groups for better connection density</li>
        <li>Minimum 2 contacts required, works best with 8-50 contacts</li>
      </ul>
    </DocsPageWrapper>
  );
}
