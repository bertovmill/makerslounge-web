"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function MatcherGuidePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Guides", href: "/docs/guides/profile-setup" },
        { label: "Using the Matcher" },
      ]}
      title="Using the Matcher"
      description="A step-by-step guide to finding collaborators with the Matcher."
      prevPage={{ title: "Profile Setup", href: "/docs/guides/profile-setup" }}
      nextPage={{ title: "Finding Collaborators", href: "/docs/guides/collaborators" }}
    >
      <h2 id="prepare-contacts" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 1: Prepare Your Contacts
      </h2>
      <p className="text-muted-foreground mb-4">
        Before using the Matcher, gather your contact list. The more information you provide,
        the better the matching will be.
      </p>
      <p className="text-muted-foreground mb-4">
        Ideal contact information includes:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Full name</li>
        <li>Job title or role</li>
        <li>Company or organization</li>
        <li>Any notes about the person</li>
      </ul>

      <h2 id="upload-contacts" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 2: Upload Your Contacts
      </h2>
      <p className="text-muted-foreground mb-4">
        Navigate to the Matcher page and upload your contacts. You can:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Paste data directly from a spreadsheet</li>
        <li>Upload a CSV file</li>
        <li>Type or paste plain text</li>
      </ul>
      <div className="p-4 rounded-xl border border-border bg-accent/20 mb-6">
        <p className="text-sm font-medium mb-2">CSV Format Example:</p>
        <code className="text-sm text-muted-foreground block">
          Name,Title,Company<br />
          Jane Doe,Product Designer,Acme Inc<br />
          John Smith,Software Engineer,TechCorp
        </code>
      </div>

      <h2 id="run-matching" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 3: Run the Matching
      </h2>
      <p className="text-muted-foreground mb-4">
        Once your contacts are uploaded, click the button to start matching.
        The AI agent will analyze each contact and determine their relevance.
      </p>
      <p className="text-muted-foreground mb-4">
        You&apos;ll see a real-time workflow showing:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Current processing step</li>
        <li>Progress through your contacts</li>
        <li>Preliminary results as they come in</li>
      </ul>

      <h2 id="review-results" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 4: Review Results
      </h2>
      <p className="text-muted-foreground mb-4">
        When matching is complete, you&apos;ll see your contacts ranked by match quality.
        For each contact, you&apos;ll see:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Match score</li>
        <li>Reason for the ranking</li>
        <li>Suggested next steps</li>
      </ul>

      <h2 id="take-action" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Step 5: Take Action
      </h2>
      <p className="text-muted-foreground mb-4">
        Use your results to prioritize outreach:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Start with your highest-ranked matches</li>
        <li>Use the reasoning to personalize your outreach</li>
        <li>Keep notes on conversations for future reference</li>
      </ul>

      <h2 id="tips" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Tips for Better Results
      </h2>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Include as much context about each contact as possible</li>
        <li>Add notes about how you know each person</li>
        <li>Run the Matcher periodically as your network grows</li>
        <li>Use results to inform, not dictate, your outreach strategy</li>
      </ul>
    </DocsPageWrapper>
  );
}
