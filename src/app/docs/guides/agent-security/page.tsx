"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";
import Link from "next/link";

export default function AgentSecurityPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Guides", href: "/docs/guides/profile-setup" },
        { label: "Agent Security" },
      ]}
      title="Agent Security"
      description="How we securely deploy AI agents following Anthropic's best practices."
      prevPage={{ title: "Finding Collaborators", href: "/docs/guides/collaborators" }}
      nextPage={{ title: "FAQ", href: "/docs/faq" }}
    >
      <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5 mb-6 flex items-start gap-3">
        <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Security First</p>
          <p className="text-sm text-muted-foreground">
            Our agents are deployed following{" "}
            <a
              href="https://docs.anthropic.com/en/docs/build-with-claude/agent-sdk/securely-deploying-agents"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Anthropic&apos;s official security guidelines
            </a>{" "}
            for AI agent deployments.
          </p>
        </div>
      </div>

      <h2 id="overview" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Overview
      </h2>
      <p className="text-muted-foreground mb-4">
        AI agents are powerful tools that can interact with external services, process content, and take actions
        on behalf of users. Unlike traditional software that follows predetermined code paths, agents generate
        their actions dynamically based on context and goals.
      </p>
      <p className="text-muted-foreground mb-6">
        This flexibility is what makes them useful, but it also means we need thoughtful security controls.
        MakersLounge implements defense in depth to ensure agents operate safely.
      </p>

      <h2 id="security-principles" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Security Principles
      </h2>
      <p className="text-muted-foreground mb-4">
        Our agent security follows three core principles:
      </p>

      <div className="grid gap-4 sm:grid-cols-1 mb-6">
        <div className="p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-medium">Least Privilege</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Agents only have access to the capabilities required for their specific task. They cannot
            access resources or perform actions outside their defined scope.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="font-medium">Defense in Depth</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Multiple layers of security controls work together. If one layer is bypassed, others provide
            protection. This includes authentication, authorization, validation, and monitoring.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium">Transparency</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Users can see exactly what security measures are in place. Each agent displays a security
            badge with details about the protections applied.
          </p>
        </div>
      </div>

      <h2 id="implemented-controls" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Implemented Security Controls
      </h2>
      <p className="text-muted-foreground mb-4">
        Every agent in MakersLounge has the following security measures:
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium">Control</th>
              <th className="text-left py-3 px-4 font-medium">Description</th>
              <th className="text-left py-3 px-4 font-medium">Protection</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </td>
              <td className="py-3 px-4 font-medium">API Authentication</td>
              <td className="py-3 px-4 text-muted-foreground">Session-based auth via Clerk. Only the admin can trigger agents.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </td>
              <td className="py-3 px-4 font-medium">Admin-Only Execution</td>
              <td className="py-3 px-4 text-muted-foreground">Certain agents (like AI News) restricted to verified admin accounts only.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </td>
              <td className="py-3 px-4 font-medium">Execution Limits</td>
              <td className="py-3 px-4 text-muted-foreground">Maximum turns per run (15-20) prevents runaway processes and controls costs.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </td>
              <td className="py-3 px-4 font-medium">Cron Secret</td>
              <td className="py-3 px-4 text-muted-foreground">Scheduled jobs use separate secret tokens, never exposed to browsers.</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </td>
              <td className="py-3 px-4 font-medium">Credential Isolation</td>
              <td className="py-3 px-4 text-muted-foreground">API keys stored server-side only. Never exposed to client code.</td>
            </tr>
            <tr>
              <td className="py-3 px-4">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </td>
              <td className="py-3 px-4 font-medium">Database RLS</td>
              <td className="py-3 px-4 text-muted-foreground">Row-Level Security policies restrict what data agents can access/modify.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="ai-news-agent" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        AI News Agent Security
      </h2>
      <p className="text-muted-foreground mb-4">
        The{" "}
        <Link href="/agents/ai-news" className="text-primary hover:underline">
          AI News Agent
        </Link>{" "}
        has additional security considerations because it fetches external content and posts to the feed.
      </p>

      <div className="space-y-4 mb-6">
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium">Prompt Injection Mitigation</h4>
            <p className="text-sm text-muted-foreground">
              External content is processed through summarization rather than passed directly, reducing
              the risk of malicious instructions in web content affecting agent behavior.
            </p>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium">Multi-Agent Architecture</h4>
            <p className="text-sm text-muted-foreground">
              Researchers, curators, and writers are separate subagents. This separation of concerns
              means no single agent has end-to-end control over the pipeline.
            </p>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl border border-border">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium">Turn Limits</h4>
            <p className="text-sm text-muted-foreground">
              Maximum 15 turns per execution. If the agent doesn&apos;t complete within this limit, it
              terminates gracefully rather than running indefinitely.
            </p>
          </div>
        </div>
      </div>

      <h2 id="authentication-flow" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Authentication Flow
      </h2>
      <p className="text-muted-foreground mb-4">
        Here&apos;s how authentication works when triggering an agent:
      </p>

      <pre className="p-4 rounded-xl bg-accent/30 border border-border overflow-x-auto text-sm mb-6">
{`┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User clicks   │     │   API receives  │     │   Agent runs    │
│  "Run Agent"    │────▶│   request with  │────▶│   with verified │
│   in browser    │     │   session token │     │   credentials   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Clerk session │
                        │  verifies caller│
                        │  + checks admin │
                        └─────────────────┘`}
      </pre>

      <p className="text-muted-foreground mb-4">
        For scheduled (cron) jobs, a separate flow is used:
      </p>

      <pre className="p-4 rounded-xl bg-accent/30 border border-border overflow-x-auto text-sm mb-6">
{`┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Vercel Cron    │     │   API receives  │     │   Agent runs    │
│  triggers at    │────▶│   request with  │────▶│   with service  │
│  scheduled time │     │   CRON_SECRET   │     │   credentials   │
└─────────────────┘     └─────────────────┘     └─────────────────┘`}
      </pre>

      <h2 id="threat-model" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Threat Model
      </h2>
      <p className="text-muted-foreground mb-4">
        We protect against the following threats:
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium">Threat</th>
              <th className="text-left py-3 px-4 font-medium">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 px-4 font-medium">Unauthorized execution</td>
              <td className="py-3 px-4 text-muted-foreground">Session-based auth + admin email verification</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 font-medium">API abuse / cost attacks</td>
              <td className="py-3 px-4 text-muted-foreground">Turn limits, admin-only access, rate limiting</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 font-medium">Prompt injection</td>
              <td className="py-3 px-4 text-muted-foreground">Content summarization, output validation (planned)</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 font-medium">Credential exposure</td>
              <td className="py-3 px-4 text-muted-foreground">Server-side only, never in browser code</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-3 px-4 font-medium">Data exfiltration</td>
              <td className="py-3 px-4 text-muted-foreground">Limited tool access, database RLS policies</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium">Runaway processes</td>
              <td className="py-3 px-4 text-muted-foreground">Max turns, execution timeouts</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 id="security-badge" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Security Badge
      </h2>
      <p className="text-muted-foreground mb-4">
        Each agent page displays a security badge that users can click to view the security measures in place:
      </p>

      <div className="p-6 rounded-xl border border-border bg-accent/20 mb-6">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-sm font-medium">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secured
          </button>
          <span className="text-sm text-muted-foreground">← Click to view security details on any agent page</span>
        </div>
      </div>

      <h2 id="best-practices" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Best Practices for Users
      </h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>
          <strong className="text-foreground">Keep your session secure</strong> — Log out when using shared devices
        </li>
        <li>
          <strong className="text-foreground">Review agent output</strong> — Verify AI-generated content before sharing
        </li>
        <li>
          <strong className="text-foreground">Report issues</strong> — If you notice unexpected agent behavior, contact us
        </li>
      </ul>

      <h2 id="further-reading" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Further Reading
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href="https://docs.anthropic.com/en/docs/build-with-claude/agent-sdk/securely-deploying-agents"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group"
        >
          <h4 className="font-medium group-hover:text-primary transition-colors flex items-center gap-1">
            Anthropic Security Guide
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </h4>
          <p className="text-sm text-muted-foreground mt-1">Official guide to securely deploying AI agents</p>
        </a>
        <a
          href="https://owasp.org/www-project-top-10-for-large-language-model-applications/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/30 transition-colors group"
        >
          <h4 className="font-medium group-hover:text-primary transition-colors flex items-center gap-1">
            OWASP LLM Top 10
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </h4>
          <p className="text-sm text-muted-foreground mt-1">Security risks for LLM applications</p>
        </a>
      </div>
    </DocsPageWrapper>
  );
}
