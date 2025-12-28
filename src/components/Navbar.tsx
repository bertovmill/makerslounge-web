"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import AuthButton from "./AuthButton";
import Logo from "./Logo";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsAdmin(user?.email === "bertmill19@gmail.com");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAdmin(session?.user?.email === "bertmill19@gmail.com");
    });

    return () => subscription.unsubscribe();
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={cn(
          "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
          "hover:bg-accent/50 hover:text-foreground",
          isActive
            ? "bg-accent text-foreground"
            : "text-muted-foreground"
        )}
        onClick={closeMenu}
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 border-r border-border bg-background/80 backdrop-blur-md flex-col z-50">
        <div className="p-6">
          <Link href="/" className="hover:opacity-90 transition-opacity inline-block">
            <Logo size="sm" />
          </Link>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          <NavLink href="/people">People</NavLink>
          <NavLink href="/events">Events</NavLink>
          <NavLink href="/workshops">Workshops</NavLink>
          <NavLink href="/about">About</NavLink>

          {user && (
            <>
              <div className="my-2 border-t border-border"></div>
              <NavLink href="/profile">Profile</NavLink>
              <NavLink href="/matcher">Matcher</NavLink>
            </>
          )}

          {isAdmin && (
            <>
              <div className="my-2 border-t border-border"></div>
              <NavLink href="/admin">Admin</NavLink>
              <NavLink href="/feedback">Feedback</NavLink>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <AuthButton />
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <nav className="flex items-center justify-between px-4 py-4">
          <Link href="/" className="hover:opacity-90 transition-opacity">
            <Logo size="sm" />
          </Link>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-border bg-background/95 backdrop-blur-md">
            <div className="flex flex-col gap-1 px-4 py-4">
              <NavLink href="/people">People</NavLink>
              <NavLink href="/events">Events</NavLink>
              <NavLink href="/workshops">Workshops</NavLink>
              <NavLink href="/about">About</NavLink>

              {user && (
                <>
                  <div className="my-2 border-t border-border"></div>
                  <NavLink href="/profile">Profile</NavLink>
                  <NavLink href="/matcher">Matcher</NavLink>
                </>
              )}

              {isAdmin && (
                <>
                  <div className="my-2 border-t border-border"></div>
                  <NavLink href="/admin">Admin</NavLink>
                  <NavLink href="/feedback">Feedback</NavLink>
                </>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
