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

  const isFullPage = pathname === "/" || pathname === "/auth" || pathname === "/onboarding";

  if (isFullPage || !user) {
    return <main className="flex-1 overflow-x-hidden">{children}</main>;
  }

  return (
    <main
      className="flex-1 overflow-x-hidden transition-[margin] duration-200 ease-in-out"
      style={{ marginLeft: undefined }}
    >
      {/* Desktop sidebar offset */}
      <div className={`hidden lg:block ${collapsed ? "ml-16" : "ml-60"} transition-[margin] duration-200 ease-in-out`}>
        {children}
      </div>
      {/* Mobile/Tablet: no sidebar offset, bottom padding for tab bar */}
      <div className="lg:hidden overflow-x-hidden pb-[calc(50px+env(safe-area-inset-bottom,0px))]">
        {children}
      </div>
    </main>
  );
}
