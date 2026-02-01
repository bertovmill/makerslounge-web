"use client";

import DocsPageWrapper from "@/components/docs/DocsPageWrapper";

export default function InstallationPage() {
  return (
    <DocsPageWrapper
      breadcrumbs={[
        { label: "Docs", href: "/docs" },
        { label: "Installation" },
      ]}
      title="Installation"
      description="MakersLounge is a web app — no installation required!"
      prevPage={{ title: "Quick Start", href: "/docs/quick-start" }}
      nextPage={{ title: "People Directory", href: "/docs/features/people" }}
    >
      <h2 id="web-app" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Web Application
      </h2>
      <p className="text-muted-foreground mb-4">
        MakersLounge is a web application that runs in your browser. There&apos;s nothing to install —
        just visit the website and start using it.
      </p>

      <h2 id="requirements" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Browser Requirements
      </h2>
      <p className="text-muted-foreground mb-4">
        MakersLounge works best in modern browsers:
      </p>
      <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
        <li>Chrome (recommended)</li>
        <li>Firefox</li>
        <li>Safari</li>
        <li>Edge</li>
      </ul>
      <p className="text-muted-foreground mb-4">
        Make sure your browser is updated to the latest version for the best experience.
      </p>

      <h2 id="mobile" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Mobile Access
      </h2>
      <p className="text-muted-foreground mb-4">
        MakersLounge is fully responsive and works on mobile devices. Simply visit the website
        in your mobile browser.
      </p>

      <h2 id="pwa" className="text-2xl font-semibold mt-8 mb-4 scroll-mt-20">
        Add to Home Screen
      </h2>
      <p className="text-muted-foreground mb-4">
        For a more app-like experience, you can add MakersLounge to your home screen:
      </p>
      <h3 className="text-lg font-medium mt-4 mb-2">On iOS (Safari):</h3>
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
        <li>Open MakersLounge in Safari</li>
        <li>Tap the Share button</li>
        <li>Select &quot;Add to Home Screen&quot;</li>
      </ol>
      <h3 className="text-lg font-medium mt-4 mb-2">On Android (Chrome):</h3>
      <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
        <li>Open MakersLounge in Chrome</li>
        <li>Tap the menu (three dots)</li>
        <li>Select &quot;Add to Home Screen&quot;</li>
      </ol>
    </DocsPageWrapper>
  );
}
