"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, onboardingCompleted } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed } = useSidebar();

  // Scroll to top on page navigation (iOS-like behavior)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Enforce onboarding: redirect authenticated users who haven't completed it
  useEffect(() => {
    const isAuthPage = pathname === "/" || pathname === "/auth" || pathname.startsWith("/onboarding");
    if (user && onboardingCompleted === false && !isAuthPage) {
      router.replace("/onboarding");
    }
  }, [user, onboardingCompleted, pathname, router]);

  const isFullPage = pathname === "/" || pathname === "/auth" || pathname.startsWith("/onboarding");

  if (isFullPage || !user) {
    return <main>{children}</main>;
  }

  return (
    <>
      {/* Desktop sidebar offset */}
      <main className={`hidden lg:block ${collapsed ? "lg:ml-16" : "lg:ml-60"} transition-[margin] duration-200 ease-in-out`}>
        {children}
      </main>
      {/* Mobile/Tablet: no sidebar offset, bottom padding for tab bar */}
      <main className="lg:hidden pb-[calc(50px+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
    </>
  );
}
