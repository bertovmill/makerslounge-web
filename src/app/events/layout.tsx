"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

/**
 * Events pages are where people land from a shared RSVP link, often signed
 * out. Signed-out visitors get no sidebar (see `AppShell`), so without this
 * bar an event page had no way back to the rest of the site. Members already
 * have the sidebar, so they don't get a second nav.
 */

const LINKS = [
  { href: "/events", label: "Events" },
  { href: "/about", label: "About" },
  { href: "/hackathons", label: "Hackathons" },
];

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  return (
    <>
      {!loading && !user && (
        <header
          id="site-nav"
          className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2"
        >
          <Logo />
          <nav className="flex items-center gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hidden rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/auth"
              className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Join
            </Link>
          </nav>
        </header>
      )}
      {children}
    </>
  );
}
