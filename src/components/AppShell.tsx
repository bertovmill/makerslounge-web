"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  // Scroll to top on page navigation (iOS-like behavior)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const isFullPage =
    pathname === "/" ||
    pathname === "/auth" ||
    pathname.startsWith("/onboarding") ||
    pathname === "/hackathon" ||
    pathname.startsWith("/hackathons") ||
    pathname.startsWith("/podcasts");

  if (isFullPage || !user) {
    return <main>{children}</main>;
  }

  return (
    <main className={`app-main ${collapsed ? "md:ml-16" : "md:ml-60"} transition-[margin] duration-200 ease-in-out`}>
      {children}
    </main>
  );
}
