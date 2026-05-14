"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import NewsletterPopup, { OPEN_NEWSLETTER_EVENT } from "./NewsletterPopup";

const openNewsletterPopup = () => {
  window.dispatchEvent(new CustomEvent(OPEN_NEWSLETTER_EVENT));
};

export default function MarketingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolved, setTheme } = useTheme();
  const toggleTheme = () =>
    setTheme(resolved === "dark" ? "light" : "dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-svh flex flex-col relative overflow-hidden">
      {/* Background layers — match landing page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a2a4a]/30 via-transparent to-[#1a1a2e]/20 dark:from-[#1a2a4a]/60 dark:via-transparent dark:to-[#1a1a2e]/40" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-[#3A9FF3]/10 dark:bg-[#3A9FF3]/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#6AC4F7]/8 dark:bg-[#6AC4F7]/10 blur-[100px]" />
        <div className="absolute inset-0 grain-overlay h-full w-full" />
      </div>

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          href="/"
          className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
        >
          <Image
            src="/logos/logo.svg"
            alt="MakersLounge"
            width={18}
            height={19}
            className="dark:hidden"
          />
          <Image
            src="/logos/logo-light.svg"
            alt="MakersLounge"
            width={18}
            height={19}
            className="hidden dark:block"
          />
          <span className="text-base sm:text-xl font-sans font-normal tracking-normal">
            makerslounge
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
          <Link
            href="/about"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            About Us
          </Link>
          <Link
            href="/hackathons"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Hackathons
          </Link>
          <button
            onClick={openNewsletterPopup}
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Newsletter
          </button>
          <Link
            href="/auth"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm font-medium px-4 py-2 rounded-md bg-gradient-blue text-white hover:opacity-90 transition-opacity"
          >
            Join Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="sm:hidden p-2 text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link
              href="/"
              className="flex items-center gap-1.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/logos/logo.svg"
                alt="MakersLounge"
                width={18}
                height={19}
                className="dark:hidden"
              />
              <Image
                src="/logos/logo-light.svg"
                alt="MakersLounge"
                width={18}
                height={19}
                className="hidden dark:block"
              />
              <span className="text-base font-sans font-normal tracking-normal">
                makerslounge
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 text-foreground/70 hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 flex flex-col items-center justify-center gap-6">
            <Link
              href="/about"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="/hackathons"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Hackathons
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                openNewsletterPopup();
              }}
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
            >
              Newsletter
            </button>
            <Link
              href="/auth"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth?mode=signup"
              className="text-lg font-medium px-8 py-3 rounded-full bg-gradient-blue text-white hover:opacity-90 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Now
            </Link>
            <button
              onClick={() => {
                toggleTheme();
                setMobileMenuOpen(false);
              }}
              className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors flex items-center gap-2"
            >
              {resolved === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 flex-1">{children}</main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <Image
                  src="/logos/logo.svg"
                  alt="MakersLounge"
                  width={16}
                  height={17}
                  className="dark:hidden"
                />
                <Image
                  src="/logos/logo-light.svg"
                  alt="MakersLounge"
                  width={16}
                  height={17}
                  className="hidden dark:block"
                />
                <span className="text-sm font-sans font-normal">
                  makerslounge
                </span>
              </Link>
              <p className="text-xs text-muted-foreground/60">
                Build. Connect. Create.
              </p>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs text-muted-foreground/60">
              <Link
                href="/hackathons"
                className="hover:text-foreground transition-colors"
              >
                Hackathons
              </Link>
              <Link
                href="/blog"
                className="hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <a
                href="https://lu.ma/makerslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Luma
              </a>
              <a
                href="https://instagram.com/makersloungeto"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://linkedin.com/company/makerslounge"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                LinkedIn
              </a>
              <Link
                href="/about"
                className="hover:text-foreground transition-colors"
              >
                About
              </Link>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-border/50 text-center">
            <p className="text-[11px] text-muted-foreground/40">
              &copy; {new Date().getFullYear()} MakersLounge. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      <NewsletterPopup />
    </div>
  );
}
