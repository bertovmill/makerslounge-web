"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/context/SidebarContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  const isFullPage = pathname === "/" || pathname === "/auth" || pathname === "/onboarding";

  if (isFullPage || !user) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <main
      className="flex-1 transition-[margin] duration-200 ease-in-out"
      style={{ marginLeft: undefined }}
    >
      {/* Desktop sidebar offset */}
      <div className={`hidden md:block ${collapsed ? "ml-16" : "ml-60"} transition-[margin] duration-200 ease-in-out`}>
        {children}
      </div>
      {/* Mobile: no sidebar offset */}
      <div className="md:hidden">
        {children}
      </div>
    </main>
  );
}
