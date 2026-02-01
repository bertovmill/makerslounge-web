"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function ProfileSetupGuidePage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Guides", href: "/docs/guides/profile-setup" },
        { label: "Profile Setup" },
      ]}
      title="Setting Up Your Profile"
      description="A complete guide to creating an effective maker profile."
      prevPage={{ title: "Connections", href: "/docs/features/connections" }}
      nextPage={{ title: "Using the Matcher", href: "/docs/guides/matcher" }}
    >
      <h2 id="choose-username" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Choose a Good Username
      </h2>
      <p className="text-muted-foreground mb-4">
        Your username becomes part of your public URL, so choose wisely:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Keep it short and memorable</li>
        <li>Use your real name or a consistent handle you use elsewhere</li>
        <li>Avoid numbers and special characters if possible</li>
        <li>Make it professional</li>
      </ul>

      <h2 id="write-bio" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Write a Compelling Bio
      </h2>
      <p className="text-muted-foreground mb-4">
        Your bio is often the first thing people read. Make it count:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Start with what you do and what you&apos;re passionate about</li>
        <li>Mention your current focus or project</li>
        <li>Include what you&apos;re looking for (collaborators, feedback, etc.)</li>
        <li>Keep it concise but informative</li>
      </ul>
      <div className="p-4 rounded-xl border border-border bg-accent/20 mb-6">
        <p className="text-sm font-medium mb-2">Example Bio:</p>
        <p className="text-sm text-muted-foreground italic">
          &quot;Full-stack developer passionate about developer tools and open source. Currently building a
          CLI for rapid prototyping. Looking to connect with designers and fellow tool builders.&quot;
        </p>
      </div>

      <h2 id="add-skills" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Add Relevant Skills
      </h2>
      <p className="text-muted-foreground mb-4">
        Skills help others find you. Be specific and honest:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Add your primary technical skills</li>
        <li>Include soft skills if relevant</li>
        <li>Don&apos;t overload — focus on your strongest 5-10 skills</li>
        <li>Update as you learn new things</li>
      </ul>

      <h2 id="upload-photo" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Upload a Profile Photo
      </h2>
      <p className="text-muted-foreground mb-4">
        A profile photo makes you more approachable:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Use a clear, well-lit photo</li>
        <li>Show your face (not a logo or avatar)</li>
        <li>Keep it professional but friendly</li>
        <li>Square images work best</li>
      </ul>

      <h2 id="add-projects" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Showcase Your Projects
      </h2>
      <p className="text-muted-foreground mb-4">
        Projects are proof of what you can do:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Add 2-5 of your best projects</li>
        <li>Include high-quality images or screenshots</li>
        <li>Write clear descriptions of what you built and why</li>
        <li>Link to live demos or repositories when possible</li>
      </ul>

      <h2 id="connect-socials" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Connect Social Profiles
      </h2>
      <p className="text-muted-foreground mb-4">
        Help people reach you by adding your social links:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li><span className="text-foreground">Twitter/X</span> — Great for quick interactions</li>
        <li><span className="text-foreground">LinkedIn</span> — Professional networking</li>
        <li><span className="text-foreground">GitHub</span> — Show your code</li>
        <li><span className="text-foreground">Website</span> — Your personal brand home</li>
      </ul>
    </DocsPageWrapper>
  );
}
