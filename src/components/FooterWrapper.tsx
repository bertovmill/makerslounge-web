"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Footer from "./Footer";

export default function FooterWrapper() {
  const [user, setUser] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hide navbar on public pages when not logged in
  const isPublicPage = pathname === "/" || pathname === "/auth";
  const shouldHideNavbar = isPublicPage && !user;

  return (
    <div className={`transition-all duration-300 ${!shouldHideNavbar ? "sidebar-margin" : ""}`}>
      <Footer />
    </div>
  );
}
