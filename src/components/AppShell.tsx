"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  // Scroll to top on page navigation (iOS-like behavior), unless the URL
  // names a section to land on, like `/#logo-downloads`.
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo(0, 0);
  }, [pathname]);

  const isFullPage =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/hackathons") ||
    pathname.startsWith("/podcasts") ||
    // The Eve workshop ships its own sidebar and chrome.
    pathname.startsWith("/eve-workshop");

  if (isFullPage || !user) {
    return <main>{children}</main>;
  }

  // Shopify-admin frame: on desktop the page sits on a raised panel inset
  // from the sidebar's frame colour, rounded where it meets it.
  return (
    <div className="min-h-svh md:bg-[var(--frame)] md:pt-2 md:pr-2">
      <main
        className={`app-main ${collapsed ? "md:ml-16" : "md:ml-60"} md:min-h-[calc(100svh-0.5rem)] md:rounded-t-xl md:overflow-clip md:border md:border-b-0 md:border-[var(--frame-edge)] md:bg-background md:shadow-[var(--frame-panel-shadow)] transition-[margin] duration-200 ease-in-out`}
      >
        {children}
      </main>
    </div>
  );
}
