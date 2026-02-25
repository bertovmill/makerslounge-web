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
    borderColor: "border-blue-200",
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
    borderColor: "border-orange-200",
    description:
      "Every decision we make is measured by one question: does this help makers succeed? If it doesn't move the needle for builders, we don't build it.",
    principles: [
      {
        heading: "Outcomes over features",
        text: "We don't ship for the sake of shipping. Every feature exists to help you build better, connect faster, or learn something new.",
      },
      {
        heading: "Lower the barriers",
        text: "Whether it's your first project or your fiftieth, we remove friction so you can focus on what matters — creating.",
      },
      {
        heading: "Celebrate the journey",
        text: "Success isn't just the finished product. We celebrate the messy middle — the prototypes, the pivots, the lessons learned.",
      },
    ],
  },
  {
    title: "Innovation",
    color: "from-teal-500 to-teal-600",
    accent: "bg-teal-500",
    lightBg: "from-teal-50/80 to-teal-50/20",
    borderColor: "border-teal-200",
    description:
      "We practice what we preach. As makers ourselves, we constantly experiment, iterate, and push boundaries to build a better platform for builders.",
    principles: [
      {
        heading: "AI-first thinking",
        text: "We use AI not as a buzzword but as a genuine tool to create connections and surface opportunities that humans alone would miss.",
      },
      {
        heading: "Build in public",
        text: "We share what we're working on, what's broken, and what we've learned. Our community holds us accountable.",
      },
      {
        heading: "Ship > perfect",
        text: "Speed of iteration beats perfection. We'd rather put something in your hands today and improve it tomorrow than wait for perfect.",
      },
    ],
  },
];

export default function ValuesPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
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
        </div>
      </section>

      {/* Values */}
      <section className="relative pb-16 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 space-y-20">
          {VALUES.map((value, i) => (
            <div key={value.title} className="relative">
              {/* Number */}
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${value.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold">{value.title}</h2>
              </div>

              {/* Description */}
              <p className="text-lg text-muted-foreground max-w-3xl mb-10 leading-relaxed">
                {value.description}
              </p>

              {/* Principles */}
              <div className="grid md:grid-cols-3 gap-6">
                {value.principles.map((principle) => (
                  <Card
                    key={principle.heading}
                    className={`p-6 border-0 bg-gradient-to-b ${value.lightBg} relative overflow-hidden hover:shadow-lg transition-all duration-300`}
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 ${value.accent}`} />
                    <h3 className="font-semibold text-lg mb-2 mt-2">{principle.heading}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{principle.text}</p>
                  </Card>
                ))}
              </div>

              {/* Divider */}
              {i < VALUES.length - 1 && (
                <div className="mt-20 flex items-center gap-4">
                  <div className="flex-1 h-px bg-border" />
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="flex-1 h-px bg-border" />
                </div>
              )}
            </div>
          ))}
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
