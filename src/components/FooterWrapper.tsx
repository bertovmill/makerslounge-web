"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Footer from "./Footer";

export default function FooterWrapper() {
  // AuthContext tracks the session, so the local mirror and auth listener are
  // no longer needed.
  const { user: authUser } = useAuth();
  const user = !!authUser;
  const pathname = usePathname();

  // Hide navbar on public pages when not logged in
  const isPublicPage = pathname === "/" || pathname === "/auth";
  const shouldHideNavbar = isPublicPage && !user;

  return (
    <div className={`transition-all duration-300 ${!shouldHideNavbar ? "sidebar-margin" : ""}`}>
      <Footer />
    </div>
  );
}
