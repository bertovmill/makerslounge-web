"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function SupportPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Contact Support" },
      ]}
      title="Contact Support"
      description="Get help from the MakersLounge team."
      prevPage={{ title: "Troubleshooting", href: "/docs/troubleshooting" }}
    >
      <h2 id="feedback-form" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Send Feedback
      </h2>
      <p className="text-muted-foreground mb-4">
        The quickest way to reach us is through our feedback form:
      </p>
      <a
        href="/feedback"
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mb-6"
      >
        Open Feedback Form
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>

      <h2 id="what-to-include" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        What to Include
      </h2>
      <p className="text-muted-foreground mb-4">
        To help us assist you faster, please include:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>A clear description of the issue</li>
        <li>Steps to reproduce the problem</li>
        <li>What you expected to happen</li>
        <li>What actually happened</li>
        <li>Screenshots if applicable</li>
        <li>Your browser and device information</li>
      </ul>

      <h2 id="response-time" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Response Time
      </h2>
      <p className="text-muted-foreground mb-4">
        We aim to respond to all support requests within 24-48 hours. For urgent issues,
        please note that in your message.
      </p>

      <h2 id="community" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Community
      </h2>
      <p className="text-muted-foreground mb-4">
        Connect with other makers and get help from the community:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Browse the People directory to find other users</li>
        <li>Check the FAQ for answers to common questions</li>
        <li>Read through the documentation guides</li>
      </ul>
    </DocsPageWrapper>
  );
}
