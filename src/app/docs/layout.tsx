"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Navigation structure for the docs sidebar
const docsNavigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "Installation", href: "/docs/installation" },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "People Directory", href: "/docs/features/people" },
      { title: "Matcher", href: "/docs/features/matcher" },
      { title: "↳ Agent Architecture", href: "/docs/features/matcher/agent" },
      { title: "Profile", href: "/docs/features/profile" },
      { title: "Agents", href: "/docs/features/agents" },
      { title: "Connections", href: "/docs/features/connections" },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "Setting Up Your Profile", href: "/docs/guides/profile-setup" },
      { title: "Using the Matcher", href: "/docs/guides/matcher" },
      { title: "Finding Collaborators", href: "/docs/guides/collaborators" },
      { title: "Agent Security", href: "/docs/guides/agent-security" },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "FAQ", href: "/docs/faq" },
      { title: "Troubleshooting", href: "/docs/troubleshooting" },
      { title: "Contact Support", href: "/docs/support" },
    ],
  },
];

// Top tabs
const docsTabs = [
  { title: "Overview", href: "/docs" },
  { title: "Guides", href: "/docs/guides/profile-setup" },
  { title: "Features", href: "/docs/features/people" },
  { title: "FAQ", href: "/docs/faq" },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("w-4 h-4 transition-transform", open && "rotate-90")}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SidebarSection({ section, pathname }: { section: typeof docsNavigation[0]; pathname: string }) {
  const isActive = section.items.some(item => pathname === item.href);
  const [open, setOpen] = useState(isActive || section.title === "Getting Started");

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 rounded-lg transition-colors"
      >
        {section.title}
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "block px-3 py-1.5 text-sm rounded-lg transition-colors",
                pathname === item.href
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
              )}
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Determine active tab
  const activeTab = docsTabs.find(tab => {
    if (tab.href === "/docs") return pathname === "/docs";
    return pathname.startsWith(tab.href.replace(/\/[^/]+$/, ""));
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Top Tabs */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {docsTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors",
                  (activeTab?.href === tab.href || (tab.href === "/docs" && pathname === "/docs"))
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                )}
              >
                {tab.title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden fixed bottom-4 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Left Sidebar */}
          <aside
            className={cn(
              "fixed lg:sticky top-[57px] left-0 h-[calc(100vh-57px)] w-64 bg-background border-r border-border overflow-y-auto z-40 transition-transform lg:translate-x-0",
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <nav className="p-4">
              <div className="mb-6">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search docs..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-accent/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
              {docsNavigation.map((section) => (
                <SidebarSection key={section.title} section={section} pathname={pathname} />
              ))}
            </nav>
          </aside>

          {/* Overlay for mobile */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0 lg:pl-8 py-8">
            {children}
          </main>

          {/* Right Sidebar - On This Page */}
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-[73px] py-8 pl-8">
              <div id="on-this-page-container" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
