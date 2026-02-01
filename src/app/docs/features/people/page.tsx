"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function PeopleFeaturePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Features", href: "/docs/features/people" },
        { label: "People Directory" },
      ]}
      title="People Directory"
      description="Discover and connect with makers in the community."
      prevPage={{ title: "Quick Start", href: "/docs/quick-start" }}
      nextPage={{ title: "Matcher", href: "/docs/features/matcher" }}
    >
      <h2 id="overview" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Overview
      </h2>
      <p className="text-muted-foreground mb-4">
        The People Directory is the heart of MakersLounge. It&apos;s where you can browse profiles of
        makers from various backgrounds and disciplines.
      </p>

      <h2 id="browsing-profiles" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Browsing Profiles
      </h2>
      <p className="text-muted-foreground mb-4">
        Navigate to the People page from the sidebar to see all makers. Each profile card shows:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Profile photo and display name</li>
        <li>Bio excerpt</li>
        <li>Skills and interests</li>
        <li>Social links</li>
      </ul>

      <h2 id="filtering" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Filtering & Search
      </h2>
      <p className="text-muted-foreground mb-4">
        Use the search bar to find makers by name, skill, or interest. You can filter results to
        find exactly the type of collaborator you&apos;re looking for.
      </p>

      <h2 id="viewing-profiles" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Viewing Full Profiles
      </h2>
      <p className="text-muted-foreground mb-4">
        Click on any profile card to see the full profile, including:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Complete bio</li>
        <li>All skills</li>
        <li>Portfolio projects with images</li>
        <li>Contact information and social links</li>
      </ul>
    </DocsPageWrapper>
  );
}
