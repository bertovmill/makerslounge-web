"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { Users, Sparkles, Calendar, User, Menu, X, Settings } from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/people", label: "People", icon: Users },
  { href: "/matcher", label: "Match", icon: Sparkles },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLandingOrAuth = pathname === "/" || pathname === "/auth";
  if (isLandingOrAuth && !user) return null;

  return (
    <>
      {/* Desktop: Top bar */}
      <header className="hidden md:flex items-center justify-between h-14 px-6 border-b border-border bg-background sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon, authRequired }) => (
              <Link
                key={href}
                href={authRequired && !user ? "/auth" : href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  pathname === href
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Link
              href="/settings"
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}
          {!user && (
            <Link
              href="/auth"
              className="text-sm font-medium px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Mobile: Top bar with logo + hamburger */}
      <header className="md:hidden flex items-center justify-between h-11 px-4 border-b border-border/50 bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <Logo />
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 text-muted-foreground hover:text-foreground"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile: Dropdown menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-11 z-40 bg-background">
          <nav className="flex flex-col px-4 pt-2 gap-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon, authRequired }) => (
              <Link
                key={href}
                href={authRequired && !user ? "/auth" : href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] active:bg-secondary transition-colors",
                  pathname === href
                    ? "text-primary font-medium"
                    : "text-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            {user && (
              <>
                <div className="my-1 mx-3 border-t border-border/50" />
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl text-[15px] text-foreground active:bg-secondary transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                </Link>
              </>
            )}
            {!user && (
              <>
                <div className="my-1 mx-3 border-t border-border/50" />
                <Link
                  href="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center px-3 py-3.5 rounded-xl text-[15px] font-medium bg-primary text-primary-foreground active:opacity-80"
                >
                  Sign in
                </Link>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Mobile: Bottom tab bar (iOS style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 safe-area-bottom">
        <div className="flex items-center justify-around h-[50px]">
          {NAV_ITEMS.map(({ href, label, icon: Icon, authRequired }) => (
            <Link
              key={href}
              href={authRequired && !user ? "/auth" : href}
              className={cn(
                "flex flex-col items-center justify-center gap-[2px] w-full h-full active:opacity-60 transition-opacity",
                pathname === href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={pathname === href ? 2.2 : 1.8} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
