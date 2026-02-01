"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function ProfileFeaturePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Features", href: "/docs/features/people" },
        { label: "Profile" },
      ]}
      title="Maker Profile"
      description="Your personal page to showcase your work and connect with others."
      prevPage={{ title: "Matcher", href: "/docs/features/matcher" }}
      nextPage={{ title: "Agents", href: "/docs/features/agents" }}
    >
      <h2 id="profile-sections" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Profile Sections
      </h2>
      <p className="text-muted-foreground mb-4">
        Your profile consists of several sections that help other makers learn about you:
      </p>

      <h3 id="basic-info" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Basic Information
      </h3>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><span className="text-foreground">Display Name</span> — Your name as shown to others</li>
        <li><span className="text-foreground">Username</span> — Your unique handle for your public URL</li>
        <li><span className="text-foreground">Profile Photo</span> — A picture that represents you</li>
        <li><span className="text-foreground">Bio</span> — A description of who you are and what you do</li>
      </ul>

      <h3 id="skills" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Skills
      </h3>
      <p className="text-muted-foreground mb-4">
        Add skills to help others find you. Skills can be anything from programming languages
        to design tools to creative disciplines.
      </p>

      <h3 id="projects" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Projects
      </h3>
      <p className="text-muted-foreground mb-4">
        Showcase your work by adding projects with images and descriptions. This is your portfolio
        to demonstrate what you&apos;ve built.
      </p>

      <h3 id="social-links" className="text-xl font-medium mt-6 mb-3 scroll-mt-20">
        Social Links
      </h3>
      <p className="text-muted-foreground mb-4">
        Connect your social profiles so others can reach out to you:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Twitter/X</li>
        <li>LinkedIn</li>
        <li>GitHub</li>
        <li>Personal Website</li>
      </ul>

      <h2 id="public-profile" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Public Profile URL
      </h2>
      <p className="text-muted-foreground mb-4">
        Once you set a username, your profile becomes accessible at:
      </p>
      <code className="block px-4 py-3 bg-accent rounded-lg text-sm mb-4">
        makerslounge.com/p/your-username
      </code>
      <p className="text-muted-foreground">
        Share this URL anywhere to let people discover your maker profile.
      </p>
    </DocsPageWrapper>
  );
}
