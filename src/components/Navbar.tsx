"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import AuthButton from "./AuthButton";
import Logo from "./Logo";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const navLinks = (
    <>
      <Link
        href="/people"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        People
      </Link>
      <Link
        href="/events"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        Events
      </Link>
      <Link
        href="/workshops"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        Workshops
      </Link>
      <Link
        href="/about"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        onClick={closeMenu}
      >
        About
      </Link>
      {user && (
        <>
          <Link
            href="/profile"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeMenu}
          >
            Profile
          </Link>
          <Link
            href="/matcher"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeMenu}
          >
            Matcher
          </Link>
        </>
      )}
      {isAdmin && (
        <>
          <Link
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeMenu}
          >
            Admin
          </Link>
          <Link
            href="/feedback"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={closeMenu}
          >
            Feedback
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="flex items-center justify-between px-4 md:px-8 py-4">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks}
          <AuthButton />
        </div>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-muted-foreground hover:text-foreground"
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
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="flex flex-col gap-4 px-4 py-4">
            {navLinks}
            <div className="pt-2 border-t border-border">
              <AuthButton />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
