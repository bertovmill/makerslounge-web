"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function ConnectionsFeaturePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Features", href: "/docs/features/people" },
        { label: "Connections" },
      ]}
      title="Connections"
      description="Build and manage your network of fellow makers."
      prevPage={{ title: "Agents", href: "/docs/features/agents" }}
      nextPage={{ title: "Profile Setup Guide", href: "/docs/guides/profile-setup" }}
    >
      <h2 id="overview" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Overview
      </h2>
      <p className="text-muted-foreground mb-4">
        The Connections feature helps you keep track of makers you&apos;ve connected with on MakersLounge.
        Build your network and stay in touch with collaborators.
      </p>

      <h2 id="adding-connections" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Adding Connections
      </h2>
      <p className="text-muted-foreground mb-4">
        You can add connections by:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Visiting a maker&apos;s profile and clicking Connect</li>
        <li>Accepting connection requests from other makers</li>
        <li>Importing connections from the Matcher results</li>
      </ul>

      <h2 id="managing-connections" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Managing Connections
      </h2>
      <p className="text-muted-foreground mb-4">
        From the Connections page, you can:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>View all your connections</li>
        <li>Search through your network</li>
        <li>Remove connections</li>
        <li>See connection activity</li>
      </ul>

      <h2 id="best-practices" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Best Practices
      </h2>
      <p className="text-muted-foreground mb-4">
        Tips for building a valuable network:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Connect with makers whose work interests you</li>
        <li>Personalize your connection requests when possible</li>
        <li>Engage with your connections&apos; projects</li>
        <li>Keep your own profile updated to attract connections</li>
      </ul>
    </DocsPageWrapper>
  );
}
