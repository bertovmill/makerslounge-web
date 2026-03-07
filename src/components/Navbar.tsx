"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";
import { cn } from "@/lib/utils";
import { Users, Sparkles, Calendar, User, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/people", label: "People", icon: Users },
  { href: "/matcher", label: "Match", icon: Sparkles },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/profile", label: "Profile", icon: User, authRequired: true },
];

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isLanding = pathname === "/";
  if (isLanding && !user) return null;
  if (pathname === "/auth") return null;

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

      {/* Mobile: Fixed top bar with logo */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-[calc(2.75rem+env(safe-area-inset-top))] px-4 pt-[env(safe-area-inset-top)] border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <Logo />
        {user ? (
          <Link
            href="/settings"
            className="p-2 text-muted-foreground active:opacity-60"
          >
            <Settings className="w-5 h-5" />
          </Link>
        ) : (
          <Link
            href="/auth"
            className="text-sm font-medium px-3 py-1 rounded-full bg-primary text-primary-foreground active:opacity-80"
          >
            Sign in
          </Link>
        )}
      </header>
      {/* Spacer for fixed header */}
      <div className="md:hidden h-[calc(2.75rem+env(safe-area-inset-top))]" />

      {/* Mobile: Bottom tab bar (iOS style) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom,0px)]">
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
