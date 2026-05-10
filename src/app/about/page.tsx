"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon, Menu, X } from "lucide-react";

export default function AboutPage() {
  const { resolved, setTheme } = useTheme();
  const toggleTheme = () => setTheme(resolved === "dark" ? "light" : "dark");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle warm gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-primary/8 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-accent/10 via-transparent to-transparent" />
      </div>

      {/* Nav */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link href="/" className="flex items-center gap-1.5 hover:opacity-70 transition-opacity">
          <Image src="/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
          <Image src="/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
          <span className="text-base sm:text-xl font-sans font-normal tracking-normal">makerslounge</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
            aria-label="Toggle theme"
          >
            {resolved === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <Link
            href="/"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="/auth"
            className="text-sm font-medium px-4 py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth"
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
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <Link href="/" className="flex items-center gap-1.5" onClick={() => setMobileMenuOpen(false)}>
              <Image src="/logo.svg" alt="MakersLounge" width={18} height={19} className="dark:hidden" />
              <Image src="/logo-light.svg" alt="MakersLounge" width={18} height={19} className="hidden dark:block" />
              <span className="text-base font-sans font-normal tracking-normal">makerslounge</span>
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
              href="/"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/auth"
              className="text-lg font-medium text-foreground/80 hover:text-foreground transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/auth"
              className="text-lg font-medium px-8 py-3 rounded-full bg-gradient-blue text-white hover:opacity-90 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Now
            </Link>
            <button
              onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
              className="text-lg font-medium text-foreground/60 hover:text-foreground transition-colors flex items-center gap-2"
            >
              {resolved === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              {resolved === "dark" ? "Light mode" : "Dark mode"}
            </button>
          </nav>
        </div>
      )}

      {/* Hero / Mission Section */}
      <section className="relative">
        {/* Background Photos */}
        <div className="relative h-[500px] md:h-[600px] overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-3 gap-1">
            <img
              src="/makerslounge-photos/lounge-networking.jpeg"
              alt="Makers networking"
              className="w-full h-full object-cover"
            />
            <img
              src="/makerslounge-photos/hackathon-working.jpeg"
              alt="Makers collaborating"
              className="w-full h-full object-cover"
            />
            <img
              src="/makerslounge-photos/presentation-audience.jpeg"
              alt="Community event"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-3xl mx-auto text-center px-4">
              <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                Our Story
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
                <span className="text-gradient">Passionate people</span> can change the world
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                We&apos;re here to enable them through community. Whether you&apos;re a first-time creator
                or a seasoned builder, you&apos;re welcome here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community Photos */}
      <section className="relative py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: "/makerslounge-photos/presentation-audience.jpeg", alt: "MakersLounge presentation" },
              { src: "/makerslounge-photos/coworking-space.jpeg", alt: "Coworking at MakersLounge" },
              { src: "/makerslounge-photos/lounge-working.jpeg", alt: "Makers collaborating" },
              { src: "/makerslounge-photos/networking-crowd.jpeg", alt: "Networking event" },
            ].map((photo, i) => (
              <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                <img
                  src={photo.src}
                  alt={photo.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Exist */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Why MakersLounge exists
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I started MakersLounge because I know how hard it is to find the right people
                  to build with. You have an idea you&apos;re excited about, maybe even a prototype.
                  But finding a collaborator who complements your skills? That&apos;s the real challenge.
                </p>
                <p>
                  I&apos;ve been there, searching for a technical partner, a design collaborator,
                  or just someone who gets as excited about the same problems as I do.
                  It shouldn&apos;t be that hard.
                </p>
                <p>
                  So I built this place. No gatekeeping, no cliques. Just a welcoming space
                  where your half-baked ideas are celebrated and the right connections happen naturally.
                </p>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="/makerslounge-photos/hackathon-working.jpeg"
                alt="Makers working together at a hackathon"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-transparent via-accent/5 to-transparent">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What we do
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              More than just a platform—we bring makers together through multiple channels.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: "🎙️",
                title: "MakersLounge Podcast",
                description:
                  "Candid conversations with founders sharing their stories—the wins, the struggles, and everything in between.",
                gradient: "from-purple-100 to-violet-100",
                href: "/podcasts",
                linkText: "Listen now",
              },
              {
                icon: "🏟️",
                title: "Events at New Stadium",
                description:
                  "In-person gatherings where makers meet, share ideas, and forge real connections in Toronto.",
                gradient: "from-orange-100 to-amber-100",
                href: "/events",
                linkText: "See events",
              },
              {
                icon: "🤖",
                title: "AI Workshops",
                description:
                  "Hands-on sessions to help makers leverage AI tools and stay ahead of the curve.",
                gradient: "from-sky-100 to-cyan-100",
              },
              {
                icon: "💼",
                title: "AI Consulting",
                description:
                  "Strategic guidance for businesses looking to integrate AI into their products and workflows.",
                gradient: "from-emerald-100 to-green-100",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="glass-card p-6 group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${item.gradient} rounded-xl flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                    {item.href && (
                      <Link
                        href={item.href}
                        className="inline-block mt-3 text-sm font-medium text-primary hover:underline underline-offset-4"
                      >
                        {item.linkText} →
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How it works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              MakersLounge is designed to make connecting with other builders as natural as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🚀",
                title: "Share your projects",
                description:
                  "Create a profile and showcase what you're building. Add images, videos, and tell the story behind your work.",
                gradient: "from-rose-100 to-orange-100",
              },
              {
                step: "02",
                icon: "🔎",
                title: "Discover & connect",
                description:
                  "Browse makers by skills, interests, or projects. Find collaborators who bring the pieces you're missing.",
                gradient: "from-sky-100 to-blue-100",
              },
              {
                step: "03",
                icon: "🤝",
                title: "Collaborate & build",
                description:
                  "Start conversations, join projects, and build something meaningful together. The best partnerships start here.",
                gradient: "from-emerald-100 to-teal-100",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="glass-card p-8 text-center group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="text-xs font-mono text-primary/60 mb-4">
                  {item.step}
                </div>
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${item.gradient} rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300`}
                >
                  {item.icon}
                </div>
                <h3 className="font-semibold text-xl mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built by makers, for makers
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We&apos;re a small team passionate about helping creators find their people.
            </p>
          </div>

          {/* Founders Photo */}
          <div className="max-w-lg mx-auto mb-12">
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src="/makerslounge-photos/coffee-chat.jpeg"
                alt="Berto and Katy, founders of MakersLounge"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="font-semibold text-lg">Berto & Katy</p>
                <p className="text-sm text-white/80">Co-founders of MakersLounge</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="glass-card p-8 text-center hover:scale-[1.02] transition-transform duration-300">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden">
                <img
                  src="/Berto Mill_Headshot.jpg"
                  alt="Berto Mill"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="font-semibold text-xl mb-1">Berto Mill</h3>
              <p className="text-primary font-medium mb-4">Founder</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Berto started MakersLounge after experiencing firsthand how isolating it can be to build alone.
                He was deep in projects but had no one to build with, and knew others felt the same way.
                That frustration became the spark for a community where makers never have to go at it solo.
              </p>
            </Card>

            <Card className="glass-card p-8 text-center hover:scale-[1.02] transition-transform duration-300">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden">
                <img
                  src="/katy-headshot.jpeg"
                  alt="Katy Rozanova"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="font-semibold text-xl mb-1">Katy Rozanova</h3>
              <p className="text-primary font-medium mb-4">Co-founder</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Katy gave Berto the push to turn his desire to build with others into an actual community.
                She was pivotal in setting up the social presence, bringing in early members, and shaping
                MakersLounge from an idea into a real group of people showing up and creating together.
              </p>
            </Card>

            <Card className="glass-card p-8 text-center hover:scale-[1.02] transition-transform duration-300">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 overflow-hidden">
                <img
                  src="/vimal-headshot.jpeg"
                  alt="Vimal"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <h3 className="font-semibold text-xl mb-1">Vimal</h3>
              <p className="text-primary font-medium mb-4">Lead AI Instructor</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Vimal was the very first AI instructor at MakersLounge. With a deep background in artificial
                intelligence, he brought hands-on workshops and real expertise to the community from day one,
                helping makers learn to build with AI.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Our values
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                title: "Everyone belongs here",
                description:
                  "First project or fiftieth—your experience level doesn't matter. What matters is that you're building something.",
              },
              {
                title: "No gatekeeping",
                description:
                  "This isn't an exclusive club. If you're curious and want to create, you're one of us.",
              },
              {
                title: "Share early, share often",
                description:
                  "Your half-baked idea deserves to see the light. Get feedback, iterate, grow.",
              },
              {
                title: "Real connections over networking",
                description:
                  "We're not about collecting contacts. We're about finding people you genuinely want to build with.",
              },
            ].map((item, i) => (
              <Card key={i} className="glass-card p-6 hover:scale-[1.01] transition-transform duration-300">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/10">
            <div className="relative">
              <h2 className="text-2xl md:text-4xl font-bold mb-4">
                Ready to find your people?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Born in Toronto, growing everywhere. Join a community of makers who are
                building, learning, and supporting each other.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link href="/people">Explore the community</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full px-8 glass">
                  <Link href="/">Back to home</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>MakersLounge — Where builders connect</p>
        </div>
      </footer>
    </div>
  );
}
