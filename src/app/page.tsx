"use client";

import { useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ArrowRight } from "lucide-react";

export default function Home() {
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.onboarding_completed) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/people";
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-svh flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">MakersLounge</span>
        <div className="flex items-center gap-3">
          <Link
            href="/auth"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/auth?mode=signup"
            className="text-sm font-medium px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            Find the right people
            <br />
            for what you&apos;re building
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto">
            MakersLounge connects builders with complementary skills, ideas, and goals. Tell us what you need — AI finds your match.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth?mode=signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/people"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-border text-sm font-medium hover:bg-secondary transition-colors"
            >
              Browse makers
            </Link>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section className="border-t border-border px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-sm font-medium text-muted-foreground mb-10 uppercase tracking-wider">How it works</h2>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create your profile",
                description: "Share your skills, what you're building, and what kind of collaborators you're looking for.",
              },
              {
                step: "02",
                title: "Get matched",
                description: "AI analyzes your profile and finds people with complementary skills and aligned goals.",
              },
              {
                step: "03",
                title: "Connect and build",
                description: "Meet your matches at events or online. Start collaborating on what matters.",
              },
            ].map((item) => (
              <div key={item.step}>
                <span className="text-sm font-mono text-muted-foreground">{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social links */}
      <section className="border-t border-border px-6 py-16">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Join the community</h2>
            <p className="text-sm text-muted-foreground">Follow us for events, updates, and maker stories.</p>
          </div>
          <div className="flex items-center gap-4">
            {[
              { href: "https://www.linkedin.com/company/makerslounge", label: "LinkedIn" },
              { href: "https://www.instagram.com/makersloungeto/", label: "Instagram" },
              { href: "https://x.com/makersloungeto", label: "X" },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} MakersLounge
          </span>
          <span className="text-xs text-muted-foreground">Toronto, Canada</span>
        </div>
      </footer>
    </div>
  );
}
