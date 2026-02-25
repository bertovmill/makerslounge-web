"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const VALUES = [
  {
    title: "Trust",
    color: "from-blue-500 to-blue-600",
    accent: "bg-blue-500",
    lightBg: "from-blue-50/80 to-blue-50/20",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    description:
      "Trust is the foundation of everything we build. We earn it through transparency, consistency, and putting our community first.",
    principles: [
      {
        heading: "Transparent by default",
        text: "We share our decisions, our reasoning, and our roadmap openly. No hidden agendas, no surprises.",
      },
      {
        heading: "Privacy as a right",
        text: "Your data is yours. We collect only what we need and are upfront about how we use it.",
      },
      {
        heading: "Honest conversations",
        text: "We give real feedback, not empty encouragement. Growth comes from truth delivered with care.",
      },
    ],
  },
  {
    title: "Maker Success",
    color: "from-orange-500 to-orange-600",
    accent: "bg-orange-500",
    lightBg: "from-orange-50/80 to-orange-50/20",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    description:
      "Every decision we make is measured by one question: does this help makers succeed? If it doesn\u2019t move the needle for builders, we don\u2019t build it.",
    principles: [
      {
        heading: "Outcomes over features",
        text: "We don\u2019t ship for the sake of shipping. Every feature exists to help you build better, connect faster, or learn something new.",
      },
      {
        heading: "Lower the barriers",
        text: "Whether it\u2019s your first project or your fiftieth, we remove friction so you can focus on what matters \u2014 creating.",
      },
      {
        heading: "Celebrate the journey",
        text: "Success isn\u2019t just the finished product. We celebrate the messy middle \u2014 the prototypes, the pivots, the lessons learned.",
      },
    ],
  },
  {
    title: "Innovation",
    color: "from-teal-500 to-teal-600",
    accent: "bg-teal-500",
    lightBg: "from-teal-50/80 to-teal-50/20",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
    description:
      "We practice what we preach. As makers ourselves, we constantly experiment, iterate, and push boundaries to build a better platform for builders.",
    principles: [
      {
        heading: "AI-first thinking",
        text: "We use AI not as a buzzword but as a genuine tool to create connections and surface opportunities that humans alone would miss.",
      },
      {
        heading: "Build in public",
        text: "We share what we\u2019re working on, what\u2019s broken, and what we\u2019ve learned. Our community holds us accountable.",
      },
      {
        heading: "Ship > perfect",
        text: "Speed of iteration beats perfection. We\u2019d rather put something in your hands today and improve it tomorrow than wait for perfect.",
      },
    ],
  },
];

export default function ValuesPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[800px] h-[600px] bg-gradient-to-bl from-primary/8 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-accent/10 via-transparent to-transparent" />
      </div>

      {/* Hero */}
      <section className="relative py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            What We Stand For
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight">
            Our <span className="text-gradient">Values</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Three principles guide everything we do at MakersLounge — from the features we build to the community we nurture.
          </p>

          {/* Value quick-jump pills */}
          <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
            {VALUES.map((value, i) => (
              <a
                key={value.title}
                href={`#value-${i}`}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium bg-gradient-to-r ${value.color} text-white shadow-md hover:shadow-lg hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                {value.icon}
                {value.title}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 space-y-24">
          {VALUES.map((value, i) => (
            <div key={value.title} id={`value-${i}`} className="relative scroll-mt-24">
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white shadow-lg`}>
                  {value.icon}
                </div>
                <div>
                  <span className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                    Value {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold leading-tight">{value.title}</h2>
                </div>
              </div>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-3xl mb-10 leading-relaxed ml-[4.5rem]">
                {value.description}
              </p>

              {/* Principles */}
              <div className="grid md:grid-cols-3 gap-6">
                {value.principles.map((principle) => (
                  <Card
                    key={principle.heading}
                    className={`group p-6 border-0 bg-gradient-to-b ${value.lightBg} relative overflow-hidden transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-primary/30 motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${value.accent} transition-all duration-200 group-hover:h-1.5`} />
                    <h3 className="font-semibold text-lg mb-2 mt-2">{principle.heading}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{principle.text}</p>
                  </Card>
                ))}
              </div>

              {/* Divider */}
              {i < VALUES.length - 1 && (
                <div className="mt-24 flex items-center gap-4" aria-hidden="true">
                  <div className="flex-1 h-px bg-border" />
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Summary strip */}
      <section className="relative py-16 md:py-20 bg-muted/30" aria-label="Values summary">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {VALUES.map((value) => (
              <div key={value.title} className="flex flex-col items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white`}>
                  {value.icon}
                </div>
                <h3 className="font-bold text-xl">{value.title}</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  {value.principles.map((p) => p.heading).join(" \u00B7 ")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 via-accent/5 to-background border-primary/10">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">
              Values in action
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
              These aren&apos;t just words on a page. See how our values shape the community we&apos;re building.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-full px-8">
                <Link href="/about">Our Background</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 glass">
                <Link href="/people">Meet the Community</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
