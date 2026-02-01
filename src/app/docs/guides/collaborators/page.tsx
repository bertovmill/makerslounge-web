"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function CollaboratorsGuidePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Guides", href: "/docs/guides/profile-setup" },
        { label: "Finding Collaborators" },
      ]}
      title="Finding Collaborators"
      description="Strategies for finding and connecting with the right collaborators."
      prevPage={{ title: "Using the Matcher", href: "/docs/guides/matcher" }}
      nextPage={{ title: "FAQ", href: "/docs/faq" }}
    >
      <h2 id="define-needs" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Define What You Need
      </h2>
      <p className="text-muted-foreground mb-4">
        Before searching for collaborators, clarify what you&apos;re looking for:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>What skills are you missing?</li>
        <li>What kind of commitment level do you need?</li>
        <li>Is this a one-time project or ongoing collaboration?</li>
        <li>What&apos;s your timeline?</li>
      </ul>

      <h2 id="browse-directory" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Browse the People Directory
      </h2>
      <p className="text-muted-foreground mb-4">
        The People directory is a great place to discover potential collaborators:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Search by skills you need</li>
        <li>Look at makers&apos; projects for evidence of their work</li>
        <li>Read bios to understand their interests and availability</li>
        <li>Check their social links to learn more about them</li>
      </ul>

      <h2 id="use-matcher" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Use the Matcher for Your Network
      </h2>
      <p className="text-muted-foreground mb-4">
        Don&apos;t overlook people you already know:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Upload your LinkedIn connections</li>
        <li>Import contacts from events you&apos;ve attended</li>
        <li>Add people you&apos;ve met at meetups or conferences</li>
        <li>Let the AI help you rediscover valuable connections</li>
      </ul>

      <h2 id="reach-out" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Reaching Out Effectively
      </h2>
      <p className="text-muted-foreground mb-4">
        When you find someone interesting, make a good first impression:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><span className="text-foreground">Be specific</span> — Mention what caught your attention</li>
        <li><span className="text-foreground">Be concise</span> — Respect their time</li>
        <li><span className="text-foreground">Offer value</span> — Explain what you bring to the table</li>
        <li><span className="text-foreground">Have a clear ask</span> — What do you want from them?</li>
      </ul>

      <div className="p-4 rounded-xl border border-border bg-accent/20 mb-6">
        <p className="text-sm font-medium mb-2">Example Outreach:</p>
        <p className="text-sm text-muted-foreground italic">
          &quot;Hi Sarah, I saw your profile on MakersLounge and loved your design work on the
          productivity app. I&apos;m building a developer tool and could really use design help.
          Would you be open to a 15-min chat this week to see if there&apos;s a fit?&quot;
        </p>
      </div>

      <h2 id="build-relationship" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Building the Relationship
      </h2>
      <p className="text-muted-foreground mb-4">
        After the initial connection:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Start with a small project to test the fit</li>
        <li>Communicate expectations clearly upfront</li>
        <li>Give feedback early and often</li>
        <li>Celebrate wins together</li>
        <li>Stay in touch even after projects end</li>
      </ul>
    </DocsPageWrapper>
  );
}
